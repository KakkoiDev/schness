import { gameUrl } from './navigation.js';
import { initTheme } from './theme.js';
import { loadCommunicationSettings, saveCommunicationSettings } from './communication.js';

initTheme();

const botButton = document.querySelector('#play-bot');
const onlineButton = document.querySelector('#play-online');
const rulesDialog = document.querySelector('#rules-dialog');
const textChatSetting = document.querySelector('#text-chat-setting');
const voiceChatSetting = document.querySelector('#voice-chat-setting');
const communicationSettings = loadCommunicationSettings();

textChatSetting.checked = communicationSettings.text;
voiceChatSetting.checked = communicationSettings.voice;
[textChatSetting, voiceChatSetting].forEach((input) => input.addEventListener('change', () => {
  saveCommunicationSettings({ text: textChatSetting.checked, voice: voiceChatSetting.checked });
}));

botButton.addEventListener('click', () => window.location.assign(gameUrl(window.location.href, 'bot')));
onlineButton.addEventListener('click', () => window.location.assign(gameUrl(window.location.href, 'online')));
document.querySelectorAll('[data-open-rules]').forEach((button) =>
  button.addEventListener('click', () => rulesDialog.showModal()));
window.addEventListener('online', updateOnlineAvailability);
window.addEventListener('offline', updateOnlineAvailability);
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
updateOnlineAvailability();

function updateOnlineAvailability() {
  onlineButton.disabled = !navigator.onLine;
  onlineButton.querySelector('small').textContent = navigator.onLine
    ? 'Get a unique link for another player' : 'Unavailable while offline';
}
