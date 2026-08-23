const GAME_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createGameId(crypto = globalThis.crypto) {
  if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function gameRoute(search) {
  const params = new URLSearchParams(search);
  const gameId = params.get('game');
  const mode = params.get('mode');
  if (!GAME_ID.test(gameId ?? '') || !['bot', 'online'].includes(mode)) return null;
  return { gameId, mode };
}

export function gameUrl(base, mode, gameId = createGameId()) {
  const url = new URL('game.html', base);
  url.search = '';
  url.hash = '';
  url.searchParams.set('game', gameId);
  url.searchParams.set('mode', mode);
  return url.href;
}
