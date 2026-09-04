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

const RULES_KEY = 'schness-rules-seen';

/** Whether the rules have already been shown before a match. */
export function rulesSeen(storage = globalThis.localStorage) {
  try {
    return storage?.getItem(RULES_KEY) === 'true';
  } catch {
    // Treat unreadable storage as unseen; showing the rules twice beats never.
    return false;
  }
}

export function setRulesSeen(seen, storage = globalThis.localStorage) {
  try { storage?.setItem(RULES_KEY, String(seen === true)); } catch { /* Keep playing. */ }
  return seen === true;
}
