import { query, one, transaction } from '../db';
import { money } from '../utils/format';

export const TIERS = [
  { tier: 1000, label: '1K League', short: '1K', multiplier: 1, medal: '🥉', blurb: 'Entry level. $1,000 starting cash.' },
  { tier: 10000, label: '10K League', short: '10K', multiplier: 2, medal: '🥈', blurb: 'Mid stakes. $10,000 starting cash.' },
  { tier: 100000, label: '100K League', short: '100K', multiplier: 4, medal: '🥇', blurb: 'High roller. $100,000 starting cash.' },
];

// First-place coins before the tier multiplier. Mirrors worker/game.py.
export const WIN_COINS = 500;

export function tierInfo(tier) {
  return TIERS.find((t) => t.tier === Number(tier)) ?? null;
}

export const POSITION_CAP = 1;
export const ROOM_CAPACITY = 30;

// Errors a player can act on. Anything else is a bug and should surface.
export class GameError extends Error {}

// ------------------------------------------------------------------ weeks

const ET_MONDAY = `date_trunc('week', now() AT TIME ZONE 'America/New_York')::date`;

// The week a player joining right now lands in: Monday 07:00 ET until
// Sunday 19:00 ET is this week, otherwise next week.
const JOINABLE_WEEK = `(CASE
  WHEN now() < ((${ET_MONDAY} + 6)::timestamp + time '19:00') AT TIME ZONE 'America/New_York'
  THEN ${ET_MONDAY}
  ELSE ${ET_MONDAY} + 7
END)`;

export async function joinableWeek() {
  const row = await one(`SELECT ${JOINABLE_WEEK} AS ws`);
  return row.ws;
}

export function marketOpen(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value])
  );
  if (parts.weekday === 'Sat' || parts.weekday === 'Sun') return false;
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  return minutes >= 9 * 60 + 30 && minutes < 16 * 60;
}

// ---------------------------------------------------------------- entries

const ENTRY_SELECT = `
  SELECT e.id, e.user_id, e.league_id, e.room_id, e.week_start,
         e.starting_balance, e.cash, e.joined_at,
         e.final_value, e.final_rank, e.coins_awarded,
         l.tier, l.starts_at, l.trading_closes_at, l.ends_at, l.status AS league_status,
         (l.status = 'open' AND now() >= l.starts_at AND now() < l.ends_at) AS trading_open,
         (now() < l.starts_at) AS not_started,
         (SELECT count(*) FROM rooms r2
           WHERE r2.league_id = e.league_id AND r2.id <= e.room_id) AS room_number,
         (SELECT count(*) FROM entries e2 WHERE e2.room_id = e.room_id) AS room_size
  FROM entries e
  JOIN leagues l ON l.id = e.league_id`;

// The player's most recent league entry, if any.
export async function currentEntry(userId) {
  return one(`${ENTRY_SELECT} WHERE e.user_id = $1 ORDER BY e.week_start DESC LIMIT 1`, [userId]);
}

export async function currentEntries(userId) {
  return query(
    `${ENTRY_SELECT} WHERE e.user_id = $1 ORDER BY e.week_start DESC`,
    [userId]
  );
}

export async function pastEntries(userId) {
  return query(
    `${ENTRY_SELECT} WHERE e.user_id = $1 AND l.status = 'settled' ORDER BY e.week_start DESC LIMIT 20`,
    [userId]
  );
}

export async function entriesForWeek(userId, week) {
  return query(
    `${ENTRY_SELECT} WHERE e.user_id = $1 AND e.week_start = $2::date ORDER BY l.tier`,
    [userId, week]
  );
}

// Get the entry for a specific tier in the current week,
// or null if the player hasn't joined that tier.
export async function entryForTier(userId, week, tier) {
  return one(
    `${ENTRY_SELECT} WHERE e.user_id = $1 AND e.week_start = $2::date AND l.tier = $3::int ORDER BY e.league_id`,
    [userId, week, tier]
  );
}

// Whether a league week (by its Monday, league opens 07:00 ET) is underway.
export async function weekHasStarted(ws) {
  const row = await one(
    `SELECT now() >= (($1::date)::timestamp + time '07:00') AT TIME ZONE 'America/New_York' AS started`,
    [ws]
  );
  return row.started;
}

// Career record: settled leagues, wins, podiums, win rate, and the current
// streak of consecutive weeks played (counting back from the latest entry).
export async function careerStats(userId) {
  const [totals, weeks] = await Promise.all([
    one(
      `SELECT count(*) FILTER (WHERE l.status = 'settled') AS played,
              count(*) FILTER (WHERE e.final_rank = 1)      AS wins,
              count(*) FILTER (WHERE e.final_rank <= 3)     AS podiums
       FROM entries e JOIN leagues l ON l.id = e.league_id
       WHERE e.user_id = $1`,
      [userId]
    ),
    query('SELECT week_start FROM entries WHERE user_id = $1 ORDER BY week_start DESC LIMIT 60', [userId]),
  ]);

  let streak = 0;
  let expected = null;
  for (const { week_start } of weeks) {
    const t = Date.parse(`${week_start}T00:00:00Z`);
    if (expected !== null && t !== expected) break;
    streak += 1;
    expected = t - 7 * 24 * 60 * 60 * 1000;
  }

  return {
    played: totals.played,
    wins: totals.wins,
    podiums: totals.podiums,
    winRate: totals.played ? totals.wins / totals.played : 0,
    streak,
  };
}

export async function joinLeague(userId, tier) {
  if (!tierInfo(tier)) throw new GameError('Pick one of the three leagues.');

  try {
    return await transaction(async (c) => {
      const { ws } = (await c.query(`SELECT ${JOINABLE_WEEK} AS ws`)).rows[0];

      const existing = await c.query(
        'SELECT 1 FROM entries WHERE user_id = $1 AND league_id = (SELECT id FROM leagues WHERE tier = $2 AND week_start = $3::date)',
        [userId, tier, ws]
      );
      if (existing.rowCount) {
        throw new GameError(`You've already joined the ${tierInfo(tier).label} this week.`);
      }

      const league = (
        await c.query(
          `INSERT INTO leagues (tier, week_start, starts_at, trading_closes_at, ends_at)
           VALUES ($1, $2::date,
                   ($2::date)::timestamp + time '07:00' AT TIME ZONE 'America/New_York',
                   (($2::date + 6)::timestamp + time '19:00') AT TIME ZONE 'America/New_York',
                   (($2::date + 6)::timestamp + time '19:00') AT TIME ZONE 'America/New_York')
           ON CONFLICT (tier, week_start) DO UPDATE SET tier = EXCLUDED.tier
           RETURNING id`,
          [tier, ws]
        )
      ).rows[0];

      let room = (
        await c.query(
          `SELECT r.id FROM rooms r
           WHERE r.league_id = $1
             AND r.capacity > (SELECT count(*) FROM entries e WHERE e.room_id = r.id)
           ORDER BY r.id
           FOR UPDATE`,
          [league.id]
        )
      ).rows[0];
      if (!room) {
        room = (
          await c.query('INSERT INTO rooms (league_id, capacity) VALUES ($1, $2) RETURNING id', [
            league.id,
            ROOM_CAPACITY,
          ])
        ).rows[0];
      }

      await c.query(
        `INSERT INTO entries (user_id, league_id, room_id, week_start, starting_balance, cash)
         VALUES ($1, $2, $3, $4::date, $5, $5)`,
        [userId, league.id, room.id, ws, tier]
      );
      return ws;
    });
  } catch (err) {
    if (err.code === '23505') {
      throw new GameError(`You've already joined the ${tierInfo(tier).label} this week.`);
    }
    throw err;
}
}

// -------------------------------------------------------------- portfolio

export async function holdings(entryId) {
  return query(
    `SELECT p.symbol, s.name, p.shares, p.cost_basis,
            lp.price, lp.prev_close,
            COALESCE(p.shares * lp.price, p.cost_basis) AS value
     FROM positions p
     JOIN stocks s ON s.symbol = p.symbol
     LEFT JOIN latest_price lp ON lp.symbol = p.symbol
     WHERE p.entry_id = $1
     ORDER BY value DESC`,
    [entryId]
  );
}

export function summarize(entry, rows) {
  const invested = rows.reduce((sum, r) => sum + Number(r.value), 0);
  const live = Number(entry.cash) + invested;
  const value = entry.final_value != null ? Number(entry.final_value) : live;
  const start = Number(entry.starting_balance);
  return { value, invested, cash: Number(entry.cash), profit: value - start, change: (value - start) / start };
}

export async function orders(entryId, { pending }) {
  return query(
    `SELECT id, symbol, side, amount, sell_all, status, placed_at, filled_at,
            fill_price, fill_shares, fill_amount, reject_reason
     FROM orders
     WHERE entry_id = $1 AND ${pending ? "status = 'pending'" : "status <> 'pending'"}
     ORDER BY placed_at DESC
     LIMIT 20`,
    [entryId]
  );
}

export async function leaderboard(roomId) {
  return query(
    `SELECT * FROM (
       SELECT e.id AS entry_id, e.user_id, u.display_name, e.starting_balance,
              e.joined_at, e.final_rank, e.coins_awarded,
              COUNT(p.symbol) AS stocks,
              COALESCE(e.final_value,
                       e.cash + COALESCE(SUM(COALESCE(p.shares * lp.price, p.cost_basis)), 0)) AS value
       FROM entries e
       JOIN users u ON u.id = e.user_id
       LEFT JOIN positions p     ON p.entry_id = e.id
       LEFT JOIN latest_price lp ON lp.symbol = p.symbol
       WHERE e.room_id = $1
       GROUP BY e.id, u.display_name
     ) t
     ORDER BY value DESC, joined_at, entry_id`,
    [roomId]
  );
}

// ------------------------------------------------------------------ stocks

export async function stocks(search, sort) {
  const q = String(search ?? '').replace(/[^A-Za-z0-9 .&-]/g, '').trim().slice(0, 40);
  let orderBy = 's.symbol';
  switch (sort) {
    case 'price-asc':
      orderBy = 'lp.price ASC NULLS FIRST';
      break;
    case 'price-desc':
      orderBy = 'lp.price DESC NULLS LAST';
      break;
    case 'symbol':
      orderBy = 's.symbol ASC';
      break;
    case 'symbol-desc':
      orderBy = 's.symbol DESC';
      break;
    case 'trending':
    default:
      orderBy = 'lp.price / NULLIF(lp.prev_close, 0) DESC NULLS LAST';
      break;
  }
  return query(
    `SELECT s.symbol, s.name, lp.price, lp.prev_close, lp.updated_at
     FROM stocks s
     LEFT JOIN latest_price lp ON lp.symbol = s.symbol
     WHERE s.active
       AND ($1::text = '' OR s.symbol ILIKE ($1::text || '%') OR s.name ILIKE ('%' || $1::text || '%'))
     ORDER BY ${orderBy}`,
    [q]
  );
}

export async function stock(symbol) {
  return one(
    `SELECT s.symbol, s.name, s.description, s.industry, lp.price, lp.prev_close, lp.updated_at
     FROM stocks s
     LEFT JOIN latest_price lp ON lp.symbol = s.symbol
     WHERE s.active AND s.symbol = $1`,
    [symbol]
  );
}

// What a player can do with one stock right now. Affordability only — buy as
// much as you can afford as long as you have the cash (no per-stock cap).
export async function tradeLimits(entry, symbol) {
  const row = await one(
    `SELECT
       (SELECT COALESCE(SUM(COALESCE(p.shares * lp.price, p.cost_basis)), 0)
          FROM positions p LEFT JOIN latest_price lp ON lp.symbol = p.symbol
          WHERE p.entry_id = $1) AS invested,
       (SELECT p.shares FROM positions p WHERE p.entry_id = $1 AND p.symbol = $2) AS shares,
       (SELECT COALESCE(p.shares * lp.price, p.cost_basis)
          FROM positions p LEFT JOIN latest_price lp ON lp.symbol = p.symbol
          WHERE p.entry_id = $1 AND p.symbol = $2) AS position_value`,
    [entry.id, symbol]
  );
  const cash = Number(entry.cash);
  const portfolio = cash + Number(row.invested);
  const priceRow = await query(
    `SELECT lp.price FROM stocks s LEFT JOIN latest_price lp ON lp.symbol = s.symbol
     WHERE s.symbol = $1 AND s.active`,
    [symbol]
  );
  const price = priceRow.length > 0 ? Number(priceRow[0].price) : 0;
  const available = cash;
  const maxBuy = Math.floor(available * 100) / 100;
  const maxShares = price > 0 ? Math.floor(available / price) : 0;
  return {
    available,
    capRoom: available,
    maxBuy,
    maxShares,
    shares: Number(row.shares ?? 0),
    positionValue: Number(row.position_value ?? 0),
    portfolio,
    price,
  };
}

// ------------------------------------------------------------------ orders

export async function placeOrder(userId, { symbol, side, shares, amount, sellAll, entryId }) {
  return transaction(async (c) => {
    const result = await c.query(
      `SELECT e.id, e.cash, (l.status = 'open' AND now() >= l.starts_at AND now() < l.ends_at) AS trading_open
       FROM entries e JOIN leagues l ON l.id = e.league_id
       WHERE e.user_id = $1 ORDER BY e.week_start DESC, e.id DESC`,
      [userId]
    );
    if (result.rowCount === 0) throw new GameError('Join a league before trading.');

    const targetEntry = entryId
      ? result.rows.find((e) => String(e.id) === String(entryId))
      : result.rows.find((e) => e.trading_open) || result.rows[0];
    if (!targetEntry) throw new GameError('Join a league before trading.');

    if (!targetEntry.trading_open) throw new GameError('Trading is closed for this league.');

    const quote = (
      await c.query(
        `SELECT lp.price FROM stocks s LEFT JOIN latest_price lp ON lp.symbol = s.symbol
         WHERE s.symbol = $1 AND s.active`,
        [symbol]
      )
    ).rows[0];
    if (!quote) throw new GameError("That stock isn't available in StockArena.");
    if (quote.price == null) {
      throw new GameError("This stock doesn't have a price yet. Try again after the next update.");
    }

    if (side === 'buy') {
      if (!(shares >= 1)) throw new GameError('Enter at least 1 share.');
      if (!Number.isInteger(shares)) throw new GameError('Whole shares only.');
      const estimatedAmount = Math.round(shares * quote.price * 100) / 100;
      if (estimatedAmount > targetEntry.cash + 0.005) {
        throw new GameError(`You have ${money(targetEntry.cash)} to spend.`);
      }

      // Execute immediately: deduct cash, record position, insert filled order.
      await c.query(
        `UPDATE entries SET cash = cash - $1 WHERE id = $2`,
        [estimatedAmount, targetEntry.id]
      );
      await c.query(
        `INSERT INTO positions (entry_id, symbol, shares, cost_basis)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (entry_id, symbol) DO UPDATE SET
           shares = positions.shares + $3,
           cost_basis = positions.cost_basis + $4`,
        [targetEntry.id, symbol, shares, estimatedAmount]
      );
      await c.query(
        `INSERT INTO orders (entry_id, symbol, side, amount, shares, status, fill_price, fill_shares, fill_amount, filled_at)
         VALUES ($1, $2, 'buy', $3, $4, 'filled', $5, $4, $3, now())`,
        [targetEntry.id, symbol, estimatedAmount, shares, quote.price]
      );
      return;
    }

    if (side === 'sell') {
      const posResult = await c.query(
        `SELECT shares, cost_basis FROM positions WHERE entry_id = $1 AND symbol = $2`,
        [targetEntry.id, symbol]
      );
      const pos = posResult.rows[0];
      if (!pos || pos.shares <= 0) throw new GameError(`You don't own any ${symbol}.`);
      if (sellAll) {
        shares = pos.shares;
      }
      if (!(shares >= 1)) throw new GameError('Enter at least 1 share.');
      if (!Number.isInteger(shares)) throw new GameError('Whole shares only.');
      if (shares > pos.shares) throw new GameError(`You only own ${pos.shares} shares of ${symbol}.`);

      const estimatedAmount = Math.round(shares * quote.price * 100) / 100;

      // Execute immediately: add cash, adjust position, insert filled order.
      await c.query(
        `UPDATE entries SET cash = cash + $1 WHERE id = $2`,
        [estimatedAmount, targetEntry.id]
      );
      if (shares >= pos.shares) {
        await c.query(
          `DELETE FROM positions WHERE entry_id = $1 AND symbol = $2`,
          [targetEntry.id, symbol]
        );
      } else {
        const costPerShare = pos.cost_basis / pos.shares;
        const reduction = costPerShare * shares;
        await c.query(
          `UPDATE positions SET shares = shares - $1, cost_basis = cost_basis - $2
           WHERE entry_id = $3 AND symbol = $4`,
          [shares, reduction, targetEntry.id, symbol]
        );
      }
      await c.query(
        `INSERT INTO orders (entry_id, symbol, side, amount, shares, status, fill_price, fill_shares, fill_amount, filled_at)
         VALUES ($1, $2, 'sell', $3, $4, 'filled', $5, $4, $3, now())`,
        [targetEntry.id, symbol, estimatedAmount, shares, quote.price]
      );
      return;
    }

    throw new GameError('Choose buy or sell.');
  });
}

export async function cancelOrder(userId, orderId) {
  const rows = await query(
    `UPDATE orders o SET status = 'cancelled'
     FROM entries e
     WHERE o.id = $1 AND o.entry_id = e.id AND e.user_id = $2 AND o.status = 'pending'
     RETURNING o.id`,
    [orderId, userId]
  );
  if (!rows.length) throw new GameError('That order already filled or was cancelled.');
}
