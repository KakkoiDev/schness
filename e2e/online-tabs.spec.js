import { test, expect } from '@playwright/test';

/**
 * Two tabs of ONE browser play an online match with no relay at all: p2p-core
 * finds the other tab over a BroadcastChannel. This is the only online path
 * the sandbox can exercise end to end (`online-connect.spec.js` needs live
 * public relays), so it is what proves the matchmaking handshake, colours and
 * the move channel still work after a transport change.
 */
test('two tabs of one browser join the same invite and exchange a move, with no relay', async ({ browser, baseURL }) => {
  test.skip(test.info().project.name !== 'desktop', 'One online smoke test is enough');
  test.setTimeout(60_000);
  const context = await browser.newContext({ serviceWorkers: 'block' });
  try {
    const host = await context.newPage();
    const guest = await context.newPage();
    const url = new URL('/game.html?game=' + crypto.randomUUID() + '&mode=online', baseURL);
    await host.goto(url.href);
    await guest.goto(url.href);
    await expect(host.locator('#board')).toBeVisible({ timeout: 20_000 });
    await expect(guest.locator('#board')).toBeVisible({ timeout: 10_000 });
    const colours = await Promise.all([host, guest].map((page) => page.locator('#human-name').textContent()));
    expect(colours.sort()).toEqual(['Black', 'White']);
    const white = colours[0] === 'White' ? host : guest;
    const black = white === host ? guest : host;
    // Two tabs share one window: only the front one gets animation frames, and
    // a click waits for frames to call the target stable.
    await white.bringToFront();
    await white.locator('#board .square.placement').first().click();
    await black.bringToFront();
    await expect(black.locator('#board .piece-white')).toHaveCount(1, { timeout: 10_000 });
  } finally {
    await context.close();
  }
});
