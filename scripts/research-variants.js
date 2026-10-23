// Research-only presets; none is exposed in public matchmaking.
export const VARIANTS = Object.freeze({
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
    case 'protected-recurring': return 'Checking drops forbidden whenever the opponent has only a king deployed; protection returns after captures.';
    case 'protected-opening': return 'Checking drops forbidden until the opponent first deploys a non-king; protection never returns.';
    case 'grace': return 'Checking drops permitted only after both players have completed three turns following king placement.';
    case 'quiet-return': return 'Same three-turn grace period; a piece that has previously been deployed can never check on a later drop.';
    case 'setup': return `Alternate quiet drops of all pieces, with no moves or captures during setup. ${rules.firstPlayer} takes the first normal turn. Later checking drops ${rules.allowCheckingDrops ? 'allowed' : 'forbidden'}. No legal setup placement is a setup-blocked draw.`;
    default: return rules.allowCheckingDrops ? 'Unrestricted checking drops.' : 'Canonical quiet drops.';
  }
}
