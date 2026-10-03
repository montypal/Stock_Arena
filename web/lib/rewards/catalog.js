// The achievement catalogue, for display.
//
// Mirrors worker/rewards.py, which is where achievements are actually judged
// and paid -- the worker stays the single author of anything that moves money,
// so nothing here awards anything. Keep the two tables in step; the numbers
// are asserted on the Python side in worker/test_rewards.py.
//
// Two currencies, never mixed (contextHistory.md "The Two Currencies"):
//   weekly -> league cash, into the entry that earned it
//   career -> coins, onto the profile

// The spec writes each award as a flat dollar amount, and those amounts only
// balance against a 100K portfolio: all ten together are 5.7% of a $100,000
// start, but 570% of a $1,000 one. So the table is read as 100K-league dollars
// and paid as the same share of whatever you started with -- a full sweep is
// worth 5.7% of your starting cash in every tier.
// Mirrors weekly_cash() in worker/rewards.py, which is what actually pays.
const CALIBRATION_TIER = 100000;

export function weeklyCash(base, tier) {
  return Math.round((Number(base) * Number(tier)) / CALIBRATION_TIER * 100) / 100;
}

export const WEEKLY = [
  { slug: 'first-buy', name: 'First Buy', how: 'Build your portfolio on Monday', base: 250 },
  { slug: 'diversified', name: 'Diversified', how: 'Hold five or more different stocks', base: 300 },
  { slug: 'green-open', name: 'Green Open', how: 'Finish Monday in profit', base: 250 },
  { slug: 'comeback', name: 'Comeback', how: 'Climb five or more places in a day', base: 500 },
  { slug: 'big-mover', name: 'Big Mover', how: "Own the league's best stock on any day", base: 500 },
  { slug: 'photo-finish', name: 'Photo Finish', how: 'Sit within $100 of the player above', base: 400 },
  { slug: 'podium-streak', name: 'Podium Streak', how: 'Hold top three for three days running', base: 750 },
  { slug: 'clean-sweep', name: 'Clean Sweep', how: 'Every stock up at the same time', base: 1000 },
  { slug: 'conviction', name: 'Conviction', how: 'Make no changes at the Friday trade', base: 1000 },
  { slug: 'closer', name: 'Closer', how: 'Finish higher than you were on Friday', base: 750 },
];

// What a full sweep of the weekly board is worth in a tier, for screens that
// want to tell the player what is on the table this week.
export function weeklySweep(tier) {
  return WEEKLY.reduce((sum, a) => sum + weeklyCash(a.base, tier), 0);
}

export const CAREER = [
  { slug: 'first-league', name: 'First League', how: 'Finish a full league', coins: 100 },
  { slug: 'first-win', name: 'First Win', how: 'Win a league', coins: 500 },
  { slug: 'podium-player', name: 'Podium Player', how: 'Finish top three five times', coins: 400 },
  { slug: 'regular', name: 'Regular', how: 'Play ten leagues', coins: 300 },
  // Private leagues aren't built yet, so this one can't be earned. Shown as
  // waiting rather than as a goal a player could chase today.
  { slug: 'friendly-rival', name: 'Friendly Rival', how: 'Win a private league', coins: 400, waiting: 'private leagues' },
  { slug: 'three-peat', name: 'Three-Peat', how: 'Win three weeks in a row', coins: 1000 },
  { slug: 'six-figures', name: 'Six Figures', how: 'Reach $100,000 career profit', coins: 750 },
  { slug: 'perfect-week', name: 'Perfect Week', how: 'Hold first every day of a league', coins: 1500 },
];

// Merge the catalogue with what a player has actually been paid.
// earned: rows from entryAchievements() / userAchievements().

export function weeklyBoard(earned, tier) {
  const paid = new Map(earned.map((r) => [r.slug, r]));
  return WEEKLY.map((a) => {
    const row = paid.get(a.slug);
    return {
      ...a,
      cash: row ? Number(row.cash) : weeklyCash(a.base, tier),
      earned: Boolean(row),
      at: row ? row.awarded_at : null,
    };
  });
}

export function careerBoard(earned) {
  const paid = new Map(earned.map((r) => [r.slug, r]));
  return CAREER.map((a) => {
    const row = paid.get(a.slug);
    return { ...a, earned: Boolean(row), at: row ? row.awarded_at : null };
  });
}

// Totals for a board from weeklyBoard()/careerBoard().
export function boardTotals(board, key) {
  const done = board.filter((a) => a.earned);
  return {
    count: done.length,
    of: board.length,
    value: done.reduce((sum, a) => sum + Number(a[key] ?? 0), 0),
  };
}
