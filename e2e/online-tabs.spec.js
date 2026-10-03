import { test, expect } from '@playwright/test';

/**
 * Two tabs of ONE browser play an online match: p2p-core finds the other tab
 * over a BroadcastChannel, with or without a relay. In a sandbox with no relay
 * this is the only online path that can run end to end (`online-connect.spec.js`
 * needs live public relays), so it is what proves the matchmaking handshake,
 * colours and the move channel still work after a transport change. In CI the
 * relays answer too, so the tabs also meet over WebRTC — one peer, two routes.
 */
test('two tabs of one browser join the same invite and exchange a move', async ({ browser, baseURL }) => {
  test.skip(test.info().project.name !== 'desktop', 'One online smoke test is enough');
  test.setTimeout(60_000);
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const faults = [];
  let step = 'open';
  try {
    const host = await context.newPage();
    const guest = await context.newPage();
    for (const [name, page] of [['host', host], ['guest', guest]]) {
      page.on('pageerror', (error) => faults.push(`${name}: ${error.message}`));
      page.on('console', (message) => {
        if (message.type() === 'error' && !/WebSocket connection|Failed to load resource/.test(message.text())) faults.push(`${name}: ${message.text()}`);
      });
    }
    const url = new URL('/game.html?game=' + crypto.randomUUID() + '&mode=online', baseURL);
    await host.goto(url.href);
    await guest.goto(url.href);
    try {
      step = 'match';
      await expect(host.locator('#board')).toBeVisible({ timeout: 20_000 });
      await expect(guest.locator('#board')).toBeVisible({ timeout: 10_000 });
      step = 'colours';
      const colours = await Promise.all([host, guest].map((page) => page.locator('#human-name').textContent()));
      expect(colours.slice().sort()).toEqual(['Black', 'White']);
      const white = colours[0] === 'White' ? host : guest;
      const black = white === host ? guest : host;
      // Two tabs share one window: only the front one gets animation frames, and
      // a click waits for frames to call the target stable.
      step = 'place';
      await white.bringToFront();
      await white.locator('#board .square.placement').first().click({ timeout: 10_000 });
      step = 'arrive';
      await black.bringToFront();
      await expect(black.locator('#board .piece-white')).toHaveCount(1, { timeout: 10_000 });
    } catch (error) {
      const details = await Promise.all([host, guest].map(async (page) => ({
        board: await page.locator('#board').isVisible().catch(() => null),
        status: await page.locator('#search-status').textContent().catch(() => null),
        card: await page.locator('#network-card .card-state:not([hidden])').first().getAttribute('id').catch(() => null),
        name: await page.locator('#human-name').textContent().catch(() => null),
        visibility: await page.evaluate(() => document.visibilityState).catch(() => null),
      })));
      throw new Error(JSON.stringify({ step, details, faults: faults.slice(0, 20), cause: error.message.split('\n')[0] }));
    }
  } finally {
    await context.close();
  }
});
