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

export const DIFFICULTIES = Object.freeze(['learning', 'steady', 'sharp']);
const DIFFICULTY_KEY = 'schness-difficulty';
const CLOCK_KEY = 'schness-clock';
const SOUND_KEY = 'schness-sound';

export const DEFAULT_SOUND = Object.freeze({
  move: false, capture: false, deploy: false, check: false, haptics: false,
});

/**
 * Strengths are described to players by behaviour, not by depth, because a
 * depth number means nothing before you have played a game.
 */
export function difficultyDepth(difficulty) {
  if (difficulty === 'learning') return 1;
  if (difficulty === 'sharp') return 4;
  return 3;
}

export function botDifficulty(storage = globalThis.localStorage) {
  const stored = read(DIFFICULTY_KEY, storage);
  return DIFFICULTIES.includes(stored) ? stored : 'steady';
}

export function setBotDifficulty(difficulty, storage = globalThis.localStorage) {
  const next = DIFFICULTIES.includes(difficulty) ? difficulty : 'steady';
  write(DIFFICULTY_KEY, next, storage);
  return next;
}

export function clockMode(storage = globalThis.localStorage) {
  return read(CLOCK_KEY, storage) ?? 'untimed';
}

export function setClockMode(mode, storage = globalThis.localStorage) {
  write(CLOCK_KEY, String(mode), storage);
  return mode;
}

export function normalizeSound(value) {
  const settings = { ...DEFAULT_SOUND };
  for (const key of Object.keys(DEFAULT_SOUND)) settings[key] = value?.[key] === true;
  return settings;
}

export function soundSettings(storage = globalThis.localStorage) {
  const stored = read(SOUND_KEY, storage);
  if (!stored) return { ...DEFAULT_SOUND };
  try {
    return normalizeSound(JSON.parse(stored));
  } catch {
    return { ...DEFAULT_SOUND };
  }
}

export function setSoundSettings(value, storage = globalThis.localStorage) {
  const settings = normalizeSound(value);
  write(SOUND_KEY, JSON.stringify(settings), storage);
  return settings;
}

function read(key, storage) {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function write(key, value, storage) {
  try { storage?.setItem(key, value); } catch { /* Keep playing without storage. */ }
}
