import { gameUrl, launchIntent } from './navigation.js';
import { clockMode, setClockMode } from './settings.js';
import { initTheme } from './theme.js';
import { initLobbyBoard } from './lobby-board.js';
import { initI18n } from './i18n.js';

initTheme();
initI18n();
initLobbyBoard();

// Three of the four destinations are plain <a href> cards in the markup, so
// they cmd-click, middle-click, copy-link and crawl like any other link. Only
// the online card stays a button: it opens a dialog, which is what a button is
// for, and it is the one that has to go dead when the browser goes offline.
const onlineButton = document.querySelector('#play-online');
const installButton = document.querySelector('#install');
let installPrompt = null;

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
