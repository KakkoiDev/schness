// Shared presets for research and the opt-in Bot Arena; online matchmaking stays canonical.
export const VARIANTS = Object.freeze({
  'permanent-loss-quiet': {allowCheckingDrops:false,experiment:'permanent-loss'},
  'permanent-loss-checking': {allowCheckingDrops:true,experiment:'permanent-loss'},
  ...Object.fromEntries([3,4,5,6].flatMap(bankCapacity => [false, true].map(allowCheckingDrops => [`capture-bank-${bankCapacity}-${allowCheckingDrops ? 'checking' : 'quiet'}`, { allowCheckingDrops, experiment: 'capture-bank', bankCapacity }]))),
  ...Object.fromEntries(['home-half-check', 'distant-check', 'supported-check', 'countercheck-only', 'knight-check', 'bishop-check', 'rook-check'].map(experiment => [experiment, { allowCheckingDrops: true, experiment }])),
  'first-turn-quiet': { allowCheckingDrops: true, experiment: 'first-turn-quiet' },
  'protected-first-turn': { allowCheckingDrops: true, experiment: 'protected-first-turn' },
  'mutual-one': { allowCheckingDrops: true, experiment: 'mutual-one' },
  'mutual-two': { allowCheckingDrops: true, experiment: 'mutual-two' },
  'limited-check': { allowCheckingDrops: true, experiment: 'limited-check' },
  cooldown: { allowCheckingDrops: true, experiment: 'cooldown' },
  'no-drop-mate': { allowCheckingDrops: true, experiment: 'no-drop-mate' },
  ...Object.fromEntries([false, true].map(allowCheckingDrops => [
    `hidden-${allowCheckingDrops ? 'checking' : 'quiet'}`,
    { allowCheckingDrops, experiment: 'setup', setup: true, firstPlayer: 'white', hiddenSetup: true },
  ])),
  canonical: { allowCheckingDrops: false },
  unrestricted: { allowCheckingDrops: true },
  'protected-recurring': { allowCheckingDrops: true, experiment: 'protected-recurring' },
  'protected-opening': { allowCheckingDrops: true, experiment: 'protected-opening' },
  grace: { allowCheckingDrops: true, experiment: 'grace' },
  'quiet-return': { allowCheckingDrops: true, experiment: 'quiet-return' },
  ...Object.fromEntries(['white', 'black'].flatMap(firstPlayer => [false, true].map(allowCheckingDrops => [
    `setup-${firstPlayer}-${allowCheckingDrops ? 'checking' : 'quiet'}`,
    { allowCheckingDrops, experiment: 'setup', setup: true, firstPlayer },
  ]))),
});

export function description(rules) {
  switch (rules.experiment) {
    case 'permanent-loss': return `Captured pieces leave the game permanently; unused reserves can still deploy. Checking drops ${rules.allowCheckingDrops ? 'allowed' : 'forbidden'}.`;
    case 'capture-bank': return `Captured pieces join your bank up to ${rules.bankCapacity} held pieces; overflow returns to the captured side. Checking drops ${rules.allowCheckingDrops ? 'allowed' : 'forbidden'}.`;
    case 'home-half-check': return 'Checking drops allowed only onto your own half of the board.';
    case 'distant-check': return 'Checking drops must land at least two king-steps from the opposing king.';
    case 'supported-check': return 'Checking drops must be supported by another friendly piece, including the king; pinned supporters count.';
    case 'countercheck-only': return 'Checking drops allowed only when your king is already in check; the drop must also resolve that check.';
    case 'knight-check': return 'Only knights may give check on a drop; other pieces must drop quietly.';
    case 'bishop-check': return 'Only bishops may give check on a drop; other pieces must drop quietly.';
    case 'rook-check': return 'Only rooks may give check on a drop; other pieces must drop quietly.';
    case 'first-turn-quiet': return 'Each player’s first post-king turn forbids checking drops; later checking drops allowed.';
    case 'protected-first-turn': return 'Recurring lone-king protection plus a quiet first post-king turn for both players.';
    case 'mutual-one': return 'Checking drops unlock permanently for both players after both have first deployed one non-king.';
    case 'mutual-two': return 'Checking drops unlock permanently after both players have deployed two distinct non-kings.';
    case 'limited-check': return 'Each player may make at most one checking drop per game.';
    case 'cooldown': return 'A checking drop must be followed on that player’s next turn by a move or quiet drop.';
    case 'no-drop-mate': return 'Checking drops allowed unless the drop immediately checkmates.';
    case 'protected-recurring': return 'Checking drops forbidden whenever the opponent has only a king deployed; protection returns after captures.';
    case 'protected-opening': return 'Checking drops forbidden until the opponent first deploys a non-king; protection never returns.';
    case 'grace': return 'Checking drops permitted only after both players have completed three turns following king placement.';
    case 'quiet-return': return 'Same three-turn grace period; a piece that has previously been deployed can never check on a later drop.';
    case 'setup': if (rules.hiddenSetup) return `Independently seeded private home-rank arrangements, no initial check, simultaneous reveal; White starts play; checking drops ${rules.allowCheckingDrops ? 'allowed' : 'forbidden'}. Uniform legal arrangement sampling, not a hidden-information AI.`;
      return `Alternate quiet drops of all pieces, with no moves or captures during setup. ${rules.firstPlayer} takes the first normal turn. Later checking drops ${rules.allowCheckingDrops ? 'allowed' : 'forbidden'}. No legal setup placement is a setup-blocked draw.`;
    default: return rules.allowCheckingDrops ? 'Unrestricted checking drops.' : 'Canonical quiet drops.';
  }
}

export const VARIANT_LABELS = Object.freeze({
  canonical: 'Classic Schness',
  'permanent-loss-quiet': 'Permanent captures · quiet drops', 'permanent-loss-checking': 'Permanent captures · checking drops',
  ...Object.fromEntries([3,4,5,6].flatMap(n => [false,true].map(check => [`capture-bank-${n}-${check ? 'checking' : 'quiet'}`, `Capture bank ${n} · ${check ? 'checking' : 'quiet'} drops`]))),
  'home-half-check': 'Checking drops from home half', 'distant-check': 'Distant checking drops',
  'supported-check': 'Supported checking drops', 'countercheck-only': 'Counterchecking drops only',
  'knight-check': 'Knight checking drops only', 'bishop-check': 'Bishop checking drops only', 'rook-check': 'Rook checking drops only',
  unrestricted: 'Checking drops',
  'protected-recurring': 'Lone-king protection', 'protected-opening': 'Opening king protection',
  'first-turn-quiet': 'Quiet first turn', 'protected-first-turn': 'Quiet first turn + king protection',
  'mutual-one': 'Both deploy one', 'mutual-two': 'Both deploy two',
  'limited-check': 'One checking drop', cooldown: 'Checking-drop cooldown', 'no-drop-mate': 'No drop mate',
  grace: 'Three-turn grace', 'quiet-return': 'Quiet return drops',
  'setup-white-quiet': 'Full setup · quiet drops · White first',
  'setup-white-checking': 'Full setup · checking drops · White first',
  'setup-black-quiet': 'Full setup · quiet drops · Black first',
  'setup-black-checking': 'Full setup · checking drops · Black first',
  'hidden-quiet': 'Random hidden armies · quiet drops', 'hidden-checking': 'Random hidden armies · checking drops',
});
export const VARIANT_IDS = Object.freeze(Object.keys(VARIANT_LABELS));
export function resolveVariant(choice, random = Math.random) {
  if (choice === 'random') return VARIANT_IDS[Math.min(VARIANT_IDS.length - 1, Math.max(0, Math.floor(random() * VARIANT_IDS.length)))];
  if (!VARIANT_IDS.includes(choice)) throw new Error('Unknown game variant');
  return choice;
}
export function variantSettings(search) {
  const params = new URLSearchParams(search);
  const id = resolveVariant(params.get('variant') ?? 'canonical');
  const seed = Number(params.get('seed') ?? 0);
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('Invalid variant seed');
  return { id, seed, rules: VARIANTS[id] };
}
