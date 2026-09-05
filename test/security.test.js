import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFile(resolve(root, file), 'utf8');

/**
 * The XSS surface is closed by construction — peer text goes through
 * `textContent` and nothing builds markup from strings — and that is one
 * careless line from being untrue. This is the grep that keeps it true, and
 * the CSP below is what catches the line this grep does not think of.
 */
test('nothing in the app builds DOM from a string', async () => {
  const files = (await readdir(resolve(root, 'src'))).filter((file) => file.endsWith('.js'));
  for (const file of files) {
    const source = await read(`src/${file}`);
    for (const sink of ['innerHTML', 'outerHTML', 'insertAdjacentHTML', 'document.write', 'eval(', 'new Function(']) {
      assert.ok(!source.includes(sink), `src/${file} uses ${sink}`);
    }
  }
});

test('both pages carry the same Content-Security-Policy, and nothing inline', async () => {
  const policies = [];
  for (const page of ['index.html', 'game.html']) {
    const html = await read(page);
    const meta = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);
    assert.ok(meta, `${page} ships no CSP`);
    policies.push(meta[1]);
    // GitHub Pages cannot set headers, so the policy has to live in the document.
    assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>[^<]*\S[^<]*<\/script>/, `${page} has an inline script`);
    assert.doesNotMatch(html, /\son[a-z]+="/i, `${page} has an inline event handler`);
    assert.doesNotMatch(html, /<style[\s>]/, `${page} has an inline stylesheet`);
  }
  assert.equal(policies[0], policies[1], 'the two pages disagree about the policy');
  const policy = policies[0];
  // What the app needs and nothing else: modules and the worker from here, the
  // relays over wss (the list is append-only, so a scheme, not hostnames),
  // peer media as stream objects. No 'unsafe-inline' anywhere.
  assert.match(policy, /default-src 'self'/);
  assert.match(policy, /connect-src 'self' wss:/);
  assert.match(policy, /worker-src 'self'/);
  assert.match(policy, /media-src 'self' blob: mediastream:/);
  assert.match(policy, /object-src 'none'/);
  assert.doesNotMatch(policy, /unsafe-inline|unsafe-eval|\*/);
});
