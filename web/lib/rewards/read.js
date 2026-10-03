import { one, query } from '../db';

// Reads for the reward screens. Display only -- achievements are judged and
// paid by the worker (worker/rewards.py + worker/game.py).
//
// The reward tables are created by worker/schema.sql, which the worker applies
// when it starts. Vercel can deploy before Railway has restarted, so every
// read here tolerates the tables not existing yet instead of crashing the
// page: 42P01 = undefined_table, 42703 = undefined_column.
async function soft(run, fallback) {
  try {
    return await run();
  } catch (err) {
    if (err.code === '42P01' || err.code === '42703') return fallback;
    throw err;
  }
}

// Weekly achievements already paid into one league entry.
export async function entryAchievements(entryId) {
  if (!entryId) return [];
  return soft(
    () =>
      query(
        `SELECT slug, cash, awarded_at FROM entry_achievements
         WHERE entry_id = $1 ORDER BY awarded_at, slug`,
        [entryId]
      ),
    []
  );
}

// Career achievements already paid to a player.
export async function userAchievements(userId) {
  if (!userId) return [];
  return soft(
    () =>
      query(
        `SELECT slug, coins, awarded_at FROM user_achievements
         WHERE user_id = $1 ORDER BY awarded_at, slug`,
        [userId]
      ),
    []
  );
}

// A league's day-by-day history for one entry, oldest first. Powers the
// trend line in the buddy's stats panel and the daily achievement board.
export async function entrySnapshots(entryId) {
  if (!entryId) return [];
  return soft(
    () =>
      query(
        `SELECT snapshot_date, value, cash, rank, room_size, positions
         FROM entry_snapshots WHERE entry_id = $1 ORDER BY snapshot_date`,
        [entryId]
      ),
    []
  );
}

// Where a player's coins came from: league placements and career achievements.
export async function coinSources(userId) {
  if (!userId) return { fromPlacements: 0, fromAchievements: 0 };
  const [placements, achievements] = await Promise.all([
    soft(
      () =>
        one(
          `SELECT COALESCE(SUM(coins_awarded), 0) AS total FROM entries WHERE user_id = $1`,
          [userId]
        ),
      { total: 0 }
    ),
    soft(
      () =>
        one(`SELECT COALESCE(SUM(coins), 0) AS total FROM user_achievements WHERE user_id = $1`, [
          userId,
        ]),
      { total: 0 }
    ),
  ]);
  return {
    fromPlacements: Number(placements?.total ?? 0),
    fromAchievements: Number(achievements?.total ?? 0),
  };
}

// The achievement cash paid into one entry this week, for the portfolio
// breakdown ("achievement money earned this week" in the spec).
export async function entryAchievementCash(entryId) {
  if (!entryId) return 0;
  const row = await soft(
    () =>
      one(`SELECT COALESCE(SUM(cash), 0) AS total FROM entry_achievements WHERE entry_id = $1`, [
        entryId,
      ]),
    { total: 0 }
  );
  return Number(row?.total ?? 0);
}
