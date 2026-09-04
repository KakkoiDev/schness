import { gameUrl } from './navigation.js';
import { rulesSeen, setRulesSeen } from './settings.js';
import { initTheme } from './theme.js';

initTheme();

const botButton = document.querySelector('#play-bot');
const onlineButton = document.querySelector('#play-online');
const rulesDialog = document.querySelector('#rules-dialog');
const rulesOptOut = document.querySelector('#rules-optout');

botButton.addEventListener('click', () => window.location.assign(gameUrl(window.location.href, 'bot')));
onlineButton.addEventListener('click', () => window.location.assign(gameUrl(window.location.href, 'online')));
document.querySelectorAll('[data-open-rules]').forEach((button) =>
  button.addEventListener('click', () => rulesDialog.showModal()));
rulesOptOut.checked = rulesSeen();
rulesOptOut.addEventListener('change', () => setRulesSeen(rulesOptOut.checked));
window.addEventListener('online', updateOnlineAvailability);
window.addEventListener('offline', updateOnlineAvailability);
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
updateOnlineAvailability();

function updateOnlineAvailability() {
  onlineButton.disabled = !navigator.onLine;
  onlineButton.querySelector('small').textContent = navigator.onLine
    ? 'Get a link to send a friend' : 'Unavailable while offline';
}
