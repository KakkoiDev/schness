import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** WCAG relative luminance, from a #rrggbb string. */
function luminance(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [value >> 16 & 255, value >> 8 & 255, value & 255]
    .map((channel) => channel / 255)
    .map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(foreground, background) {
  const [a, b] = [luminance(foreground), luminance(background)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** The tokens as the browser would resolve them, read out of the stylesheet. */
async function theme(selector) {
  const css = await readFile(resolve(root, 'styles.css'), 'utf8');
  const block = css.slice(css.indexOf(selector));
  const tokens = {};
  for (const [, name, hex] of block.slice(0, block.indexOf('}')).matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)) {
    tokens[name] = hex.toLowerCase();
  }
  return tokens;
}

// Text sits on the page, on a card, or on the sunk strips; all three count.
const SURFACES = ['paper', 'surface', 'sunk'];

for (const [name, selector] of [['light', ':root {'], ['dark', ':root[data-theme="dark"]']]) {
  test(`${name} body text clears WCAG AA on every surface it lands on`, async () => {
    const tokens = await theme(selector);
    for (const ink of ['ink', 'muted']) {
      for (const surface of SURFACES) {
        const contrast = ratio(tokens[ink], tokens[surface]);
        assert.ok(contrast >= 4.5,
          `--${ink} on --${surface} is ${contrast.toFixed(2)}:1, under the 4.5 needed`);
      }
    }
  });

  test(`${name} link text clears WCAG AA, which the fill accent does not have to`, async () => {
    const tokens = await theme(selector);
    // --accent stays bright for dots, fills and focus rings, where the text
    // rule does not apply. --accent-text is the one that has to be readable.
    for (const surface of SURFACES) {
      const contrast = ratio(tokens['accent-text'], tokens[surface]);
      assert.ok(contrast >= 4.5,
        `--accent-text on --${surface} is ${contrast.toFixed(2)}:1, under the 4.5 needed`);
    }
  });
}

test('a comfortable margin, not a hairline pass', async () => {
  // --muted on --paper was 4.4954:1 — it displayed as "4.50" and failed.
  // Anything this close to the line breaks on the next nudge to a token.
  const tokens = await theme(':root {');
  assert.ok(ratio(tokens.muted, tokens.paper) >= 4.6);
  assert.ok(ratio(tokens['accent-text'], tokens.paper) >= 4.6);
});
