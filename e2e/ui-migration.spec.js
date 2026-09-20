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
    await expect(page.locator('#rules-dialog #demo-board')).toBeVisible();
    await expect(page.locator('#rules-dialog .coordinate-option')).toHaveCount(0);
    // It opens on rule 1's lesson now — the geometry, with both kings on the
    // board and the square names showing — so there is nothing to place yet.
    await expect(page.locator('#rules-dialog #demo-board .piece')).toHaveCount(2);
    await expect(page.locator('#rules-demo')).toHaveAttribute('data-coordinates', 'true');
    await expect(page.locator('.rules-list li').filter({ has: page.locator('[data-lesson="board"]') })).toContainText('The board is 4 × 4');
    await expect(page.locator('.rules-list li').filter({ has: page.locator('[data-lesson="kings"]') })).toContainText('Kings go down first');
    await expect(page.locator('.rules-list li').filter({ has: page.locator('[data-lesson="deploy"]') })).toContainText('Move or deploy');
    await expect(page.locator('.rules-list li').filter({ has: page.locator('[data-lesson="capture"]') })).toContainText('Captures come back');
    await page.locator('[data-lesson="kings"]').click();
    await expect(page.locator('#rules-dialog #demo-board .square.placement')).toHaveCount(4);
    await page.locator('#demo-board .square.placement').first().click();
    await expect(page.locator('#demo-board .piece-black')).toHaveCount(1, { timeout: 10000 });
    await page.locator('.rules-confirm').click();
    await expect(page.locator('#rules-dialog')).not.toBeVisible();
  }
});

const PAGES = ['/', '/watch.html', '/library.html', '/puzzles.html',
  '/game.html?game=00000000-0000-4000-8000-000000000001&mode=bot'];

for (const language of ['en', 'ja']) {
  test(`the header is one order and the wordmark never vanishes in ${language}`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('schness-language', value), language);
    const orders = [];
    for (const path of PAGES) {
      await page.goto(path);
      await expect(page.locator('[data-language-toggle]')).toBeVisible();
      // The brand was the only shrinkable item in a nowrap flex row, so at
      // 390px the nav won and the wordmark collapsed to zero width — it did
      // not truncate, it disappeared. Measured, because a rule in the sheet
      // said it was `flex: 0 1 auto` and that read as fine.
      const word = page.locator('.brand-word');
      await expect(word).toBeVisible();
      const box = await word.boundingBox();
      expect(box.width, `${path} wordmark width`).toBeGreaterThan(40);
      orders.push(await page.evaluate(() => [...document.querySelectorAll('header .header-actions > *')]
        .filter((element) => element.getClientRects().length)
        .map((element) => element.dataset.openRules !== undefined ? 'rules'
          : element.dataset.themeToggle !== undefined ? 'theme'
            : element.dataset.languageToggle !== undefined ? 'language'
              : element.classList.contains('header-rule') ? 'rule' : 'page-control')
        .join(' ')));
    }
    // Muscle memory broke on every navigation: index went language · theme ·
    // Rules while watch and library went Rules · language · theme. Sound and
    // Install are page controls that only exist on one page each, so the
    // shared skeleton is what has to match: rules, theme, … rule, language.
    for (const order of orders) {
      expect(order.startsWith('rules theme')).toBe(true);
      expect(order.endsWith('rule language')).toBe(true);
      expect(order.replace(/ ?page-control/g, '')).toBe('rules theme rule language');
    }
  });
}

test('the destinations are real links, not JavaScript navigations', async ({ page }) => {
  await page.goto('/');
  // Nothing on this site used to be a link: three of the four lobby cards and
  // every nav destination went through window.location.assign, so there was no
  // cmd-click, no copy-link-address, no hover preview and nothing to crawl.
  for (const [id, href] of [['bot-arena', 'watch.html'], ['browse-games', 'library.html'],
    ['solve-puzzles', 'puzzles.html']]) {
    const card = page.locator(`#${id}`);
    await expect(card).toHaveJSProperty('tagName', 'A');
    await expect(card).toHaveAttribute('href', `./${href}`);
  }
  // The online card opens a dialog, which is what a button is for.
  await expect(page.locator('#play-online')).toHaveJSProperty('tagName', 'BUTTON');
  for (const path of PAGES) {
    await page.goto(path);
    const nav = page.locator('header nav.site-nav');
    await expect(nav.locator('a')).toHaveCount(3);
    for (const href of ['./watch.html', './library.html', './puzzles.html']) {
      await expect(nav.locator(`a[href="${href}"]`)).toHaveCount(1);
    }
  }
});

test('every page heading names the page, not the site', async ({ page }) => {
  const titles = {
    '/': 'Play Schness',
    '/watch.html': 'Bot arena',
    '/library.html': 'Game library',
    '/puzzles.html': 'Find the checkmate',
    '/game.html?game=00000000-0000-4000-8000-000000000001&mode=bot': 'Your match',
  };
  for (const path of PAGES) {
    await page.goto(path);
    // Heading navigation used to announce "Schness" five times and never the
    // page: every h1 was the site name and the real title was an h2.
    const headings = page.locator('main h1');
    await expect(headings).toHaveCount(1);
    await expect(headings).toHaveText(titles[path]);
  }
});

test('the rules dialog opens at the top with the board it teaches whole', async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path);
    await page.locator('header [data-open-rules]').click();
    await expect(page.locator('#rules-dialog')).toBeVisible();
    // The first thing a new visitor saw was rule 2's heading clipped at the
    // top and the demo board cut off at the bottom: the dialog handed itself
    // over scrolled to the middle of itself.
    const fit = await page.evaluate(() => {
      const body = document.querySelector('#rules-dialog .dialog-body');
      const board = document.querySelector('#demo-board').getBoundingClientRect();
      const view = body.getBoundingClientRect();
      return { scrollTop: body.scrollTop, top: board.top - view.top, bottom: view.bottom - board.bottom };
    });
    expect(fit.scrollTop, `${path} opens scrolled`).toBe(0);
    if (page.viewportSize().width > 760) {
      // Two columns: the rules read on the left while the board they teach is
      // whole on the right. On a phone there is one column and no width for
      // both, so the rules come first and the board is a scroll away.
      expect(fit.top, `${path} demo board clipped at the top`).toBeGreaterThanOrEqual(-1);
      expect(fit.bottom, `${path} demo board cut off at the bottom`).toBeGreaterThanOrEqual(-1);
    } else {
      await expect(page.locator('#rules-dialog .rules-list > li').first()).toBeInViewport();
    }
    await expect(page.locator('#rules-dialog .rules-list > li')).toHaveCount(4);
    await expect(page.locator('#rules-dialog .rule-demo-trigger')).toHaveCount(4);
    await expect(page.locator('#rules-dialog .dialog-foot')).toContainText('reopen this from');
    await page.locator('.rules-confirm').click();
    await expect(page.locator('#rules-dialog')).toBeHidden();
  }
});
