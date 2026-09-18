"""
StockArena worker.

Long-lived Railway process. Every cycle during market hours it:

  1. polls quotes for every active stock and writes them to Postgres,
  2. fills pending orders at those fresh prices (forward pricing, see game.py),
  3. settles any league whose week has ended.

Outside market hours it only settles leagues and fills in prices for stocks
that have never had one, so the app has something to show. Nothing in the app
ever calls the data vendor directly -- clients read the tables written here.

Environment:
    DATABASE_URL       Postgres connection string. Omit to run in dry-run mode.
    FINNHUB_API_KEY    Data provider key.
    POLL_SECONDS       Seconds between refreshes. Default 60.
    MARKET_HOURS_ONLY  "1" to sleep outside US market hours. Default "1".
"""

import os
import sys
import time
import signal
from datetime import datetime, time as dtime, timedelta
from zoneinfo import ZoneInfo

import psycopg
import requests

import game

EASTERN = ZoneInfo("America/New_York")
QUOTE_URL = "https://finnhub.io/api/v1/quote"
PROFILE_URL = "https://finnhub.io/api/v1/stock/profile2"
CLOSED_SLEEP_SECONDS = 300
RECONNECT_SECONDS = 10

# Only used in dry-run mode, where there's no database to read stocks from.
DRY_RUN_SYMBOLS = ["AAPL", "TSLA", "NVDA", "AMD", "SOFI", "PLTR", "COIN", "MARA"]

POLL_SECONDS = int(os.getenv("POLL_SECONDS", "60"))
API_KEY = os.getenv("FINNHUB_API_KEY", "")
DATABASE_URL = os.getenv("DATABASE_URL", "")
MARKET_HOURS_ONLY = os.getenv("MARKET_HOURS_ONLY", "1") == "1"

_running = True


def _stop(signum, frame):
    global _running
    log("shutdown signal received, finishing current cycle")
    _running = False


def log(msg):
    ts = datetime.now(EASTERN).strftime("%Y-%m-%d %H:%M:%S %Z")
    print(f"[{ts}] {msg}", flush=True)


def sleep_for(seconds):
    for _ in range(seconds):
        if not _running:
            return
        time.sleep(1)


def market_is_open(now=None):
    """Regular US session, Mon-Fri 9:30-16:00 ET.

    Deliberately does not know about market holidays or half-days yet. On a
    holiday the provider just returns the last close, so nothing moves.
    """
    now = now or datetime.now(EASTERN)
    if now.weekday() >= 5:
        return False
    return dtime(9, 30) <= now.time() <= dtime(16, 0)


def fetch_quote(symbol):
    """Return (price, previous_close) for one symbol, or None on failure.

    Swap this function to change data providers. It is the only place in the
    worker that knows what the vendor's response looks like.
    """
    try:
        r = requests.get(
            QUOTE_URL,
            params={"symbol": symbol, "token": API_KEY},
            timeout=10,
        )
        if r.status_code == 429:
            log(f"  {symbol}: rate limited")
            return None
        r.raise_for_status()
        data = r.json()
        price = data.get("c")
        # Finnhub returns 0 for unknown symbols rather than an error.
        if not price:
            log(f"  {symbol}: no price in response")
            return None
        return float(price), (float(data["pc"]) if data.get("pc") else None)
    except requests.RequestException as e:
        log(f"  {symbol}: request failed -- {e}")
        return None


def poll(conn, symbols):
    """Fetch quotes, stamping each with the database time just before its request.

    Using database time (rather than this container's clock) keeps the
    comparison with orders.placed_at, which the database also stamps, honest.
    """
    db_start = conn.execute("SELECT now()").fetchone()[0] if conn else None
    t0 = time.monotonic()
    quotes = {}
    for symbol in symbols:
        observed_at = db_start + timedelta(seconds=time.monotonic() - t0) if conn else None
        q = fetch_quote(symbol)
        if q is not None:
            quotes[symbol] = (q[0], q[1], observed_at)
    return quotes


def fetch_profile(symbol):
    """Return the company description for one symbol, or None on failure.

    Profiles barely change, so callers only fetch symbols whose description
    is still missing from the stocks table.
    """
    try:
        r = requests.get(
            PROFILE_URL,
            params={"symbol": symbol, "token": API_KEY},
            timeout=10,
        )
        if r.status_code == 429:
            log(f"  {symbol}: profile rate limited")
            return None
        r.raise_for_status()
        description = (r.json().get("description") or "").strip()
        if not description:
            log(f"  {symbol}: no description in response")
            return None
        return description
    except requests.RequestException as e:
        log(f"  {symbol}: profile request failed -- {e}")
        return None


def backfill_profiles(conn):
    """Fetch company descriptions for symbols missing one, then store them.

    Missing-only, so steady state costs zero extra vendor calls.
    """
    missing = game.symbols_missing_profiles(conn)
    if not missing:
        return
    profiles = {}
    for symbol in missing:
        description = fetch_profile(symbol)
        if description is not None:
            profiles[symbol] = description
    if profiles:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.executemany(
                    "UPDATE stocks SET description = %s WHERE symbol = %s",
                    [(d, s) for s, d in profiles.items()],
                )
        log(f"backfilled descriptions for {len(profiles)}/{len(missing)} stocks")


def write_prices(conn, quotes):
    with conn.transaction():
        with conn.cursor() as cur:
            cur.executemany(
                "INSERT INTO price_ticks (symbol, price, captured_at) VALUES (%s, %s, %s)",
                [(s, p, t) for s, (p, _pc, t) in quotes.items()],
            )
            cur.executemany(
                """
                INSERT INTO latest_price (symbol, price, prev_close, updated_at)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (symbol) DO UPDATE
                  SET price = EXCLUDED.price,
                      prev_close = EXCLUDED.prev_close,
                      updated_at = EXCLUDED.updated_at
                """,
                [(s, p, pc, t) for s, (p, pc, t) in quotes.items()],
            )


def summarize(quotes):
    return "  ".join(f"{s} {p:,.2f}" for s, (p, _pc, _t) in list(quotes.items())[:8])


def connect():
    conn = psycopg.connect(DATABASE_URL, autocommit=True)
    here = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(here, "schema.sql"), "r", encoding="utf-8") as f:
        conn.execute(f.read())
    log("connected, schema ready")
    return conn


def open_cycle(conn):
    symbols = game.active_symbols(conn)
    quotes = poll(conn, symbols)
    if quotes:
        write_prices(conn, quotes)
        log(f"wrote {len(quotes)}/{len(symbols)}  |  {summarize(quotes)}")
        game.fill_pending_orders(conn, quotes, log)
    else:
        log("no quotes this cycle")
    backfill_profiles(conn)
    game.settle_due_leagues(conn, log)


def closed_cycle(conn):
    """Market closed: settle anything due, and seed prices for new stocks.

    Seeded prices are for display only. They never fill orders -- an order
    placed while the market is closed fills at the next open, the same way a
    real brokerage handles it.
    """
    game.settle_due_leagues(conn, log)
    backfill_profiles(conn)
    missing = game.symbols_missing_prices(conn)
    if missing:
        quotes = poll(conn, missing)
        if quotes:
            write_prices(conn, quotes)
            log(f"seeded prices for {len(quotes)}/{len(missing)} new stocks")


def dry_run():
    log("DATABASE_URL not set -- dry run, nothing will be persisted")
    while _running:
        quotes = poll(None, DRY_RUN_SYMBOLS)
        log(f"DRY RUN {len(quotes)}/{len(DRY_RUN_SYMBOLS)}  |  {summarize(quotes)}")
        sleep_for(POLL_SECONDS)


def main():
    signal.signal(signal.SIGTERM, _stop)
    signal.signal(signal.SIGINT, _stop)

    if not API_KEY:
        log("FATAL: FINNHUB_API_KEY is not set")
        sys.exit(1)

    log(f"polling every {POLL_SECONDS}s, market hours only: {MARKET_HOURS_ONLY}")

    if not DATABASE_URL:
        dry_run()
        return

    conn = None
    was_open = None
    while _running:
        try:
            if conn is None:
                conn = connect()

            is_open = market_is_open() or not MARKET_HOURS_ONLY
            if is_open != was_open:
                log("market open" if is_open else "market closed")
                was_open = is_open

            if is_open:
                open_cycle(conn)
                sleep_for(POLL_SECONDS)
            else:
                closed_cycle(conn)
                sleep_for(CLOSED_SLEEP_SECONDS)

        except psycopg.OperationalError as e:
            log(f"database connection lost -- {e}; reconnecting in {RECONNECT_SECONDS}s")
            if conn is not None:
                try:
                    conn.close()
                except Exception:
                    pass
            conn = None
            sleep_for(RECONNECT_SECONDS)

    if conn is not None:
        conn.close()
    log("stopped")


if __name__ == "__main__":
    main()
