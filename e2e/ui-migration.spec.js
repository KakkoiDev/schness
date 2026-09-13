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
          expect(inset.padding).toBeGreaterThanOrEqual(14);
          expect(inset.left).toBeGreaterThanOrEqual(14);
          expect(inset.right).toBeGreaterThanOrEqual(14);
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
