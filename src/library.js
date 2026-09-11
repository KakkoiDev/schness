const PIECES = ['rook', 'bishop', 'knight'];

export function encodeAction(action) {
  if (action.type === 'place-king') return ['k', action.to];
  if (action.type === 'drop') return ['d', PIECES.indexOf(action.piece), action.to];
  return ['m', action.from, action.to];
}

export function decodeAction(action) {
  if (action[0] === 'k') return { type: 'place-king', to: action[1] };
  if (action[0] === 'd') return { type: 'drop', piece: PIECES[action[1]], to: action[2] };
  return { type: 'move', from: action[1], to: action[2] };
}

export function actionSequenceKey(game) {
  return JSON.stringify(game.transcript.map(({ action }) => encodeAction(action)));
}

export function engineLabel(engine) {
  const name = `${engine.level[0].toUpperCase()}${engine.level.slice(1)}`;
  return `${name} v${engine.version}`;
}

export function resultCode(result) {
  if (result.type === 'win') return result.winner === 'white' ? 'w' : 'b';
  return result.reason === 'threefold-repetition' ? 'r' : result.reason === 'stalemate' ? 's' : 'p';
}

export function resultLabel(code) {
  return { w: 'White won', b: 'Black won', r: 'Threefold draw', s: 'Stalemate', p: 'Ply-limit draw' }[code] ?? 'Draw';
}

export function profilePairs(game) {
  return [...new Set(game.sources.map((source) => `${source[2]} vs ${source[3]}`))];
}

export function matchesFilters(game, filters) {
  const pairs = profilePairs(game);
  return (!filters.white || pairs.some((pair) => pair.split(' vs ')[0] === filters.white))
    && (!filters.black || pairs.some((pair) => pair.split(' vs ')[1] === filters.black))
    && (!filters.result || game.result === filters.result)
    && (!filters.version || pairs.some((pair) => pair.includes(filters.version)));
}
