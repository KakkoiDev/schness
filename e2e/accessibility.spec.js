import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';

const require = createRequire(import.meta.url);
const axeSource = await readFile(require.resolve('axe-core/axe.min.js'), 'utf8');

const PAGES = ['/', '/watch.html', '/library.html', '/puzzles.html',
  '/game.html?game=00000000-0000-4000-8000-000000000001&mode=bot'];
const RULES = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];

// addScriptTag is subject to the page's own CSP, which has no unsafe-inline —
// and keeping it that way is the point of test/security.test.js. The audit
// runs with it bypassed so the policy never has to be relaxed for a test.
test.use({ bypassCSP: true });

const audit = (page, context = null) => page.evaluate(async ([rules, target]) => {
  const results = await globalThis.axe.run(target ? document.querySelector(target) : document,
    { runOnly: { type: 'tag', values: rules } });
  return results.violations.map((violation) => ({
    id: violation.id, impact: violation.impact, count: violation.nodes.length,
    help: violation.help, first: violation.nodes[0].target.join(' '),
  }));
}, [RULES, context]);

for (const theme of ['light', 'dark']) {
  test(`no accessibility violations in ${theme}`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('schness-theme', value), theme);
    for (const path of PAGES) {
      await page.goto(path);
      await page.waitForTimeout(600);
      await page.addScriptTag({ content: axeSource });
      expect(await audit(page), `${path} in ${theme}`).toEqual([]);
    }
  });
}

test('dialogs are clean too, opened the way a person opens them', async ({ page }) => {
  const openers = {
    'rules-dialog': 'header [data-open-rules]',
    'online-setup': '#play-online',
    'position-dialog': '#watch-edit',
    'sound-dialog': '[data-open-sound]',
  };
  for (const path of PAGES) {
    await page.goto(path);
    const ids = await page.locator('dialog').evaluateAll((dialogs) => dialogs.map((d) => d.id));
    for (const id of ids) {
      if (!openers[id] || !await page.locator(openers[id]).count()) continue;
      await page.evaluate(() => document.querySelectorAll('dialog[open]').forEach((d) => d.close()));
      await page.locator(openers[id]).click();
      await page.waitForTimeout(500);
      await page.addScriptTag({ content: axeSource });
      expect(await audit(page, `#${id}`), `${path} #${id}`).toEqual([]);
      await page.evaluate(() => document.querySelectorAll('dialog[open]').forEach((d) => d.close()));
    }
  }
});

test('every tab stop shows the focus ring, and the board draws its own', async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path);
    await page.waitForTimeout(400);
    const invisible = [];
    const seen = new Set();
    for (let step = 0; step < 40; step += 1) {
      await page.keyboard.press('Tab');
      const stop = await page.evaluate(() => {
        const element = document.activeElement;
        if (!element || element === document.body) return null;
        const style = getComputedStyle(element);
        return {
          name: element.id || String(element.className).split(' ')[0] || element.tagName,
          outline: style.outlineStyle, width: parseFloat(style.outlineWidth), color: style.outlineColor,
        };
      });
      if (!stop || seen.has(stop.name)) continue;
      seen.add(stop.name);
      // The board is one tab stop with the cursor tracked in JS; its indicator
      // is the inset ring on the cursor square, not an outline on the grid.
      if (stop.name === 'board' || stop.name === 'watch-board') continue;
      if (stop.outline === 'none' || stop.width < 2) invisible.push(`${stop.name} (${stop.outline} ${stop.width}px)`);
    }
    expect(seen.size, `${path} has no tab stops`).toBeGreaterThan(3);
    expect(invisible, path).toEqual([]);
  }
});

test('a dialog takes focus, gives it back, and closes on Escape', async ({ page }) => {
  await page.goto('/');
  await page.locator('header [data-open-rules]').focus();
  const before = await page.evaluate(() => document.activeElement.className);
  await page.keyboard.press('Enter');
  await expect(page.locator('#rules-dialog')).toBeVisible();
  expect(await page.evaluate(() =>
    document.querySelector('#rules-dialog').contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('#rules-dialog')).toBeHidden();
  expect(await page.evaluate(() => document.activeElement.className)).toBe(before);
});

test('the theme toggle says it is a switch, on every page', async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path);
    const toggle = page.locator('[data-theme-toggle]');
    // library.html and puzzles.html announced only the word "Dark", with
    // nothing to say it was a control or what it controlled. The label carries
    // it: `aria-pressed` would contradict a word that names the action rather
    // than the state, and would also draw the control as engaged.
    await expect(toggle, path).toHaveAttribute('aria-label', /Switch to (light|dark) mode/);
    expect(await toggle.getAttribute('aria-pressed'), path).toBe(null);
  }
});
