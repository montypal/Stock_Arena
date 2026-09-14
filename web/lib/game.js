import { query, one, transaction } from './db';
import { money } from './format';

export const TIERS = [
  { tier: 1000, label: '1K League', short: '1K', multiplier: 1 },
  { tier: 10000, label: '10K League', short: '10K', multiplier: 2 },
  { tier: 100000, label: '100K League', short: '100K', multiplier: 4 },
];

export function tierInfo(tier) {
  return TIERS.find((t) => t.tier === Number(tier)) ?? null;
}

export const POSITION_CAP = 0.2;
export const ROOM_CAPACITY = 30;

// Errors a player can act on. Anything else is a bug and should surface.
export class GameError extends Error {}

// ------------------------------------------------------------------ weeks

const ET_MONDAY = `date_trunc('week', now() AT TIME ZONE 'America/New_York')::date`;

// The week a player joining right now lands in: this week until Friday's
// close, then next week.
const JOINABLE_WEEK = `(CASE
  WHEN now() < ((${ET_MONDAY} + 4)::timestamp + time '16:00') AT TIME ZONE 'America/New_York'
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
         (l.status = 'open' AND now() < l.trading_closes_at) AS trading_open,
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

export async function pastEntries(userId) {
  return query(
    `${ENTRY_SELECT} WHERE e.user_id = $1 AND l.status = 'settled' ORDER BY e.week_start DESC LIMIT 20`,
    [userId]
  );
}

export async function joinLeague(userId, tier) {
  if (!tierInfo(tier)) throw new GameError('Pick one of the three leagues.');

  try {
    return await transaction(async (c) => {
      const { ws } = (await c.query(`SELECT ${JOINABLE_WEEK} AS ws`)).rows[0];

      const taken = await c.query(
        'SELECT 1 FROM entries WHERE user_id = $1 AND week_start = $2::date',
        [userId, ws]
      );
      if (taken.rowCount) throw new GameError("You've already joined a league this week.");

      const league = (
        await c.query(
          `INSERT INTO leagues (tier, week_start, starts_at, trading_closes_at, ends_at)
           VALUES ($1, $2::date,
                   ($2::date)::timestamp AT TIME ZONE 'America/New_York',
                   (($2::date + 4)::timestamp + time '16:00') AT TIME ZONE 'America/New_York',
                   ($2::date + 7)::timestamp AT TIME ZONE 'America/New_York')
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
           LIMIT 1
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
    // Two taps on Join at once: the second hits the unique (user, week) key.
    if (err.code === '23505') throw new GameError("You've already joined a league this week.");
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

export async function stocks(search) {
  const q = String(search ?? '').replace(/[^A-Za-z0-9 .&-]/g, '').trim().slice(0, 40);
  return query(
    `SELECT s.symbol, s.name, lp.price, lp.prev_close, lp.updated_at
     FROM stocks s
     LEFT JOIN latest_price lp ON lp.symbol = s.symbol
     WHERE s.active
       AND ($1::text = '' OR s.symbol ILIKE ($1::text || '%') OR s.name ILIKE ('%' || $1::text || '%'))
     ORDER BY s.symbol`,
    [q]
  );
}

export async function stock(symbol) {
  return one(
    `SELECT s.symbol, s.name, lp.price, lp.prev_close, lp.updated_at
     FROM stocks s
     LEFT JOIN latest_price lp ON lp.symbol = s.symbol
     WHERE s.active AND s.symbol = $1`,
    [symbol]
  );
}

// What a player can do with one stock right now.
export async function tradeLimits(entry, symbol) {
  const row = await one(
    `SELECT
       (SELECT COALESCE(SUM(amount), 0) FROM orders
         WHERE entry_id = $1 AND status = 'pending' AND side = 'buy') AS pending_buys,
       (SELECT COALESCE(SUM(amount), 0) FROM orders
         WHERE entry_id = $1 AND status = 'pending' AND side = 'buy' AND symbol = $2) AS pending_buys_here,
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
  const available = Math.max(0, cash - Number(row.pending_buys));
  const capRoom = Math.max(
    0,
    POSITION_CAP * portfolio - Number(row.position_value ?? 0) - Number(row.pending_buys_here)
  );
  return {
    available,
    capRoom,
    maxBuy: Math.floor(Math.min(available, capRoom) * 100) / 100,
    shares: Number(row.shares ?? 0),
    positionValue: Number(row.position_value ?? 0),
    portfolio,
  };
}

// ------------------------------------------------------------------ orders

export async function placeOrder(userId, { symbol, side, amount, sellAll }) {
  return transaction(async (c) => {
    const entry = (
      await c.query(
        `SELECT e.id, e.cash, (l.status = 'open' AND now() < l.trading_closes_at) AS trading_open
         FROM entries e JOIN leagues l ON l.id = e.league_id
         WHERE e.user_id = $1
         ORDER BY e.week_start DESC
         LIMIT 1
         FOR UPDATE OF e`,
        [userId]
      )
    ).rows[0];
    if (!entry) throw new GameError('Join a league before trading.');
    if (!entry.trading_open) throw new GameError('Trading is closed for this league.');

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

    const limits = await tradeLimits(entry, symbol);

    if (side === 'buy') {
      if (!(amount >= 1)) throw new GameError('Enter at least $1.00.');
      if (amount > limits.available + 0.005) {
        throw new GameError(`You have ${money(limits.available)} available to spend.`);
      }
      if (amount > limits.capRoom + 0.005) {
        throw new GameError(
          `No stock can be more than 20% of your portfolio. You can add up to ${money(limits.capRoom)} more of ${symbol}.`
        );
      }
      await c.query(
        `INSERT INTO orders (entry_id, symbol, side, amount) VALUES ($1, $2, 'buy', $3)`,
        [entry.id, symbol, amount]
      );
      return;
    }

    if (side === 'sell') {
      if (!(limits.shares > 0)) throw new GameError(`You don't own any ${symbol}.`);
      if (sellAll) {
        await c.query(
          `INSERT INTO orders (entry_id, symbol, side, sell_all) VALUES ($1, $2, 'sell', true)`,
          [entry.id, symbol]
        );
        return;
      }
      if (!(amount >= 1)) throw new GameError('Enter at least $1.00.');
      if (amount > limits.positionValue + 0.005) {
        throw new GameError(
          `Your ${symbol} is worth about ${money(limits.positionValue)}. Use Sell all to sell everything.`
        );
      }
      await c.query(
        `INSERT INTO orders (entry_id, symbol, side, amount) VALUES ($1, $2, 'sell', $3)`,
        [entry.id, symbol, amount]
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
