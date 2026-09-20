import { initTutorial } from './tutorial.js';
const dialog = document.querySelector('#rules-dialog');
document.querySelectorAll('[data-open-rules]').forEach(button => button.addEventListener('click', () => {
  if (!dialog.open) dialog.showModal();
  dialog.dispatchEvent(new Event('rules-open'));
}));
// Nothing opens the rules for you. The lobby auto-opened them on a first
// visit through this line, which is the exact thing the invariant was
// written against — and now that the lobby has a real board under it, the
// dialog was covering a game that had already started.
initTutorial({ autoStart: false });

/*
 * On a phone the dialog was the desktop layout reflowed: four rules stacked,
 * the demo board eating half the viewport, the instruction below it, and no
 * control anywhere to change rule — scrolling was the only way through. This
 * is a stepper instead: one rule per screen, the instruction above the board
 * it describes, and Back / Next pinned to the foot.
 *
 * It drives the existing per-rule "Try it" triggers rather than reaching into
 * the tutorial, so there is still one thing that knows how to open a lesson.
 */
const stepper = dialog?.querySelector('.rules-stepper');
if (stepper) {
  const rules = [...dialog.querySelectorAll('.rules-list > li')];
  const triggers = rules.map((rule) => rule.querySelector('.rule-demo-trigger'));
  const count = dialog.querySelector('#rules-step-count');
  const segments = [...dialog.querySelectorAll('.rules-progress li')];
  const back = dialog.querySelector('.rules-back');
  const next = dialog.querySelector('.rules-next');
  const phone = window.matchMedia('(max-width: 760px)');
  let step = 0;

  rules.forEach((rule, index) => {
    // The heading is what focus lands on, so it has to be able to take it.
    rule.querySelector('strong')?.setAttribute('tabindex', '-1');
    rule.dataset.step = String(index + 1);
  });
  back.addEventListener('click', () => show(step - 1));
  next.addEventListener('click', () => {
    if (step < rules.length - 1) return show(step + 1);
    dialog.close();
  });
  phone.addEventListener('change', apply);
  dialog.addEventListener('rules-open', () => { step = 0; apply(); });
  apply();

  function apply() {
    const stepping = phone.matches;
    stepper.hidden = !stepping;
    dialog.querySelector('.rules-stepper-actions').hidden = !stepping;
    dialog.classList.toggle('is-stepping', stepping);
    if (stepping) show(step, { focus: false });
    else for (const rule of rules) rule.hidden = false;
  }

  function show(index, { focus = true } = {}) {
    step = Math.min(Math.max(index, 0), rules.length - 1);
    rules.forEach((rule, position) => { rule.hidden = position !== step; });
    segments.forEach((segment, position) => {
      segment.dataset.state = position < step ? 'done' : position === step ? 'current' : 'todo';
    });
    count.textContent = `Rule ${step + 1} of ${rules.length}`;
    back.disabled = step === 0;
    // On the last rule there is no next rule; the honest label is the exit.
    next.textContent = step === rules.length - 1 ? 'Start playing' : 'Next rule';
    // Opening a lesson calls showModal(), so this may only run once the
    // dialog is already open. Nothing opens the rules for you — including
    // this, laying itself out at load.
    if (dialog.open) triggers[step]?.click();
    if (focus) rules[step].querySelector('strong')?.focus();
  }
}

let coordinates = false;
const coordinateButtons = [];
for (const host of document.querySelectorAll('.moves-header, #watch-moves, #replay-moves')) {
  const label = document.createElement('label');
  label.className = 'coordinate-option';
  const button = document.createElement('input');
  button.type = 'checkbox';
  button.className = 'coordinate-toggle';
  const text = document.createElement('span');
  text.textContent = 'Coordinates';
  label.append(button, text);
  button.addEventListener('click', () => {
    coordinates = button.checked;
    updateCoordinates();
  });
  host.before(label);
  coordinateButtons.push(button);
}
function updateCoordinates() {
  document.documentElement.dataset.coordinates = String(coordinates);
  for (const button of coordinateButtons) button.checked = coordinates;
}
updateCoordinates();
