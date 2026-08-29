"""
StockArena price poller.

Runs as a long-lived Railway worker. Polls quotes for the tracked symbols on a
fixed interval and writes them to Postgres. Every client reads the database --
nothing in the app ever calls the data vendor directly.

Environment:
    DATABASE_URL     Postgres connection string. Omit to run in dry-run mode.
    FINNHUB_API_KEY  Data provider key.
    TICKERS          Comma-separated symbols. Defaults to a small test set.
    POLL_SECONDS     Seconds between refreshes. Default 60.
    MARKET_HOURS_ONLY  "1" to sleep outside US market hours. Default "1".
"""

import os
import sys
import time
import signal
from datetime import datetime, time as dtime
from zoneinfo import ZoneInfo

import requests

EASTERN = ZoneInfo("America/New_York")
QUOTE_URL = "https://finnhub.io/api/v1/quote"

TICKERS = [t.strip().upper() for t in os.getenv(
    "TICKERS", "AAPL,TSLA,NVDA,AMD,SOFI,PLTR,COIN,MARA"
).split(",") if t.strip()]

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


def market_is_open(now=None):
    """Regular US session, Mon-Fri 9:30-16:00 ET.

    Deliberately does not know about market holidays or half-days. Before this
    drives real settlement it needs a proper market calendar -- see the plan.
    """
    now = now or datetime.now(EASTERN)
    if now.weekday() >= 5:
        return False
    return dtime(9, 30) <= now.time() <= dtime(16, 0)


def fetch_quote(symbol):
    """Return the latest price for one symbol, or None on failure.

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
        return float(price)
    except requests.RequestException as e:
        log(f"  {symbol}: request failed -- {e}")
        return None


def get_connection():
    if not DATABASE_URL:
        return None
    import psycopg
    return psycopg.connect(DATABASE_URL, autocommit=True)


def ensure_schema(conn):
    here = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(here, "schema.sql"), "r", encoding="utf-8") as f:
        conn.execute(f.read())
    log("schema ready")


def write_ticks(conn, quotes):
    with conn.cursor() as cur:
        cur.executemany(
            """
            INSERT INTO price_ticks (symbol, price, captured_at)
            VALUES (%s, %s, now())
            """,
            [(sym, price) for sym, price in quotes],
        )
        cur.executemany(
            """
            INSERT INTO latest_price (symbol, price, updated_at)
            VALUES (%s, %s, now())
            ON CONFLICT (symbol) DO UPDATE
              SET price = EXCLUDED.price, updated_at = EXCLUDED.updated_at
            """,
            [(sym, price) for sym, price in quotes],
        )


def cycle(conn):
    quotes = []
    for symbol in TICKERS:
        price = fetch_quote(symbol)
        if price is not None:
            quotes.append((symbol, price))

    if not quotes:
        log("no quotes this cycle")
        return

    summary = "  ".join(f"{s} {p:,.2f}" for s, p in quotes)
    if conn:
        write_ticks(conn, quotes)
        log(f"wrote {len(quotes)}/{len(TICKERS)}  |  {summary}")
    else:
        log(f"DRY RUN {len(quotes)}/{len(TICKERS)}  |  {summary}")


def main():
    signal.signal(signal.SIGTERM, _stop)
    signal.signal(signal.SIGINT, _stop)

    if not API_KEY:
        log("FATAL: FINNHUB_API_KEY is not set")
        sys.exit(1)

    log(f"tracking {len(TICKERS)} symbols every {POLL_SECONDS}s")
    log(f"symbols: {', '.join(TICKERS)}")

    conn = get_connection()
    if conn:
        ensure_schema(conn)
    else:
        log("DATABASE_URL not set -- dry run, nothing will be persisted")

    while _running:
        if MARKET_HOURS_ONLY and not market_is_open():
            log("market closed, sleeping 5m")
            for _ in range(300):
                if not _running:
                    break
                time.sleep(1)
            continue

        cycle(conn)

        for _ in range(POLL_SECONDS):
            if not _running:
                break
            time.sleep(1)

    if conn:
        conn.close()
    log("stopped")


if __name__ == "__main__":
    main()
