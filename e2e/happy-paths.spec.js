import { expect, test } from '@playwright/test';

const GAME_ID = '00000000-0000-4000-8000-000000000001';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('schness-tutorial-seen', '1');
    if (!localStorage.getItem('schness-language')) localStorage.setItem('schness-language', 'en');
  });
});

test('lobby settings, language, theme, rules and online invitation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Schness home' })).toBeVisible();
  await page.getByRole('button', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('[data-language-toggle]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  await page.locator('[data-language-toggle]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByRole('button', { name: 'Rules', exact: true }).click();
  await expect(page.getByRole('dialog', { name: /Schness in four rules/ })).toBeVisible();
  await page.getByRole('button', { name: 'Start playing' }).click();
  await page.getByRole('button', { name: /Create an online game/ }).click();
  await expect(page.getByRole('dialog', { name: 'Choose a time control' })).toBeVisible();
  await page.locator('#online-setup label:has(input[value="3+2"])').click();
  await expect(page.locator('#online-setup input[value="3+2"]')).toBeChecked();
  await page.getByRole('button', { name: 'Create invitation link' }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('schness-clock'))).toBe('3+2');
  await expect(page).toHaveURL(/game\.html\?game=[0-9a-f-]{36}&mode=online/);
  await expect(page.getByRole('heading', { name: 'Send this link' })).toBeVisible();
  await expect(page.getByLabel('Match link')).toHaveValue(/mode=online/);
});

test('the homepage opens the arena with visible training controls', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#replay-tutorial')).toHaveCount(0);
  // The card is an <a href> now, and "Bot arena" is also a nav link.
  await page.locator('#bot-arena').click();
  await expect(page).toHaveURL(/watch\.html/);
  // Training tools are one of the quiet items now, so they start folded — but
  // they are on this page, which is where all standard bot play happens.
  await expect(page.locator('#watch-training summary')).toBeVisible();
  await page.locator('#watch-training summary').click();
  await expect(page.locator('#watch-training-mate')).toBeVisible();
  await expect(page.locator('#watch-training-advantage')).toBeVisible();
  await page.locator('#watch-training-mate').check();
  await page.locator('#watch-training-advantage').check();
  await expect(page.locator('#watch-analysis-bar')).toBeHidden();
  await page.locator('#watch-board .square.placement').first().click();
  await expect(page.locator('#watch-analysis-bar')).toBeVisible({ timeout: 20_000 });
});

test('training warns the defender of forced mate before they move', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => sessionStorage.setItem('schness-arena-position', JSON.stringify({
    turn: 'black', board: [
      { owner: 'black', piece: 'rook' }, { owner: 'black', piece: 'king' }, null, null,
      { owner: 'black', piece: 'knight' }, null, { owner: 'white', piece: 'rook' }, { owner: 'white', piece: 'bishop' },
      null, { owner: 'white', piece: 'king' }, { owner: 'black', piece: 'bishop' }, null,
      null, null, { owner: 'white', piece: 'knight' }, null,
    ],
  })));
  await page.goto('/watch.html?position=library');
  await page.locator('#human-side').selectOption('black');
  await page.locator('#watch-training summary').click();
  await page.locator('#watch-training-mate').check();
  await expect(page.locator('#watch-training-warning')).toContainText('Danger: White can force mate in 1', { timeout: 10_000 });
  const before = await page.locator('#watch-board').boundingBox();
  await page.locator('#watch-training-advantage').check();
  await expect(page.locator('#watch-analysis-bar')).toBeVisible();
  await expect(page.locator('#watch-analysis-score')).toBeVisible();
  await expect(page.locator('#watch-analysis-bar .analysis-side')).toHaveText(['B', 'W']);
  const rail = await page.locator('#watch-analysis-bar').evaluate((element) => {
    const bar = getComputedStyle(element);
    const fill = getComputedStyle(element.querySelector('.analysis-fill'));
    const track = element.querySelector('.analysis-track').getBoundingClientRect();
    const bounds = element.getBoundingClientRect();
    return {
      clipped: bar.overflow === 'hidden',
      fillRadius: fill.borderRadius,
      trackHeight: track.height,
      railHeight: bounds.height,
      mobileWidth: bounds.width,
    };
  });
  expect(rail.clipped).toBe(true);
  expect(rail.fillRadius).toBe('0px');
  expect(Math.abs(rail.trackHeight - rail.railHeight)).toBeLessThan(1);
  expect(rail.mobileWidth).toBeGreaterThanOrEqual(16);
  const after = await page.locator('#watch-board').boundingBox();
  expect(Math.abs(before.width - after.width)).toBeLessThan(1);
});

test('interactive tutorial uses the shared board and answers a king placement', async ({ page }) => {
  await page.goto('/');
  await page.locator('header [data-open-rules]').click();
  await page.getByRole('button', { name: 'Try placing the kings' }).click();
  const board = page.locator('#demo-board[data-schness-board="true"]');
  await expect(board).toBeVisible();
  await expect(board.locator('.square.placement.target')).toHaveCount(4);
  await board.locator('.square.placement').first().click();
  await expect(board.locator('.piece-black')).toHaveCount(1, { timeout: 10_000 });
  await expect(page.locator('#demo-white-reserve .bank-piece, #demo-white-reserve .bank-slot')).toHaveCount(3);
});

test('drag pickup hides its source and an illegal drop restores it', async ({ page }) => {
  await page.goto('/');
  await page.locator('header [data-open-rules]').click();
  await page.getByRole('button', { name: 'Try moving or deploying' }).click();
  const source = page.locator('#demo-board .square').filter({ has: page.locator('.piece-white') }).first();
  const box = await source.boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await source.dispatchEvent('pointerdown', {
    pointerId: 1, pointerType: 'touch', isPrimary: true, buttons: 1, clientX: x, clientY: y,
  });
  await page.locator('body').dispatchEvent('pointermove', {
    pointerId: 1, pointerType: 'touch', isPrimary: true, buttons: 1, clientX: x + 20, clientY: y + 20,
  });
  await expect(source).toHaveClass(/drag-source/);
  await expect(source.locator('.piece')).toHaveCSS('visibility', 'hidden');
  await expect(page.locator('.drag-ghost')).toHaveCount(1);
  await page.locator('body').dispatchEvent('pointerup', {
    pointerId: 1, pointerType: 'touch', isPrimary: true, buttons: 0, clientX: 2, clientY: 2,
  });
  await expect(source.locator('.piece')).toHaveCSS('visibility', 'visible');
  await expect(page.locator('.drag-ghost')).toHaveCount(0);
});

test('bot game supports White and Black with the same board and reserves', async ({ page }) => {
  await page.goto(`/game.html?game=${GAME_ID}&mode=bot`);
  const board = page.locator('#board[data-schness-board="true"]');
  await expect(board).toBeVisible();
  await expect(page.locator('#human-bank > *')).toHaveCount(3);
  await expect(page.locator('#opponent-bank > *')).toHaveCount(3);
  await expect(board.locator('.square.placement')).toHaveCount(4);
  await page.getByRole('button', { name: 'Play Black' }).click();
  await expect(page.locator('#human-name')).toHaveText('Black');
  await expect(board).toHaveAttribute('data-orientation', 'black');
  await expect(board.locator('.piece-white')).toHaveCount(1, { timeout: 10_000 });
  await expect(board.locator('.square.placement')).toHaveCount(4);
});

test('bot training toggles mate search and the estimated advantage independently', async ({ page }) => {
  await page.goto(`/game.html?game=${GAME_ID}&mode=bot`);
  await expect(page.locator('#training-panel')).toBeVisible();
  await expect(page.locator('#training-bar')).toBeHidden();
  await page.locator('#training-advantage').check();
  // The opening king-placement phase is intentionally not an evaluable position.
  await expect(page.locator('#training-bar')).toBeHidden();
  await page.locator('#board .square.placement').first().click();
  await expect(page.locator('#training-bar')).toBeVisible({ timeout: 20_000 });
  await page.locator('#training-mate').check();
  await expect(page.locator('#training-warning')).toBeVisible();
  await page.locator('#training-advantage').uncheck();
  await expect(page.locator('#training-bar')).toBeHidden();
});

test('online matches do not expose training assistance', async ({ page }) => {
  await page.goto(`/game.html?game=${GAME_ID}&mode=online`);
  await expect(page.locator('#training-panel')).toBeHidden();
});

test('recorded game analysis is opt-in and tracks replay', async ({ page }) => {
  await page.goto('/library.html');
  await page.locator('.library-game').first().click();
  await page.locator('#replay-next').click();
  await page.locator('#replay-next').click();
  await page.locator('#replay-advantage').check();
  await expect(page.locator('#replay-bar')).toBeVisible();
  await expect(page.locator('#replay-score')).not.toHaveText('Analyzing…', { timeout: 20_000 });
  await page.locator('#replay-advantage').uncheck();
  await expect(page.locator('#replay-bar')).toBeHidden();
});

test('checked king has a visible labeled warning on the real game board', async ({ page }) => {
  await installColorProbe(page);
  await page.goto(`/game.html?game=${GAME_ID}&mode=bot`);
  const square = page.locator('#board .square[data-square="15"]');
  await page.evaluate(async () => {
    const { renderBoard } = await import('./src/board-ui.js');
    const { createPosition } = await import('./src/rules.js');
    const board = Array(16).fill(null);
    board[0] = { owner: 'black', piece: 'king' };
    board[11] = { owner: 'black', piece: 'rook' };
    board[15] = { owner: 'white', piece: 'king' };
    renderBoard(document.querySelector('#board'), createPosition({
      board, banks: { white: ['rook', 'bishop', 'knight'], black: ['bishop', 'knight'] }, turn: 'white',
    }), { checked: new Set([15]), label: (index, occupant) => occupant
      ? `${occupant.owner} ${occupant.piece}, square ${index + 1}${index === 15 ? ', in check' : ''}`
      : `Empty square ${index + 1}` });
  });
  await expect(square).toHaveClass(/in-check/);
  await expect(square).toHaveAttribute('aria-label', /white king.*in check/);
  expect(await square.evaluate((element) => getComputedStyle(element, '::before').content)).toBe('"CHECK"');
  expect(await square.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe('none');
  // The checkerboard rule has higher specificity on dark squares. Check both
  // colors: the original test only sampled a light square and missed the bug.
  const darkSquare = page.locator('#board .square[data-square="14"]');
  await darkSquare.evaluate((element) => element.classList.add('in-check'));
  for (const theme of ['light', 'dark']) {
    await page.locator('html').evaluate((element, value) => { element.dataset.theme = value; }, theme);
    for (const checkedSquare of [square, darkSquare]) {
      const colors = await checkedSquare.evaluate((element) => ({
        square: getComputedStyle(element).backgroundColor,
        // Resolved through the element, so the assertion is "the square is
        // painted with --check-square" rather than a hex copied into the test.
        palette: paintedColor(element, '--check-square'),
        image: getComputedStyle(element).backgroundImage,
      }));
      expect(colors.palette).toBeTruthy();
      expect(colors.square).toBe(colors.palette);
      expect(colors.image).toBe('none');
    }
  }
});

/**
 * The rgb() a custom property actually paints, resolved through the element it
 * is read from. Copying the hex into the test made a token change look like a
 * regression; this checks the rule ("the checked square is --check-square")
 * rather than the value.
 */
async function installColorProbe(page) {
  await page.addInitScript(() => {
    globalThis.paintedColor = (element, property) => {
      const probe = document.createElement('span');
      probe.style.color = getComputedStyle(element).getPropertyValue(property).trim();
      document.body.append(probe);
      const painted = getComputedStyle(probe).color;
      probe.remove();
      return painted;
    };
  });
}

test('a real checked position highlights its king in Bot Arena, not just the status', async ({ page }) => {
  await installColorProbe(page);
  await page.addInitScript(() => {
    const board = Array(16).fill(null);
    board[0] = { owner: 'black', piece: 'king' };
    board[10] = { owner: 'black', piece: 'rook' };
    board[14] = { owner: 'white', piece: 'king' };
    sessionStorage.setItem('schness-arena-position', JSON.stringify({ board, turn: 'white' }));
  });
  await page.goto('/watch.html?position=library');
  await expect(page.locator('#watch-status')).toContainText('CHECK');
  const king = page.locator('#watch-board .square[data-square="14"]');
  await expect(king).toHaveClass(/in-check/);
  await expect(king).toHaveAttribute('aria-label', /white king/);
  for (const theme of ['light', 'dark']) {
    await page.locator('html').evaluate((element, value) => { element.dataset.theme = value; }, theme);
    const colors = await king.evaluate((element) => ({
      square: getComputedStyle(element).backgroundColor,
      palette: paintedColor(element, '--check-square'),
    }));
    expect(colors.palette).toBeTruthy();
    expect(colors.square).toBe(colors.palette);
  }
});

test('Bot Arena plays, reviews, edits and never scrolls the page for history', async ({ page }) => {
  await page.goto('/watch.html');
  const board = page.locator('#watch-board[data-schness-board="true"]');
  await expect(board).toBeVisible();
  // Who sits where is one decision; a strength control exists for each side
  // that actually has a bot on it.
  await page.locator('#human-side').selectOption('watch');
  await page.locator('#white-level').selectOption('learning');
  await page.locator('#black-level').selectOption('learning');
  await expect(page.locator('#watch-moves button')).not.toHaveCount(0, { timeout: 15_000 });
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.waitForTimeout(1200);
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
  await page.locator('#watch-auto').click();
  await page.locator('#watch-previous').click();
  await expect(page.locator('#watch-status')).toContainText('Reviewing');
  await expect(page.locator('#watch-eyebrow')).toHaveText('Reviewing');
  await page.locator('#watch-edit').click();
  await expect(page.locator('#position-board[data-schness-board="true"]')).toBeVisible();
  await page.locator('#position-close').click();
});

test('game library filters and replays the full shared position with both reserves', async ({ page }) => {
  await page.goto('/library.html');
  await expect(page.locator('.library-game').first()).toBeVisible({ timeout: 15_000 });
  await page.locator('#filter-version').selectOption('Sharp v2');
  await expect(page.locator('#filter-count')).toContainText('unique');
  await page.locator('.library-game').first().click();
  const board = page.locator('#replay-board[data-schness-board="true"]');
  await expect(board).toBeVisible();
  await expect(page.locator('#replay-white-reserve > *')).toHaveCount(3);
  await expect(page.locator('#replay-black-reserve > *')).toHaveCount(3);
  await page.locator('#replay-next').click();
  await page.locator('#replay-next').click();
  await expect(page.locator('#replay-status')).toContainText('Ply 2');
  await expect(page.locator('#replay-play-here')).toBeEnabled();
  await page.locator('#replay-play-here').click();
  await expect(page).toHaveURL(/watch\.html\?position=library/);
  await expect(page.locator('#watch-board[data-schness-board="true"]')).toBeVisible();
});

test('a finished archived mate says CHECKMATE on the king square, never just CHECK', async ({ page }) => {
  await page.goto('/library.html');
  await expect(page.locator('.library-game').first()).toBeVisible({ timeout: 15_000 });
  await page.locator('#filter-result').selectOption('w');
  await page.locator('.library-game').first().click();
  await page.locator('#replay-moves button').last().click();
  await expect(page.locator('#replay-status')).toContainText('White won');
  const king = page.locator('#replay-board .square.in-checkmate');
  await expect(king).toHaveCount(1);
  await expect(king).toHaveAttribute('aria-label', /black king.*in checkmate/);
  expect(await king.evaluate((element) => getComputedStyle(element, '::before').content)).toBe('"CHECKMATE"');
});

test('puzzle mix, hidden depth, solution and next puzzle stay playable on mobile', async ({ page }) => {
  await page.goto('/puzzles.html');
  const board = page.locator('#puzzle-board[data-schness-board="true"]');
  await expect(board).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#puzzle-top-reserve > *')).toHaveCount(3);
  await expect(page.locator('#puzzle-bottom-reserve > *')).toHaveCount(3);
  await page.getByLabel('Mate 3').uncheck();
  await page.getByLabel('Mate 4').uncheck();
  await page.getByLabel('Hide mate depth').check();
  await expect(page.locator('#puzzle-prompt')).toContainText('find the fastest mate');
  await page.getByRole('button', { name: 'Solution' }).click();
  await expect(page.locator('#puzzle-feedback')).toHaveAttribute('data-state', 'revealed', { timeout: 10_000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.locator('#puzzle-feedback')).toHaveAttribute('data-state', 'ready');
});

test('arena has an explicit White or Black human seat and preserves bot strength', async ({ page }) => {
  await page.goto('/watch.html');
  await page.locator('#black-level').selectOption('sharp');
  await page.locator('#human-side').selectOption('black');
  await expect(page.locator('#black-level')).toHaveValue('human');
  await expect(page.locator('#white-level')).toHaveValue('sharp');
  await expect(page.locator('#watch-board .piece-white')).toHaveCount(1, { timeout: 20_000 });
  await expect(page.locator('#watch-board .square.placement')).toHaveCount(4);
  await page.locator('#watch-board .square.placement').first().click();
  await expect(page.locator('#watch-board .piece-black')).toHaveCount(1);
  await page.locator('#human-side').selectOption('white');
  await expect(page.locator('#white-level')).toHaveValue('human');
  await expect(page.locator('#black-level')).toHaveValue('sharp');
  await expect(page.locator('#watch-board .piece-white')).toHaveCount(0);
  await expect(page.locator('#watch-board .square.placement')).toHaveCount(4);
});

test('move history coordinates toggle labels on the board', async ({ page }) => {
  await page.goto('/watch.html');
  await expect(page.locator('.coordinate-toggle').first()).not.toBeChecked();
  await expect(page.locator('#watch-board .square-coordinate').first()).toBeHidden();
  await page.locator('.coordinate-toggle').first().check();
  await expect(page.locator('#watch-board .square-coordinate')).toHaveCount(16);
  await expect(page.locator('#watch-board .square-coordinate').first()).toBeVisible();
  await expect(page.locator('#watch-board .square[data-square="12"] .square-coordinate')).toHaveText('a1');
  await page.locator('.coordinate-toggle').first().click();
  await expect(page.locator('#watch-board .square-coordinate').first()).toBeHidden();
});

test('the home page is already a game, and the arena inherits the position', async ({ page }) => {
  await page.goto('/');
  const board = page.locator('#lobby-play');
  if (page.viewportSize().width <= 760) {
    // Deliberately absent on a phone: it pushes the four actions below the
    // fold, so the mobile home stays a menu.
    await expect(board).toBeHidden();
    return;
  }
  await expect(page.locator('#lobby-board .square.placement')).toHaveCount(4);
  await page.locator('#lobby-board .square.placement').first().click();
  // Black answers with its own king, from the same worker the match page runs.
  await expect(page.locator('#lobby-board .piece')).toHaveCount(2, { timeout: 15_000 });
  await expect(page.locator('#lobby-status')).toHaveText('Your move.');
  // "Take this position further" has to be true, not a slogan.
  await page.locator('#bot-arena').click();
  await expect(page).toHaveURL(/watch\.html\?position=library/);
  await expect(page.locator('#watch-board .piece')).toHaveCount(2);
});

test('the rules never open themselves, even on a first visit', async ({ page }) => {
  await page.context().clearCookies();
  await page.addInitScript(() => localStorage.removeItem('schness-tutorial-seen'));
  await page.goto('/');
  await page.waitForTimeout(1000);
  // It used to open over the lobby the first time, which now means over a
  // board with a game already on it.
  await expect(page.locator('#rules-dialog')).toBeHidden();
  await page.locator('header [data-open-rules]').click();
  await expect(page.locator('#rules-dialog')).toBeVisible();
});

test('the waiting card carries the link, a scannable code and a way out', async ({ page }) => {
  await page.goto(`/game.html?game=${GAME_ID}&mode=online`);
  await expect(page.locator('#card-waiting')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByLabel('Match link')).toHaveValue(/mode=online/);
  // Copy is the only primary on this card: it is the one thing to do.
  await expect(page.locator('#card-waiting .card-primary')).toHaveCount(1);
  await expect(page.locator('#invite-qr svg')).toBeVisible();
  // Dark on light, whatever the theme: a themed code is one that does not scan.
  const ground = await page.locator('#invite-qr').evaluate((element) =>
    getComputedStyle(element).getPropertyValue('--qr-paper').trim());
  expect(ground).toBe('#fff');
  // Present from the first second, so nobody has to fail first to find it.
  await expect(page.locator('#waiting-bot')).toBeVisible();
  await expect(page.locator('#search-stalled, #search-quiet')).toHaveCount(0);

  // The status escalates without the card changing height.
  const card = page.locator('#network-card');
  const heights = [];
  for (const [waited, stalled] of [[0, false], [25_000, false], [95_000, false], [30_000, true]]) {
    await page.evaluate(async ([elapsed, dead]) => {
      const { searchMessage } = await import('./src/matchmaking.js');
      document.querySelector('#search-status').textContent = searchMessage(elapsed, dead);
    }, [waited, stalled]);
    heights.push(Math.round((await card.boundingBox()).height));
  }
  expect(new Set(heights).size, `card heights ${heights.join(' / ')}`).toBe(1);
});

test('claiming a forfeit is disabled until the countdown reaches zero', async ({ page }) => {
  await page.goto(`/game.html?game=${GAME_ID}&mode=bot`);
  // The rule is already that the opponent gets the countdown. A live button
  // that silently refuses, and one that lets you claim early, both misstate it.
  await expect(page.locator('#claim-win')).toBeDisabled();
  await expect(page.locator('#claim-note')).toHaveText('Claiming unlocks at 0:00.');
  const drawn = await page.locator('#claim-win').evaluate((element) => getComputedStyle(element).opacity);
  expect(drawn, 'disabled is drawn, not dimmed').toBe('1');
});

test('an online match never opens with a live microphone or camera', async ({ page }) => {
  await page.addInitScript(() => {
    globalThis.__mediaRequests = [];
    const ask = async (constraints) => {
      globalThis.__mediaRequests.push(constraints);
      throw new DOMException('denied in test', 'NotAllowedError');
    };
    Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: ask }, configurable: true });
  });
  for (const mode of ['online', 'bot']) {
    await page.goto(`/game.html?game=${GAME_ID}&mode=${mode}`);
    await page.waitForTimeout(1500);
    // Nothing on either path may ask on load. Permission is asked once, when
    // the button is pressed, and never before.
    expect(await page.evaluate(() => globalThis.__mediaRequests.length), mode).toBe(0);
  }
  await expect(page.locator('#voice-toggle')).toHaveText('Audio off');
  await expect(page.locator('#video-toggle')).toHaveText('Video off');
  await expect(page.locator('#on-air')).toBeHidden();
});

test('the arena asks one seat question, and shows a strength only where a bot sits', async ({ page }) => {
  await page.goto('/watch.html');
  // It used to ask three times: a "Play as" select plus a White seat select
  // plus a Black seat select, all answering the same question.
  await expect(page.locator('#human-side')).toHaveValue('white');
  await expect(page.locator('#white-strength')).toBeHidden();
  await expect(page.locator('#black-strength')).toBeVisible();
  await page.locator('#human-side').selectOption('watch');
  await expect(page.locator('#white-strength')).toBeVisible();
  await expect(page.locator('#black-strength')).toBeVisible();
  await page.locator('#human-side').selectOption('black');
  await expect(page.locator('#white-strength')).toBeVisible();
  await expect(page.locator('#black-strength')).toBeHidden();
});

test('the arena splits replay from setup and keeps a transcript you can read', async ({ page }) => {
  await page.goto('/watch.html');
  // One primary, a transport group, a transcript, then the quiet list. It was
  // a flat row of seven equal-weight buttons, two of which wrapped.
  await expect(page.locator('.watch-panel .arena-primary')).toHaveText('New game');
  await expect(page.locator('.arena-transport .btn')).toHaveCount(5);
  await expect(page.locator('#watch-live')).toHaveText('Live');
  await expect(page.locator('#watch-branch')).toHaveText('Branch from here');
  for (const control of ['#watch-first', '#watch-previous', '#watch-live', '#watch-branch']) {
    await expect(page.locator(control)).toBeDisabled();
  }
  await page.locator('#human-side').selectOption('watch');
  await expect(page.locator('.arena-move').first()).toBeVisible({ timeout: 20_000 });
  const transcript = page.locator('#watch-moves');
  await expect(transcript.locator('.arena-move-row').first()).toBeVisible();
  const font = await transcript.evaluate((element) => getComputedStyle(element).fontVariantNumeric);
  expect(font).toContain('tabular-nums');
  await page.locator('#watch-first').click();
  await expect(page.locator('#watch-live')).toBeEnabled();
  await page.locator('#watch-last').click();
  await expect(page.locator('#watch-live')).toBeDisabled();
});
