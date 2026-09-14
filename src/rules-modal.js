import { initTutorial } from './tutorial.js?v=82';
const dialog = document.querySelector('#rules-dialog');
document.querySelectorAll('[data-open-rules]').forEach(button => button.addEventListener('click', () => {
  if (!dialog.open) dialog.showModal();
}));
initTutorial({ autoStart: document.body.classList.contains('lobby-page') });

let coordinates = false;
try { coordinates = localStorage.getItem('schness-coordinates') === '1'; } catch {}
const coordinateButtons = [];
for (const host of document.querySelectorAll('.moves-header, #watch-moves, #replay-moves, .rules-lessons')) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn coordinate-toggle';
  button.textContent = 'Coordinates';
  button.addEventListener('click', () => {
    coordinates = !coordinates;
    try { localStorage.setItem('schness-coordinates', coordinates ? '1' : '0'); } catch {}
    updateCoordinates();
  });
  host.before(button);
  coordinateButtons.push(button);
}
function updateCoordinates() {
  document.documentElement.dataset.coordinates = String(coordinates);
  for (const button of coordinateButtons) button.setAttribute('aria-pressed', String(coordinates));
}
updateCoordinates();
