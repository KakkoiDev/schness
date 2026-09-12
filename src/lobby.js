import { gameUrl, launchIntent } from './navigation.js';
import { clockMode, setClockMode } from './settings.js';
import { initTheme } from './theme.js';
import { initTutorial } from './tutorial.js?v=70';
import { initI18n } from './i18n.js?v=70';

initTheme();
initI18n();
initTutorial();

const arenaButton = document.querySelector('#bot-arena');
const onlineButton = document.querySelector('#play-online');
const libraryButton = document.querySelector('#browse-games');
const puzzlesButton = document.querySelector('#solve-puzzles');
const rulesDialog = document.querySelector('#rules-dialog');
const installButton = document.querySelector('#install');
let installPrompt = null;

arenaButton.addEventListener('click', () => window.location.assign('./watch.html'));
const onlineSetup = document.querySelector('#online-setup');
onlineButton.addEventListener('click', () => {
  onlineSetup.querySelector(`input[name="clock"][value="${clockMode()}"]`)?.click();
  onlineSetup.showModal();
});
document.querySelector('#online-setup-close').addEventListener('click', () => onlineSetup.close());
document.querySelector('#online-setup-form').addEventListener('submit', (event) => {
  event.preventDefault();
  setClockMode(new FormData(event.currentTarget).get('clock') || 'untimed');
  window.location.assign(gameUrl(window.location.href, 'online'));
});
libraryButton.addEventListener('click', () => window.location.assign('./library.html'));
puzzlesButton.addEventListener('click', () => window.location.assign('./puzzles.html'));
document.querySelectorAll('[data-open-rules]').forEach((button) =>
  button.addEventListener('click', () => rulesDialog.showModal()));
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
