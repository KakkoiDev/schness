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

/**
 * The governing rule of the match rail: **the call never outranks the game.**
 * Everything below is what that means in practice, kept pure so it can be
 * tested without a camera, a peer or a network.
 */

/**
 * What the connection strip says about the link itself. A stranger is about to
 * see your face, so the interface says plainly that nothing passes through a
 * server — and says so just as plainly when that stops being true.
 */
export function connectionSummary({ relayed = false, latency = null } = {}) {
  const trip = Number.isFinite(latency) ? ` · ~${Math.round(latency)} ms` : '';
  return relayed ? `Relayed, not direct${trip}` : `Peer-to-peer · direct${trip}`;
}

/**
 * What to give up when the connection cannot carry everything: video first,
 * then audio, and never the clock. Returns what to stop, or null when the
 * connection is fine or there is nothing left to drop.
 */
export function nextDegradation({ video = false, audio = false, unstable = false } = {}) {
  if (!unstable) return null;
  if (video) return 'video';
  if (audio) return 'audio';
  return null;
}

/**
 * The badge, and the tab title. You should never have to wonder whether you
 * are being seen or heard, including when the tab is in the background.
 */
export function onAirLabel({ audio = false, video = false } = {}) {
  if (audio && video) return 'On air · mic and camera';
  if (video) return 'On air · camera';
  if (audio) return 'On air · mic';
  return null;
}

export function onAirTitle(title, state) {
  const base = String(title).replace(/^● On air — /, '');
  return onAirLabel(state) ? `● On air — ${base}` : base;
}

/**
 * Said before the browser prompt appears, never after. A permission dialog
 * with no reason in front of it is a dialog people decline.
 */
export const MEDIA_REASONS = Object.freeze({
  audio: 'Your microphone goes straight to your opponent. Nothing passes through a server, and nothing is recorded.',
  video: 'Your camera goes straight to your opponent. Nothing passes through a server, and nothing is recorded.',
});
