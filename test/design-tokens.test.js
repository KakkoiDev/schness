import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sheets = () => Promise.all(['styles.css', 'ui.css']
  .map(async (name) => [name, await readFile(resolve(root, name), 'utf8')]));

/** Declarations of one property, with the block they sit in, across both sheets. */
async function declarations(property) {
  const found = [];
  for (const [name, css] of await sheets()) {
    for (const match of css.matchAll(new RegExp(`${property}\\s*:\\s*([^;}]+)`, 'g'))) {
      found.push({ name, value: match[1].trim() });
    }
  }
  return found;
}

// Seventeen radii and thirty-one shadows is not a scale, it is a history. The
// counts below are the scale; a new literal here means a decision nobody made.
test('every radius is one of the three tokens, the pill, or a shape', async () => {
  const allowed = new Set([
    'var(--radius-control)', 'var(--radius-card)', 'var(--radius-dialog)',
    'var(--radius-pill)', '50%', '0', 'inherit',
  ]);
  for (const { name, value } of await declarations('border-radius')) {
    for (const corner of value.split(/\s+(?![^(]*\))/)) {
      assert.ok(allowed.has(corner), `${name}: border-radius ${value} uses ${corner}`);
    }
  }
});

test('exactly three radius tokens are defined', async () => {
  const [, css] = (await sheets())[0];
  const defined = [...css.matchAll(/--radius-(control|card|dialog):/g)].map((m) => m[1]);
  assert.deepEqual(defined.sort(), ['card', 'control', 'dialog']);
});

// Resting surfaces get a hairline border. Only a dialog, a floating panel or a
// piece in flight is allowed to look like it is off the page.
test('only two elevations exist, and nothing at rest casts one', async () => {
  const outer = (await declarations('box-shadow'))
    .filter(({ value }) => value !== 'none' && !value.startsWith('inset'));
  for (const { name, value } of outer) {
    assert.equal(value, 'var(--shadow-dialog)', `${name}: box-shadow ${value} is not the one elevation`);
  }
  const [, css] = (await sheets())[0];
  const tokens = new Set([...css.matchAll(/--shadow-([\w-]+):/g)].map((m) => m[1]));
  assert.deepEqual([...tokens].sort(), ['dialog', 'lift']);
});

test('a ring is drawn as an outline, so it never counts as an elevation', async () => {
  const [, css] = (await sheets())[0];
  // `0 0 0 Npx` shadows are rings wearing a shadow's clothes; they read as
  // elevation in any count of the sheet and behave differently under a radius.
  assert.doesNotMatch(css, /box-shadow:\s*0 0 0 /);
});

test('the focus ring is the accent, 2px, and offset from what it marks', async () => {
  const [, css] = (await sheets())[0];
  assert.match(css, /:focus-visible[^{]*\{\s*outline:\s*2px solid var\(--focus\);\s*outline-offset:\s*2px/);
  assert.match(css, /:root \{[\s\S]*?--focus:var\(--accent\)/);
  assert.match(css, /:root\[data-theme="dark"\] \{[\s\S]*?--focus:var\(--accent\)/);
});

test('two weights, and the type stack is named once', async () => {
  for (const { name, value } of await declarations('font-weight')) {
    assert.ok(['400', '640'].includes(value), `${name}: font-weight ${value}`);
  }
  const [, styles] = (await sheets())[0];
  assert.match(styles, /--font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif;/);
  assert.match(styles, /--font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;/);
  // The Japanese faces are appended to the one stack, never swapped in: a JA
  // page that changes font-family renders "Sharp v2" in a different face.
  assert.doesNotMatch(styles, /\[lang="ja"\][^{]*\{[^}]*font-family/);
});

test('the board squares are far enough apart to count at a glance', async () => {
  const [, css] = (await sheets())[0];
  const luminance = (hex) => {
    const value = Number.parseInt(hex.slice(1), 16);
    return [value >> 16 & 255, value >> 8 & 255, value & 255]
      .map((channel) => channel / 255)
      .map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
      .reduce((total, channel, index) => total + [0.2126, 0.7152, 0.0722][index] * channel, 0);
  };
  for (const selector of [':root {', ':root[data-theme="dark"]']) {
    const block = css.slice(css.indexOf(selector));
    const light = block.match(/--board-light:(#[0-9a-f]{6})/i)[1];
    const dark = block.match(/--board-dark:(#[0-9a-f]{6})/i)[1];
    const [a, b] = [luminance(light), luminance(dark)];
    const contrast = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    assert.ok(contrast >= 4, `${selector} board squares are ${contrast.toFixed(2)}:1 apart`);
  }
});
