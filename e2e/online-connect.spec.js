import { test, expect } from '@playwright/test';

test('two independent browsers join the same online invite and exchange a move', async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const first = await browser.newContext({ serviceWorkers: 'block' });
  const second = await browser.newContext({ serviceWorkers: 'block' });
  try {
    const host = await first.newPage();
    const guest = await second.newPage();
    const faults = [];
    for (const [name, page] of [['host', host], ['guest', guest]]) {
      page.on('pageerror', error => faults.push(name + ': ' + error.message));
      page.on('console', message => {
        if (message.type() === 'warning' || message.type() === 'error') faults.push(name + ': ' + message.text());
      });
    }
    const url = new URL('/game.html?game=7eadf00d-1234-4abc-8def-000000000001&mode=online', baseURL);
    await host.goto(url.href);
    await guest.goto(url.href);
    try {
      await expect(host.locator('#board')).toBeVisible({ timeout: 55_000 });
      await expect(guest.locator('#board')).toBeVisible({ timeout: 10_000 });
    } catch (error) {
      const details = await Promise.all([host, guest].map(async page => ({
        status: await page.locator('#search-status').textContent(),
        stalled: await page.locator('#search-stalled').isVisible(),
        quiet: await page.locator('#search-quiet').isVisible(),
      })));
      throw new Error(JSON.stringify({ details, faults, cause: error.message }));
    }
    const white = await host.locator('#human-name').textContent() === 'White' ? host : guest;
    const black = white === host ? guest : host;
    await white.locator('#board .square.placement').first().click();
    await expect(black.locator('#board .piece-white')).toHaveCount(1, { timeout: 10_000 });
  } finally {
    await first.close();
    await second.close();
  }
});
