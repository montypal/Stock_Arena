// Display bits for the two achievement boards: an icon and, where it is
// needed, the real condition in the player's words.
//
// RULES only holds a slug when the catalogue's one-liner leaves out something
// worker/rewards.py actually checks -- a board that promises a rule the worker
// does not judge is a lie. Everything else falls through to the catalogue's
// `how`, so there is one source of truth per sentence.

const ICONS = {
  // weekly
  'first-buy': 'wallet',
  diversified: 'bars',
  'green-open': 'chart',
  comeback: 'pulse',
  'big-mover': 'flame',
  'photo-finish': 'target',
  'podium-streak': 'trophy',
  'clean-sweep': 'zap',
  conviction: 'clock',
  closer: 'progress',
  // career
  'first-league': 'battles',
  'first-win': 'trophy',
  'podium-player': 'bars',
  regular: 'clock',
  'friendly-rival': 'users',
  'three-peat': 'flame',
  'six-figures': 'coin',
  'perfect-week': 'zap',
};

const RULES = {
  'first-buy': 'Your first filled buy has to land on Monday, the day the league opens.',
  'green-open':
    "Judged on Monday's closing snapshot: your stocks have to be worth more than you started with, not counting achievement money.",
  comeback: "Gain five or more places from one day's snapshot to the next day's.",
  'photo-finish': 'Buy something first, then sit within $100 of the player directly above you.',
  'big-mover': "Hold the day's biggest gainer — the stock up the most against its previous close.",
  'clean-sweep': 'Every stock you hold worth more than you paid for it, holding at least two.',
  conviction: 'Buy before Friday, then place no orders on Friday. Checked once Friday is over.',
  closer: "Finish the week ranked higher than you were in Friday's snapshot.",
  'first-league': 'Be in a league when it settles on Sunday.',
  regular: 'Be in ten leagues that have settled.',
  'six-figures': 'Reach $100,000 of profit added up across your settled leagues.',
  'perfect-week': 'Rank first in every daily snapshot of a league, over at least five days.',
};

export function achIcon(slug) {
  return ICONS[slug] ?? 'target';
}

export function achRule(ach) {
  return RULES[ach.slug] ?? ach.how;
}
