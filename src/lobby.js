import { gameUrl, launchIntent } from './navigation.js';
import { clockMode, setClockMode } from './settings.js';
import { initTheme } from './theme.js';
import { initTutorial } from './tutorial.js';

initTheme();
initTutorial();

const arenaButton = document.querySelector('#bot-arena');
const onlineButton = document.querySelector('#play-online');
const libraryButton = document.querySelector('#browse-games');
const puzzlesButton = document.querySelector('#solve-puzzles');
const rulesDialog = document.querySelector('#rules-dialog');
const installButton = document.querySelector('#install');
let installPrompt = null;

arenaButton.addEventListener('click', () => window.location.assign('./watch.html'));
onlineButton.addEventListener('click', () => window.location.assign(gameUrl(window.location.href, 'online')));
libraryButton.addEventListener('click', () => window.location.assign('./library.html'));
puzzlesButton.addEventListener('click', () => window.location.assign('./puzzles.html'));
document.querySelectorAll('[data-open-rules]').forEach((button) =>
  button.addEventListener('click', () => rulesDialog.showModal()));
initChoice('clock', clockMode(), setClockMode);
renderSetupSummary();
// Chrome offers installation through a menu most people never open. Taking
// the event lets the lobby offer it in place; the button exists only while
// there is something to accept, so it never sits there as dead furniture.
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  installButton.hidden = false;
});
installButton.addEventListener('click', async () => {
  if (!installPrompt) return;
  installButton.hidden = true;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
});
window.addEventListener('appinstalled', () => {
  installPrompt = null;
  installButton.hidden = true;
});
window.addEventListener('online', updateOnlineAvailability);
window.addEventListener('offline', updateOnlineAvailability);
if ('serviceWorker' in navigator) {
  // A worker taking over mid-page means everything this page loaded is from
  // the build before it. Reloading once picks the new shell up immediately
  // instead of on the visit after. Only here: the match page would be
  // throwing away a game in progress, and it will be current next time.
  const wasControlled = Boolean(navigator.serviceWorker.controller);
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!wasControlled || reloaded) return;
    reloaded = true;
    window.location.reload();
  });
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}
updateOnlineAvailability();
openShortcut();

/** Long-pressing the installed icon lands here with what to start. */
function openShortcut() {
  const intent = launchIntent(window.location.search);
  if (!intent) return;
  if (intent === 'online' && !navigator.onLine) return;
  // replace, so Back leaves the app rather than bouncing off the shortcut.
  window.location.replace(gameUrl(window.location.href, intent));
}

function updateOnlineAvailability() {
  onlineButton.disabled = !navigator.onLine;
  onlineButton.querySelector('small').textContent = navigator.onLine
    ? 'Get a link to send a friend' : 'Unavailable while offline';
}

/** Radio groups that persist the moment they change, before any match starts. */
function initChoice(name, saved, save) {
  const inputs = document.querySelectorAll(`input[name="${name}"]`);
  for (const input of inputs) {
    input.checked = input.value === saved;
    input.addEventListener('change', () => {
      if (!input.checked) return;
      save(input.value);
      renderSetupSummary();
    });
  }
}

/**
 * Strength and clock live behind a disclosure, so the summary carries the
 * current pair — a collapsed setup still says what you are about to play.
 */
function renderSetupSummary() {
  const summary = document.querySelector('#setup-summary');
  if (!summary) return;
  const clock = clockMode();
  summary.textContent = clock === 'untimed' ? 'Untimed' : clock;
}
