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
