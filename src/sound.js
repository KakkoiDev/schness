export const SOUND_CUES = Object.freeze(['move', 'capture', 'deploy', 'check']);

/**
 * Four cues, each independently switchable. The audio context is not created
 * until something actually plays, because browsers block one made before a
 * user gesture. Reduced motion is about motion and is not consent for sound,
 * so this has its own switch and is off until asked for.
 */
export function createSoundBoard(getSettings, AudioContextClass = globalThis.AudioContext) {
  let context = null;

  return { play, vibrate };

  function play(cue) {
    const settings = getSettings();
    if (!settings?.[cue] || !SOUND_CUES.includes(cue)) return false;
    const audio = ensureContext();
    if (!audio) return false;
    const voice = VOICES[cue];
    const now = audio.currentTime;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = voice.type;
    oscillator.frequency.setValueAtTime(voice.from, now);
    if (voice.to !== voice.from) oscillator.frequency.exponentialRampToValueAtTime(voice.to, now + voice.length);
    gain.gain.setValueAtTime(voice.peak, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + voice.length);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + voice.length);
    return true;
  }

  function vibrate(pattern = 10) {
    if (!getSettings()?.haptics) return false;
    return globalThis.navigator?.vibrate?.(pattern) ?? false;
  }

  function ensureContext() {
    if (context) return context;
    if (typeof AudioContextClass !== 'function') return null;
    try {
      context = new AudioContextClass();
    } catch {
      context = null;
    }
    return context;
  }
}

const VOICES = Object.freeze({
  // A soft wooden knock.
  move: { type: 'triangle', from: 320, to: 180, peak: 0.16, length: 0.07 },
  // Sharper, as the piece lands in a reserve.
  capture: { type: 'square', from: 640, to: 420, peak: 0.12, length: 0.05 },
  // Distinct from a move, so you hear a drop coming.
  deploy: { type: 'sine', from: 260, to: 520, peak: 0.14, length: 0.11 },
  // A low tone, once.
  check: { type: 'sine', from: 150, to: 120, peak: 0.2, length: 0.32 },
});
