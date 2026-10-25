import { expect, test } from '@playwright/test';
import { closeRules } from './rules-dialog.js';
async function dismissRules(page) { if (await page.locator('#rules-dialog').evaluate(d => d.open)) await closeRules(page); }

test('random variant resolves once and survives a reload',async({page})=>{
  await page.goto('/watch.html?variant=random');
  await dismissRules(page);
  await expect(page.locator('#game-variant')).toHaveValue('random');
  const url=page.url();
  expect(new URL(url).searchParams.get('variant')).not.toBe('random');
  await expect(page.locator('#variant-description')).not.toBeEmpty();
  await page.reload();
  await dismissRules(page);
  expect(page.url()).toBe(url);
  await expect(page.locator('#game-variant')).toHaveValue(new URL(url).searchParams.get('variant'));
});

test('full setup allows the human to select and drop a reserve piece',async({page})=>{
  await page.goto('/watch.html?variant=setup-white-quiet');
  await dismissRules(page);
  await page.locator('#watch-board [data-square="12"]').click();
  await expect(page.locator('#watch-status')).toContainText('choose a reserve piece',{timeout:20000});
  await page.locator('#white-reserve [data-piece="rook"]').click();
  // Inspect rendered legal targets, then verify a real piece leaves reserve.
  const choices=await page.evaluate(async()=>{
    const {createInitialPosition,applyAction,legalActions}=await import('/src/rules.js');
    const {VARIANTS}=await import('/src/variants.js');
    // The actual Black king is visible; choose a legal White rook deployment for that board.
    const kingCell=[...document.querySelectorAll('#watch-board .square')].find(c=>c.getAttribute('aria-label')?.toLowerCase().includes('black king'));
    if(!kingCell) throw Error('Black king missing');
    let p=createInitialPosition(VARIANTS['setup-white-quiet']);
    p=applyAction(p,{type:'place-king',to:12});p=applyAction(p,{type:'place-king',to:Number(kingCell.dataset.square)});
    return legalActions(p).find(a=>a.type==='drop'&&a.piece==='rook').to;
  });
  await page.locator(`#watch-board [data-square="${choices}"]`).click();
  await expect(page.locator('#white-reserve [data-piece="rook"]')).toHaveCount(0);
  await expect(page.locator(`#watch-board [data-square="${choices}"] img`)).toHaveCount(1);
});

test('hidden setup reveals all eight pieces and returns normal play to White',async({page})=>{
  await page.goto('/watch.html?variant=hidden-quiet&seed=123');
  await dismissRules(page);
  await page.locator('#watch-board [data-square="12"]').click();
  await expect(page.locator('#watch-board .piece')).toHaveCount(8,{timeout:20000});
  await expect(page.locator('#watch-status')).toContainText('White to move');
  await expect(page.locator('#white-reserve .bank-piece')).toHaveCount(0);
});
