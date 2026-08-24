import { loadCommunicationSettings, saveCommunicationSettings } from './communication.js';

export function initSettings(onChange = () => {}) {
  const dialog = document.querySelector('#settings-dialog');
  const textInput = dialog.querySelector('#text-chat-setting');
  const voiceInput = dialog.querySelector('#voice-chat-setting');
  const settings = loadCommunicationSettings();

  textInput.checked = settings.text;
  voiceInput.checked = settings.voice;
  document.querySelectorAll('[data-open-settings]').forEach((button) =>
    button.addEventListener('click', () => dialog.showModal()));
  [textInput, voiceInput].forEach((input) => input.addEventListener('change', () => {
    Object.assign(settings, saveCommunicationSettings({ text: textInput.checked, voice: voiceInput.checked }));
    onChange(settings);
  }));

  return settings;
}
