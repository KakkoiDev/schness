import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFile(resolve(root, file), 'utf8');

/**
 * The record is only worth trusting if it is current, and the one part of that
 * a test can actually check is coverage: every module is accounted for. Adding
 * a module without a line in the layer table fails here, which is the moment
 * to ask whether the rest of the file still tells the truth as well.
 */
test('every module in src/ appears in the decision record', async () => {
  const [decisions, files] = await Promise.all([read('DECISIONS.md'), readdir(resolve(root, 'src'))]);
  const missing = files
    .filter((file) => file.endsWith('.js'))
    .map((file) => file.replace(/\.js$/, ''))
    .filter((name) => !decisions.includes(`\`${name}\``));
  assert.deepEqual(missing, [], `undocumented in DECISIONS.md: ${missing.join(', ')}`);
});

test('the decision record still points at the things it claims to guard', async () => {
  const decisions = await read('DECISIONS.md');
  const tests = await readdir(resolve(root, 'test'));
  for (const named of decisions.match(/test\/[\w-]+\.test\.js/g) ?? []) {
    assert.ok(tests.includes(named.slice('test/'.length)), `${named} is cited but does not exist`);
  }
  // The invariants it names have to still be real files and real settings.
  assert.match(await read('sw.js'), /const CACHE = 'schness-v\d+'/);
  assert.match(await read('src/net.js'), /export const RELAYS = \[/);
});

test('agents are told to keep the record current', async () => {
  const claude = await read('CLAUDE.md');
  assert.match(claude, /DECISIONS\.md/);
  assert.match(claude, /same commit/i, 'the instruction has to say when, or it will not happen');
});

/**
 * `applyLegalAction` and `legalActionsUnchecked` skip the validation that makes
 * a move arriving from a peer safe. They exist for one caller — the search,
 * which produced the position itself. A comment saying so is not a guard: the
 * next agent reaching for something faster on the network path would find
 * exactly these, and nothing would object.
 */
test('only the bot may use the engine entry points that skip validation', async () => {
  const files = (await readdir(resolve(root, 'src'))).filter((file) => file.endsWith('.js'));
  const allowed = new Set(['rules.js', 'bot.js']);
  for (const file of files) {
    if (allowed.has(file)) continue;
    const source = await read(`src/${file}`);
    for (const shortcut of ['applyLegalAction', 'legalActionsUnchecked']) {
      assert.ok(!source.includes(shortcut),
        `src/${file} uses ${shortcut}, which skips validation — use applyAction/legalActions instead`);
    }
  }
  // And the peer path in particular, which is where it would actually matter.
  const peers = await read('src/game-message.js');
  assert.match(peers, /applyAction\(/);
});
