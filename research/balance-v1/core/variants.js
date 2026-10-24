// Shared presets for research and the opt-in Bot Arena; online matchmaking stays canonical.
const BASE_VARIANTS = Object.freeze({
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

function baseDescription(rules) {
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


const recipes = {canonical:BASE_VARIANTS.canonical, 'mutual-two':BASE_VARIANTS['mutual-two']};
for (const bankCapacity of [3,4,5,6]) {
  for (const unlock of [0,2,3]) recipes[`bank-${bankCapacity}-${unlock ? `mutual-${unlock}` : 'quiet'}`] = {experiment:'balance-bench', bankCapacity, allowCheckingDrops:unlock>0, unlock};
  for (const captureDelay of [1,2,'weighted']) recipes[`bank-${bankCapacity}-delay-${captureDelay}`] = {experiment:'balance-bench', bankCapacity, allowCheckingDrops:false, captureDelay};
  for (const unlock of [2,3]) recipes[`bank-${bankCapacity}-mutual-${unlock}-check-cooldown`] = {experiment:'balance-bench', bankCapacity, allowCheckingDrops:true, unlock, checkCooldown:true};
}
for (const unlock of [0,2,3]) for (const policy of ['earlyQuiet','whiteHome']) recipes[`bank-4-${unlock ? `mutual-${unlock}` : 'quiet'}-${policy}`] = {experiment:'balance-bench', bankCapacity:4, allowCheckingDrops:unlock>0, unlock, [policy]:true};
for (const mirrored of ['rook','bishop','knight']) recipes[`bank-4-mirrored-${mirrored}`] = {experiment:'balance-bench', bankCapacity:4, allowCheckingDrops:false, mirrored};
for (const allowCheckingDrops of [false,true]) recipes[`home-setup-${allowCheckingDrops ? 'checking' : 'quiet'}`] = {experiment:'setup', setup:true, homeSetup:true, firstPlayer:'white', allowCheckingDrops};
export const VARIANTS = Object.freeze(Object.fromEntries(Object.entries(recipes).map(([id,r])=>[id,Object.freeze(r)])));
export const VARIANT_IDS = Object.freeze(Object.keys(VARIANTS));
export function description(r) {
  if (r.homeSetup) return `Alternate all three reserve placements on each player's king home row, no moves/captures/checking drops during setup. White begins normal play after all six placements. Captures return to owner. Later checking drops ${r.allowCheckingDrops ? 'allowed' : 'forbidden'}. Blocked placement is a setup-blocked draw.`;
  if (r.experiment !== 'balance-bench') return baseDescription(r);
  return `Capture-to-bank capacity ${r.bankCapacity}; overflow returns to captured owner. ` +
    (r.allowCheckingDrops ? `Checking drops unlock once both deploy ${r.unlock} distinct types. ` : 'Quiet drops only. ') +
    (r.checkCooldown ? 'No checking drop immediately after own checking drop. ' : '') +
    (r.captureDelay ? `New captures cool down ${r.captureDelay === 'weighted' ? 'bishop/knight 3, rook 4' : r.captureDelay} owner turns; existing reserve copies tick after own actions; no tick on new arrivals that turn. Forced wait only if no legal move and not in check. ` : '') +
    (r.earlyQuiet ? 'Neither player can give any check on their first normal turn. ' : '') +
    (r.whiteHome ? 'White first deployment restricted to own half; king moves remain legal. ' : '') +
    (r.mirrored ? `Both must open by dropping a ${r.mirrored}; Black mirrors White by 180 degrees, no check on either king. ` : '');
}
