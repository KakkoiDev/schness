import { test, expect } from '@playwright/test';

for (const language of ['en', 'ja']) {
  for (const theme of ['light', 'dark']) {
    test(`shared UI fits all five pages in ${language} / ${theme}`, async ({ page }) => {
      await page.addInitScript(({ language, theme }) => {
        localStorage.setItem('schness-language', language);
        localStorage.setItem('schness-theme', theme);
        localStorage.setItem('schness-tutorial-seen', '1');
      }, { language, theme });
      for (const path of ['/', '/watch.html', '/library.html', '/puzzles.html', '/game.html?game=00000000-0000-4000-8000-000000000001&mode=bot']) {
        await page.goto(path);
        await expect(page.locator('[data-language-toggle]')).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('lang', language);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await expect(page.locator('[data-language-toggle]')).toHaveClass(/\bbtn\b/);
        const dimensions = await page.evaluate(() => ({
          content: document.documentElement.scrollWidth,
          screen: window.innerWidth,
          headerTargets: [...document.querySelectorAll('header .btn')]
            .filter((button) => button.getClientRects().length)
            .map((button) => button.getBoundingClientRect().height),
        }));
        expect(dimensions.content, path).toBeLessThanOrEqual(dimensions.screen + 1);
        if (path === '/puzzles.html') {
          const inset = await page.locator('.puzzle-settings').evaluate((card) => {
            const bounds = card.getBoundingClientRect();
            const levels = card.querySelector('.puzzle-levels').getBoundingClientRect();
            return { left: levels.left - bounds.left, right: bounds.right - levels.right,
              padding: parseFloat(getComputedStyle(card).paddingLeft) };
          });
          expect(inset.padding).toBeGreaterThanOrEqual(16);
          expect(inset.left).toBeGreaterThanOrEqual(16);
          expect(inset.right).toBeGreaterThanOrEqual(16);
        }
        for (const height of dimensions.headerTargets) expect(height, path).toBeGreaterThanOrEqual(44);
        const boards = page.locator('[data-schness-board="true"]');
        for (let index = 0; index < await boards.count(); index += 1) {
          await expect(boards.nth(index).locator('.square.btn')).toHaveCount(0);
        }
      }
    });
  }
}
test('arena selects have inset arrows and reserves clear the board', async ({ page }) => {
  await page.goto('/watch.html');
  const select = page.locator('select.select').first();
  const style = await select.evaluate(el => ({ padding: parseFloat(getComputedStyle(el).paddingRight), position: getComputedStyle(el).backgroundPosition }));
  expect(style.padding).toBeGreaterThanOrEqual(40);
  expect(style.position).toContain('16px');
  const spacing = await page.locator('.watch-stage').evaluate(el => {
    const seats = el.querySelectorAll('.watch-player');
    const board = el.querySelector('.board-frame').getBoundingClientRect();
    return { top: board.top - seats[0].getBoundingClientRect().bottom, bottom: seats[1].getBoundingClientRect().top - board.bottom };
  });
  expect(spacing.top).toBeGreaterThanOrEqual(9);
  expect(spacing.bottom).toBeGreaterThanOrEqual(9);
});

test('every desktop modal is viewport centered', async ({ page }) => {
  test.skip(page.viewportSize().width <= 760, 'Desktop placement only');
  for (const path of ['/', '/watch.html', '/library.html', '/puzzles.html', '/game.html?game=00000000-0000-4000-8000-000000000001&mode=bot']) {
    await page.goto(path);
    const ids = await page.locator('dialog').evaluateAll(dialogs => dialogs.map(dialog => dialog.id));
    for (const id of ids) {
      const geometry = await page.evaluate(id => {
        const dialog = document.getElementById(id);
        document.querySelectorAll('dialog[open]').forEach(open => open.close());
        dialog.showModal();
        const r = dialog.getBoundingClientRect();
        const result = { x: Math.abs(r.left + r.width / 2 - innerWidth / 2), y: Math.abs(r.top + r.height / 2 - innerHeight / 2) };
        dialog.close();
        return result;
      }, id);
      expect(geometry.x, path + '#' + id).toBeLessThanOrEqual(2);
      expect(geometry.y, path + '#' + id).toBeLessThanOrEqual(2);
    }
  }
});

test('Rules is available everywhere with an interactive board inside the modal', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('schness-tutorial-seen', '1'));
  for (const path of ['/', '/watch.html', '/library.html', '/puzzles.html', '/game.html?game=00000000-0000-4000-8000-000000000001&mode=bot']) {
    await page.goto(path);
    await page.locator('header [data-open-rules]').click();
    await expect(page.locator('#rules-dialog')).toBeVisible();
    await page.locator('[data-lesson="kings"]').click();
    await expect(page.locator('#rules-dialog #demo-board .square.placement')).toHaveCount(4);
    await page.locator('#demo-board .square.placement').first().click();
    await expect(page.locator('#demo-board .piece-black')).toHaveCount(1, { timeout: 10000 });
    await page.locator('.rules-confirm').click();
    await expect(page.locator('#rules-dialog')).not.toBeVisible();
  }
});
