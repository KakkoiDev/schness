import { gameUrl, launchIntent } from './navigation.js';
import { botDifficulty, clockMode, setBotDifficulty, setClockMode } from './settings.js';
import { initTheme } from './theme.js';

initTheme();

const botButton = document.querySelector('#play-bot');
const onlineButton = document.querySelector('#play-online');
const rulesDialog = document.querySelector('#rules-dialog');
const installButton = document.querySelector('#install');
let installPrompt = null;

botButton.addEventListener('click', () => window.location.assign(gameUrl(window.location.href, 'bot')));
onlineButton.addEventListener('click', () => window.location.assign(gameUrl(window.location.href, 'online')));
document.querySelectorAll('[data-open-rules]').forEach((button) =>
  button.addEventListener('click', () => rulesDialog.showModal()));
initChoice('difficulty', botDifficulty(), setBotDifficulty);
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
  const difficulty = botDifficulty();
  const clock = clockMode();
  const strength = `${difficulty[0].toUpperCase()}${difficulty.slice(1)} bot`;
  summary.textContent = `${strength} · ${clock === 'untimed' ? 'Untimed' : clock}`;
}
