// Research-only presets; none is exposed in public matchmaking.
export const VARIANTS = Object.freeze({
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
