"""
Game rules the worker enforces: order fills and weekly settlement.

The web app validates orders when they are placed and writes them as
'pending'. Everything that moves money happens here, inside a transaction,
so fills and payouts have exactly one author.
"""

from collections import defaultdict
from datetime import timedelta
from decimal import Decimal, ROUND_DOWN, ROUND_HALF_UP

import rewards

SHARES_Q = Decimal("0.00000001")
MONEY_Q = Decimal("0.0001")
# A sell that would leave less than this much of a stock behind sells it all,
# so positions don't linger as fractions of a cent.
DUST = Decimal("0.01")

TIER_MULTIPLIER = {1000: 1, 10000: 2, 100000: 4}
PLACE_COINS = {1: 500, 2: 350, 3: 250}
TOP_HALF_COINS = 100
FINISH_COINS = 50


# ------------------------------------------------------------------ payouts

def coin_payout(rank, room_size, tier, traded):
    """Coins for finishing `rank` of `room_size` in a league of `tier`.

    A player who never had an order fill didn't play, and earns nothing.
    """
    if not traded:
        return 0
    if rank in PLACE_COINS:
        base = PLACE_COINS[rank]
    elif rank * 2 <= room_size:
        base = TOP_HALF_COINS
    else:
        base = FINISH_COINS
    return base * TIER_MULTIPLIER.get(tier, 1)


def rank_room(rows):
    """Order a room's entries best-first.

    Ties on value go to whoever joined first, then to the lower entry id, so
    the result is always deterministic.
    """
    return sorted(rows, key=lambda r: (-r["value"], r["joined_at"], r["entry_id"]))


# ---------------------------------------------------------------- universe

def active_symbols(conn):
    rows = conn.execute(
        "SELECT symbol FROM stocks WHERE active ORDER BY symbol"
    ).fetchall()
    return [r[0] for r in rows]


def symbols_missing_prices(conn):
    rows = conn.execute(
        """
        SELECT s.symbol FROM stocks s
        LEFT JOIN latest_price lp ON lp.symbol = s.symbol
        WHERE s.active AND lp.symbol IS NULL
        ORDER BY s.symbol
        """
    ).fetchall()
    return [r[0] for r in rows]


def symbols_missing_profiles(conn):
    rows = conn.execute(
        """
        SELECT symbol FROM stocks
        WHERE active AND (description IS NULL OR description = '')
        ORDER BY symbol
        """
    ).fetchall()
    return [r[0] for r in rows]


# -------------------------------------------------------------------- fills

def fill_pending_orders(conn, quotes, log):
    """Fill every pending order that has a price observed after it was placed.

    `quotes` maps symbol -> (price, prev_close, observed_at), where observed_at
    is database time taken just before that quote was requested.
    """
    if not quotes:
        return
    ids = conn.execute(
        """
        SELECT id FROM orders
        WHERE status = 'pending' AND symbol = ANY(%s)
        ORDER BY placed_at, id
        """,
        (list(quotes),),
    ).fetchall()

    filled = rejected = 0
    for (order_id,) in ids:
        with conn.transaction():
            outcome = _fill_one(conn, order_id, quotes)
        if outcome == "filled":
            filled += 1
        elif outcome == "rejected":
            rejected += 1

    if filled or rejected:
        log(f"orders: {filled} filled, {rejected} rejected")


def _reject(conn, order_id, reason):
    conn.execute(
        "UPDATE orders SET status = 'rejected', reject_reason = %s WHERE id = %s",
        (reason, order_id),
    )
    return "rejected"


def _fill_one(conn, order_id, quotes):
    row = conn.execute(
        """
        SELECT o.entry_id, o.symbol, o.side, o.amount, o.shares, o.sell_all, o.placed_at,
               l.status, l.trading_closes_at
        FROM orders o
        JOIN entries e ON e.id = o.entry_id
        JOIN leagues l ON l.id = e.league_id
        WHERE o.id = %s AND o.status = 'pending'
        FOR UPDATE OF o
        """,
        (order_id,),
    ).fetchone()
    if row is None:
        return None  # cancelled or handled since we listed it

    entry_id, symbol, side, amount, shares, sell_all, placed_at, league_status, closes_at = row
    price, _prev_close, observed_at = quotes[symbol]

    # Forward pricing: only a price observed after the order was placed fills it.
    if placed_at >= observed_at:
        return None
    if league_status != "open" or observed_at > closes_at:
        return _reject(conn, order_id, "Trading closed before this order could fill.")

    price = Decimal(str(price))
    cash = conn.execute(
        "SELECT cash FROM entries WHERE id = %s FOR UPDATE", (entry_id,)
    ).fetchone()[0]

    if side == "buy":
        # Use shares if set (new share-based orders), otherwise fall back to amount (old dollar-based orders)
        if shares is not None and shares > 0:
            share_count = shares
        elif amount is not None and amount > 0:
            share_count = (amount / price).quantize(SHARES_Q, rounding=ROUND_DOWN)
        else:
            return _reject(conn, order_id, "Invalid order amount.")
        if share_count <= 0:
            return _reject(conn, order_id, "Order too small to buy any shares.")
        fill_price = price
        fill_amount = (share_count * fill_price).quantize(MONEY_Q, rounding=ROUND_HALF_UP)
        if fill_amount > cash:
            return _reject(conn, order_id, "Not enough cash when the order filled.")
        conn.execute(
            "UPDATE entries SET cash = cash - %s WHERE id = %s", (fill_amount, entry_id)
        )
        conn.execute(
            """
            INSERT INTO positions (entry_id, symbol, shares, cost_basis)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (entry_id, symbol) DO UPDATE
              SET shares = positions.shares + EXCLUDED.shares,
                  cost_basis = positions.cost_basis + EXCLUDED.cost_basis
            """,
            (entry_id, symbol, share_count, fill_amount),
        )
        fill_shares = share_count

    else:
        pos = conn.execute(
            """
            SELECT shares, cost_basis FROM positions
            WHERE entry_id = %s AND symbol = %s
            FOR UPDATE
            """,
            (entry_id, symbol),
        ).fetchone()
        if pos is None or pos[0] <= 0:
            return _reject(conn, order_id, "No shares left to sell.")
        held, cost_basis = pos

        if sell_all:
            share_count = held
        elif shares is not None and shares > 0:
            share_count = min(held, shares)
        else:
            if amount is None or amount <= 0:
                return _reject(conn, order_id, "Invalid order amount.")
            share_count = min(held, (amount / price).quantize(SHARES_Q, rounding=ROUND_DOWN))
        if (held - share_count) * price < DUST:
            share_count = held
        if share_count <= 0:
            return _reject(conn, order_id, "Order too small to sell any shares.")

        proceeds = (share_count * price).quantize(MONEY_Q, rounding=ROUND_HALF_UP)
        remaining = held - share_count
        if remaining <= 0:
            conn.execute(
                "DELETE FROM positions WHERE entry_id = %s AND symbol = %s",
                (entry_id, symbol),
            )
        else:
            new_basis = (cost_basis * remaining / held).quantize(MONEY_Q, rounding=ROUND_HALF_UP)
            conn.execute(
                """
                UPDATE positions SET shares = %s, cost_basis = %s
                WHERE entry_id = %s AND symbol = %s
                """,
                (remaining, new_basis, entry_id, symbol),
            )
        conn.execute(
            "UPDATE entries SET cash = cash + %s WHERE id = %s", (proceeds, entry_id)
        )
        fill_amount = proceeds

    conn.execute(
        """
        UPDATE orders
        SET status = 'filled', filled_at = now(),
            fill_price = %s, fill_shares = %s, fill_amount = %s
        WHERE id = %s
        """,
        (price, share_count, fill_amount, order_id),
    )
    return "filled"


# --------------------------------------------------------------- settlement

def settle_due_leagues(conn, log):
    """Settle every open league whose week has ended. Safe to call anytime."""
    due = conn.execute(
        "SELECT id FROM leagues WHERE status = 'open' AND ends_at <= now() ORDER BY ends_at, id"
    ).fetchall()
    for (league_id,) in due:
        with conn.transaction():
            result = _settle_one(conn, league_id)
        if result:
            players, coins = result
            log(f"settled league {league_id}: {players} players, {coins} coins paid")
            # Career achievements are judged on finished leagues, so they run
            # after the settlement transaction has committed final_rank.
            users = [
                r[0]
                for r in conn.execute(
                    "SELECT user_id FROM entries WHERE league_id = %s", (league_id,)
                ).fetchall()
            ]
            award_career_achievements(conn, users, log)


def _settle_one(conn, league_id):
    league = conn.execute(
        "SELECT tier FROM leagues WHERE id = %s AND status = 'open' FOR UPDATE",
        (league_id,),
    ).fetchone()
    if league is None:
        return None  # another process settled it first
    tier = league[0]

    conn.execute(
        """
        UPDATE orders SET status = 'cancelled',
                          reject_reason = 'The league ended before this order filled.'
        WHERE status = 'pending'
          AND entry_id IN (SELECT id FROM entries WHERE league_id = %s)
        """,
        (league_id,),
    )

    rows = conn.execute(
        """
        SELECT e.id, e.user_id, e.room_id, e.joined_at,
               e.cash + COALESCE(SUM(COALESCE(p.shares * lp.price, p.cost_basis)), 0),
               EXISTS (SELECT 1 FROM orders o
                       WHERE o.entry_id = e.id AND o.status = 'filled')
        FROM entries e
        LEFT JOIN positions p     ON p.entry_id = e.id
        LEFT JOIN latest_price lp ON lp.symbol = p.symbol
        WHERE e.league_id = %s
        GROUP BY e.id
        """,
        (league_id,),
    ).fetchall()

    rooms = defaultdict(list)
    for entry_id, user_id, room_id, joined_at, value, traded in rows:
        rooms[room_id].append({
            "entry_id": entry_id,
            "user_id": user_id,
            "joined_at": joined_at,
            "value": Decimal(value).quantize(MONEY_Q, rounding=ROUND_HALF_UP),
            "traded": traded,
        })

    total_coins = 0
    for room in rooms.values():
        ranked = rank_room(room)
        for rank, r in enumerate(ranked, start=1):
            coins = coin_payout(rank, len(ranked), tier, r["traded"])
            conn.execute(
                """
                UPDATE entries SET final_value = %s, final_rank = %s, coins_awarded = %s
                WHERE id = %s
                """,
                (r["value"], rank, coins, r["entry_id"]),
            )
            if coins:
                conn.execute(
                    "UPDATE users SET coins = coins + %s WHERE id = %s",
                    (coins, r["user_id"]),
                )
                total_coins += coins

    conn.execute(
        "UPDATE leagues SET status = 'settled', settled_at = now() WHERE id = %s",
        (league_id,),
    )
    return len(rows), total_coins


# ------------------------------------------------------- daily snapshots

# One row per entry per ET day. Re-run safe: the row is overwritten all day,
# so the last write of a day is that day's closing state, which is what the
# day-based achievements are judged on.
_SNAPSHOT_SQL = """
WITH live AS (
    SELECT e.id AS entry_id, e.room_id, e.joined_at, e.cash,
           e.cash + COALESCE(SUM(COALESCE(p.shares * lp.price, p.cost_basis)), 0) AS value,
           count(p.symbol) AS positions,
           (SELECT COALESCE(SUM(a.cash), 0) FROM entry_achievements a
             WHERE a.entry_id = e.id) AS awarded
    FROM entries e
    JOIN leagues l ON l.id = e.league_id
    LEFT JOIN positions p     ON p.entry_id = e.id
    LEFT JOIN latest_price lp ON lp.symbol = p.symbol
    -- now() < ends_at: once the week is over the standings are final, and a
    -- cycle that lands late (a redeploy, a reconnect) would otherwise stamp a
    -- finished league with the new day's date and add a phantom day.
    WHERE l.status = 'open' AND now() >= l.starts_at AND now() < l.ends_at
    GROUP BY e.id
), ranked AS (
    -- Same order as rank_room() and the app's leaderboard: value, then who
    -- joined first, then entry id.
    SELECT entry_id, cash, value, positions, awarded,
           row_number() OVER w AS rank,
           count(*) OVER (PARTITION BY room_id) AS room_size
    FROM live
    WINDOW w AS (PARTITION BY room_id ORDER BY value DESC, joined_at, entry_id)
)
INSERT INTO entry_snapshots
       (entry_id, snapshot_date, value, cash, rank, room_size, positions, awarded)
SELECT entry_id, (now() AT TIME ZONE 'America/New_York')::date,
       value, cash, rank, room_size, positions, awarded
FROM ranked
ON CONFLICT (entry_id, snapshot_date) DO UPDATE
   SET value = EXCLUDED.value, cash = EXCLUDED.cash, rank = EXCLUDED.rank,
       room_size = EXCLUDED.room_size, positions = EXCLUDED.positions,
       awarded = EXCLUDED.awarded, taken_at = now()
"""


def write_snapshots(conn, log=None):
    """Record where every live entry stands today."""
    with conn.transaction():
        result = conn.execute(_SNAPSHOT_SQL)
    if log and result.rowcount:
        log(f"snapshots: {result.rowcount} entries")
    return result.rowcount


# --------------------------------------------------- weekly achievements


class _LeagueSettled(Exception):
    """Raised to roll back an achievement payout whose league settled mid-write."""

# Everything the weekly rules need, for every entry in a live league.
_ENTRY_CTX_SQL = """
WITH live AS (
    SELECT e.id AS entry_id, e.user_id, e.room_id, e.joined_at, e.cash,
           e.week_start, e.starting_balance, l.tier,
           e.cash + COALESCE(SUM(COALESCE(p.shares * lp.price, p.cost_basis)), 0) AS value,
           count(p.symbol) AS positions,
           -- "Played at all". The placement payout already refuses to pay an
           -- entry with no filled order (coin_payout), and achievements have
           -- to hold the same line.
           EXISTS (SELECT 1 FROM orders o
                    WHERE o.entry_id = e.id AND o.status = 'filled') AS traded,
           -- Set on the pass that runs after the week ended but before
           -- settlement flips the league. On that pass the live order is the
           -- finishing order, which is when Closer can be judged.
           (now() >= l.ends_at) AS ending
    FROM entries e
    JOIN leagues l ON l.id = e.league_id
    LEFT JOIN positions p     ON p.entry_id = e.id
    LEFT JOIN latest_price lp ON lp.symbol = p.symbol
    WHERE l.status = 'open' AND now() >= l.starts_at
    GROUP BY e.id, l.tier, l.ends_at
)
SELECT entry_id, user_id, week_start, starting_balance, tier, cash, value, positions,
       traded, ending,
       row_number() OVER w AS rank,
       count(*) OVER (PARTITION BY room_id) AS room_size,
       (lag(value) OVER w) - value AS gap_above
FROM live
WINDOW w AS (PARTITION BY room_id ORDER BY value DESC, joined_at, entry_id)
"""


def best_symbol_today(conn):
    """The biggest gainer in the tradable universe right now, or None."""
    row = conn.execute(
        """
        SELECT symbol FROM latest_price
        WHERE prev_close IS NOT NULL AND prev_close > 0
        ORDER BY price / prev_close DESC
        LIMIT 1
        """
    ).fetchone()
    return row[0] if row else None


def _entry_positions(conn, entry_ids):
    rows = conn.execute(
        """
        SELECT p.entry_id, p.symbol, p.shares, p.cost_basis,
               COALESCE(p.shares * lp.price, p.cost_basis) AS value
        FROM positions p
        LEFT JOIN latest_price lp ON lp.symbol = p.symbol
        WHERE p.entry_id = ANY(%s)
        """,
        (entry_ids,),
    ).fetchall()
    out = defaultdict(list)
    for entry_id, symbol, shares, cost_basis, value in rows:
        out[entry_id].append(
            {"symbol": symbol, "shares": shares, "cost_basis": cost_basis, "value": value}
        )
    return out


def _entry_snapshots(conn, entry_ids):
    rows = conn.execute(
        """
        SELECT entry_id, snapshot_date, value, rank, room_size, awarded
        FROM entry_snapshots WHERE entry_id = ANY(%s) ORDER BY entry_id, snapshot_date
        """,
        (entry_ids,),
    ).fetchall()
    out = defaultdict(list)
    for entry_id, day, value, rank, room_size, awarded in rows:
        out[entry_id].append(
            {"date": day, "value": value, "rank": rank, "room_size": room_size, "awarded": awarded}
        )
    return out


def _entry_order_facts(conn, entry_ids):
    """First filled-buy day, and how many orders were placed on the week's
    Friday -- both on the America/New_York calendar, which is the one the
    league week is defined in."""
    rows = conn.execute(
        """
        SELECT e.id,
               min((o.placed_at AT TIME ZONE 'America/New_York')::date)
                   FILTER (WHERE o.side = 'buy' AND o.status = 'filled') AS first_buy,
               count(o.id) FILTER (
                   WHERE (o.placed_at AT TIME ZONE 'America/New_York')::date = e.week_start + 4
                     AND o.status IN ('filled', 'pending')
               ) AS friday_orders
        FROM entries e
        LEFT JOIN orders o ON o.entry_id = e.id
        WHERE e.id = ANY(%s)
        GROUP BY e.id
        """,
        (entry_ids,),
    ).fetchall()
    return {r[0]: {"first_buy_date": r[1], "friday_orders": r[2]} for r in rows}


def _already_awarded(conn, entry_ids):
    rows = conn.execute(
        "SELECT entry_id, slug FROM entry_achievements WHERE entry_id = ANY(%s)", (entry_ids,)
    ).fetchall()
    out = defaultdict(set)
    for entry_id, slug in rows:
        out[entry_id].add(slug)
    return out


def award_weekly_achievements(conn, log=None):
    """Pay every weekly achievement that has come true since the last pass.

    League cash, into the entry that earned it. Writes are idempotent: the
    receipt row goes in first and the cash only moves when that insert was
    new, so two workers can never pay the same achievement twice.
    """
    rows = conn.execute(_ENTRY_CTX_SQL).fetchall()
    if not rows:
        return 0

    entry_ids = [r[0] for r in rows]
    positions = _entry_positions(conn, entry_ids)
    snapshots = _entry_snapshots(conn, entry_ids)
    order_facts = _entry_order_facts(conn, entry_ids)
    awarded = _already_awarded(conn, entry_ids)
    best = best_symbol_today(conn)
    today = conn.execute("SELECT (now() AT TIME ZONE 'America/New_York')::date").fetchone()[0]

    paid = 0
    for (
        entry_id,
        _user_id,
        week_start,
        starting_balance,
        tier,
        cash,
        value,
        _position_count,
        traded,
        ending,
        rank,
        room_size,
        gap_above,
    ) in rows:
        facts = order_facts.get(entry_id, {})
        ctx = {
            "monday": week_start,
            "friday": week_start + timedelta(days=4),
            "today": today,
            "tier": tier,
            "starting_balance": starting_balance,
            "value": value,
            "cash": cash,
            "rank": rank,
            "room_size": room_size,
            "positions": positions.get(entry_id, []),
            "snapshots": snapshots.get(entry_id, []),
            "gap_above": gap_above,
            "best_symbol": best,
            "first_buy_date": facts.get("first_buy_date"),
            "friday_order_count": facts.get("friday_orders"),
            "traded": traded,
            "ending": ending,
            "final_rank": None,
        }
        for slug, amount in rewards.earned_weekly(ctx, awarded.get(entry_id, set())):
            try:
                with conn.transaction():
                    receipt = conn.execute(
                        """
                        INSERT INTO entry_achievements (entry_id, slug, cash)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (entry_id, slug) DO NOTHING
                        """,
                        (entry_id, slug, amount),
                    )
                    if not receipt.rowcount:
                        continue  # another worker paid it first
                    # Guarded on the league still being open: settlement reads
                    # cash to compute final_value, so a payout landing after
                    # that read would be money the standings never counted.
                    # Nothing applied means the league settled underneath us,
                    # and the receipt rolls back with it.
                    moved = conn.execute(
                        """
                        UPDATE entries e SET cash = e.cash + %s
                        WHERE e.id = %s
                          AND EXISTS (SELECT 1 FROM leagues l
                                       WHERE l.id = e.league_id AND l.status = 'open')
                        """,
                        (amount, entry_id),
                    )
                    if not moved.rowcount:
                        raise _LeagueSettled(entry_id)
            except _LeagueSettled:
                if log:
                    log(f"achievement: entry {entry_id} settled before {slug} could pay")
                break
            paid += 1
            if log:
                log(f"achievement: entry {entry_id} earned {slug} (+{amount} league cash)")
    return paid


# --------------------------------------------------- career achievements


# Settlement writes final_rank for every entry in a room, traded or not, so
# every career count has to filter on having actually played. Without it a
# player who joins each week and never trades is alone in their room, finishes
# "1st", and collects First Win, Perfect Week and the rest -- coins the
# placement payout (coin_payout) already refuses to pay them.
PLAYED = """EXISTS (SELECT 1 FROM orders o
                     WHERE o.entry_id = e.id AND o.status = 'filled')"""


def _career_ctx(conn, user_id):
    totals = conn.execute(
        f"""
        SELECT count(*) FILTER (WHERE l.status = 'settled'),
               count(*) FILTER (WHERE e.final_rank = 1),
               count(*) FILTER (WHERE e.final_rank <= 3),
               COALESCE(SUM(e.final_value - e.starting_balance)
                        FILTER (WHERE l.status = 'settled'), 0)
        FROM entries e JOIN leagues l ON l.id = e.league_id
        WHERE e.user_id = %s AND {PLAYED}
        """,
        (user_id,),
    ).fetchone()

    weeks = conn.execute(
        f"""
        SELECT DISTINCT e.week_start FROM entries e
        WHERE e.user_id = %s AND e.final_rank = 1 AND {PLAYED}
        """,
        (user_id,),
    ).fetchall()

    # First place on every recorded day of a finished league. At least five
    # days, so a league joined on Saturday cannot qualify.
    perfect = conn.execute(
        f"""
        SELECT EXISTS (
            SELECT 1 FROM entries e
            WHERE e.user_id = %s AND e.final_rank IS NOT NULL AND {PLAYED}
              AND (SELECT count(*) FROM entry_snapshots s WHERE s.entry_id = e.id) >= 5
              AND NOT EXISTS (
                  SELECT 1 FROM entry_snapshots s WHERE s.entry_id = e.id AND s.rank <> 1
              )
        )
        """,
        (user_id,),
    ).fetchone()[0]

    return {
        "settled": totals[0],
        "wins": totals[1],
        "podiums": totals[2],
        "career_profit": totals[3],
        "winning_weeks": [w[0] for w in weeks],
        "perfect_week": perfect,
    }


def award_career_catchup(conn, log=None):
    """Re-check every player who has finished a league.

    Career coins are normally paid the moment a league settles, but that runs
    after the settlement transaction commits -- a crash or a redeploy in that
    window would leave them unpaid forever, because settle_due_leagues never
    revisits a settled league. This sweep is cheap (the payout is a no-op once
    a player holds every slug they qualify for) and makes it self-healing.
    """
    users = [
        r[0]
        for r in conn.execute(
            f"""
            SELECT DISTINCT e.user_id FROM entries e
            WHERE e.final_rank IS NOT NULL AND {PLAYED}
            """
        ).fetchall()
    ]
    return award_career_achievements(conn, users, log) if users else 0


def award_career_achievements(conn, user_ids, log=None):
    """Pay career achievements in coins. Called after a league settles, so
    final_rank is already written."""
    paid = 0
    for user_id in sorted(set(user_ids)):
        have = {
            r[0]
            for r in conn.execute(
                "SELECT slug FROM user_achievements WHERE user_id = %s", (user_id,)
            ).fetchall()
        }
        ctx = _career_ctx(conn, user_id)
        for slug, coins in rewards.earned_career(ctx, have):
            with conn.transaction():
                receipt = conn.execute(
                    """
                    INSERT INTO user_achievements (user_id, slug, coins)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (user_id, slug) DO NOTHING
                    """,
                    (user_id, slug, coins),
                )
                if receipt.rowcount:
                    conn.execute(
                        "UPDATE users SET coins = coins + %s WHERE id = %s", (coins, user_id)
                    )
                    paid += 1
                    if log:
                        log(f"career achievement: user {user_id} earned {slug} (+{coins} coins)")
    return paid
