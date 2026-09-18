"""
Game rules the worker enforces: order fills and weekly settlement.

The web app validates orders when they are placed and writes them as
'pending'. Everything that moves money happens here, inside a transaction,
so fills and payouts have exactly one author.
"""

from collections import defaultdict
from decimal import Decimal, ROUND_DOWN, ROUND_HALF_UP

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
