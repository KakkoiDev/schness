import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('every service-worker shell entry exists', async () => {
  const source = await readFile(resolve(root, 'sw.js'), 'utf8');
  const shell = source.match(/const SHELL = \[([\s\S]*?)\];/)?.[1] ?? '';
  const paths = [...shell.matchAll(/'\.\/(.*?)'/g)].map((match) => match[1]).filter(Boolean);
  assert.ok(paths.length >= 10);
  await Promise.all(paths.map((path) => access(resolve(root, path))));
});

test('manifest describes a standalone app with a local icon', async () => {
  const manifest = JSON.parse(await readFile(resolve(root, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, './');
  assert.ok(manifest.icons.every((icon) => icon.src.startsWith('./')));
});
