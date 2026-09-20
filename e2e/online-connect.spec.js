import { test, expect } from '@playwright/test';

test('two independent browsers join the same online invite and exchange a move', async ({ browser, baseURL }) => {
  test.skip(test.info().project.name !== 'desktop', 'One network smoke test avoids duplicate public relay traffic');
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
    const url = new URL('/game.html?game=' + crypto.randomUUID() + '&mode=online', baseURL);
    await host.goto(url.href);
    await guest.goto(url.href);
    try {
      await expect(host.locator('#board')).toBeVisible({ timeout: 55_000 });
      await expect(guest.locator('#board')).toBeVisible({ timeout: 10_000 });
    } catch (error) {
      // One status line now carries the whole escalation; #search-stalled and
      // #search-quiet were deleted with the second and third paragraphs, and
      // probing them here only ever reported false.
      const details = await Promise.all([host, guest].map(async page => ({
        status: await page.locator('#search-status').textContent(),
        card: await page.locator('#network-card .card-state:not([hidden])').first().getAttribute('id').catch(() => null),
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
