const STORAGE_KEY = 'schness-communication';
export const DEFAULT_COMMUNICATION_SETTINGS = Object.freeze({ text: false, voice: false });

export function normalizeCommunicationSettings(value) {
  return { text: value?.text === true, voice: value?.voice === true };
}

export function loadCommunicationSettings(storage = globalThis.localStorage) {
  try {
    const stored = storage?.getItem(STORAGE_KEY);
    return stored ? normalizeCommunicationSettings(JSON.parse(stored)) : { ...DEFAULT_COMMUNICATION_SETTINGS };
  } catch {
    return { ...DEFAULT_COMMUNICATION_SETTINGS };
  }
}

export function saveCommunicationSettings(value, storage = globalThis.localStorage) {
  const settings = normalizeCommunicationSettings(value);
  try { storage?.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* Keep playing if storage is unavailable. */ }
  return settings;
}

export function communicationPacket(value) {
  return { v: 1, ...normalizeCommunicationSettings(value) };
}

export function parseCommunicationPacket(value) {
  if (!value || value.v !== 1 || typeof value.text !== 'boolean' || typeof value.voice !== 'boolean') {
    throw new Error('Invalid communication preferences.');
  }
  return normalizeCommunicationSettings(value);
}
