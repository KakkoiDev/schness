import { initTutorial } from './tutorial.js?v=84';
const dialog = document.querySelector('#rules-dialog');
document.querySelectorAll('[data-open-rules]').forEach(button => button.addEventListener('click', () => {
  if (!dialog.open) dialog.showModal();
  dialog.dispatchEvent(new Event('rules-open'));
}));
initTutorial({ autoStart: document.body.classList.contains('lobby-page') });

let coordinates = false;
const coordinateButtons = [];
for (const host of document.querySelectorAll('.moves-header, #watch-moves, #replay-moves, .rules-practice')) {
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
  if (host.matches('.rules-practice')) host.prepend(label); else host.before(label);
  coordinateButtons.push(button);
}
function updateCoordinates() {
  document.documentElement.dataset.coordinates = String(coordinates);
  for (const button of coordinateButtons) button.checked = coordinates;
}
updateCoordinates();
