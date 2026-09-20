/*
 * The rules dialog is two layouts, not one reflowed. On a phone it is a
 * stepper: one rule per screen, its "Try it" trigger pressed for you, and
 * Back / Next in the foot. These helpers drive whichever layout is on screen,
 * so a test can say what it means — open this lesson, close the dialog —
 * without knowing which one it got.
 */
const LESSONS = ['board', 'kings', 'deploy', 'capture'];

export async function stepping(page) {
  return page.locator('#rules-dialog').evaluate((dialog) => dialog.classList.contains('is-stepping'));
}

export async function openLesson(page, lesson) {
  if (!(await page.locator('#rules-dialog').evaluate((dialog) => dialog.open))) {
    await page.locator('header [data-open-rules]').click();
  }
  if (!(await stepping(page))) {
    await page.locator(`.rule-demo-trigger[data-lesson="${lesson}"]`).click();
    return;
  }
  // The stepper opens the lesson belonging to the rule you are standing on.
  const target = LESSONS.indexOf(lesson);
  for (let step = await currentStep(page); step < target; step += 1) {
    await page.locator('.rules-next').click();
  }
  for (let step = await currentStep(page); step > target; step -= 1) {
    await page.locator('.rules-back').click();
  }
}

export async function closeRules(page) {
  // Start playing is in the foot on a desktop and is the last step's Next on a
  // phone; the close button is the one exit both layouts share.
  const confirm = page.locator('.rules-confirm');
  if (await confirm.isVisible()) await confirm.click();
  else await page.locator('#rules-dialog .dialog-close').click();
}

async function currentStep(page) {
  const text = await page.locator('#rules-step-count').textContent();
  return Number(text.match(/\d+/)[0]) - 1;
}
