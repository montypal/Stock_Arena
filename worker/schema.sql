-- StockArena schema.
--
-- Applied by the worker every time it starts. Every statement is idempotent,
-- so re-running it against an existing database is safe.

-- ============================================================ market data

CREATE TABLE IF NOT EXISTS price_ticks (
    id          BIGSERIAL PRIMARY KEY,
    symbol      TEXT        NOT NULL,
    price       NUMERIC(14,4) NOT NULL,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS price_ticks_symbol_time
    ON price_ticks (symbol, captured_at DESC);

-- Current price per symbol. This is what the app reads.
CREATE TABLE IF NOT EXISTS latest_price (
    symbol     TEXT PRIMARY KEY,
    price      NUMERIC(14,4) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE latest_price ADD COLUMN IF NOT EXISTS prev_close NUMERIC(14,4);

-- The tradable universe. The worker polls every active symbol each cycle, so
-- this list has to stay inside the data provider's rate limit: Finnhub's free
-- tier allows 60 calls a minute, and the worker polls once a minute.
CREATE TABLE IF NOT EXISTS stocks (
    symbol TEXT PRIMARY KEY,
    name   TEXT    NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    industry TEXT
);

ALTER TABLE stocks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS industry TEXT;

INSERT INTO stocks (symbol, name) VALUES
    ('AAPL',  'Apple'),
    ('MSFT',  'Microsoft'),
    ('NVDA',  'NVIDIA'),
    ('AMZN',  'Amazon'),
    ('GOOGL', 'Alphabet'),
    ('META',  'Meta Platforms'),
    ('TSLA',  'Tesla'),
    ('AMD',   'Advanced Micro Devices'),
    ('NFLX',  'Netflix'),
    ('AVGO',  'Broadcom'),
    ('ORCL',  'Oracle'),
    ('CRM',   'Salesforce'),
    ('ADBE',  'Adobe'),
    ('INTC',  'Intel'),
    ('JPM',   'JPMorgan Chase'),
    ('V',     'Visa'),
    ('DIS',   'Disney'),
    ('NKE',   'Nike'),
    ('KO',    'Coca-Cola'),
    ('PEP',   'PepsiCo'),
    ('WMT',   'Walmart'),
    ('COST',  'Costco'),
    ('UBER',  'Uber'),
    ('SHOP',  'Shopify'),
    ('PLTR',  'Palantir'),
    ('SOFI',  'SoFi Technologies'),
    ('COIN',  'Coinbase'),
    ('HOOD',  'Robinhood'),
    ('MARA',  'MARA Holdings'),
    ('RBLX',  'Roblox')
ON CONFLICT (symbol) DO NOTHING;

-- =============================================================== accounts

CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    username      TEXT   NOT NULL UNIQUE,  -- lowercased, used to log in
    display_name  TEXT   NOT NULL,         -- as typed at sign-up
    password_hash TEXT   NOT NULL,
    -- Reward currency. Earned from league finishes only; never bought,
    -- never cashed out, never converted to league money.
    coins         BIGINT NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TEMPORARY device identity while the login page is removed (9/17/26):
-- sha256 of a random id each browser keeps in localStorage. Nullable, so
-- existing password accounts are untouched.
ALTER TABLE users ADD COLUMN IF NOT EXISTS device_hash TEXT UNIQUE;

CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,  -- sha256 of the cookie value
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_user ON sessions (user_id);

-- ================================================================ leagues

-- One league per tier per week. Weeks start Monday 00:00 America/New_York.
-- Trading closes at Friday's market close; the league ends (and settles) at
-- the following Monday 00:00.
CREATE TABLE IF NOT EXISTS leagues (
    id                BIGSERIAL PRIMARY KEY,
    tier              INT  NOT NULL CHECK (tier IN (1000, 10000, 100000)),
    week_start        DATE NOT NULL,
    starts_at         TIMESTAMPTZ NOT NULL,
    trading_closes_at TIMESTAMPTZ NOT NULL,
    ends_at           TIMESTAMPTZ NOT NULL,
    status            TEXT NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open', 'settled')),
    settled_at        TIMESTAMPTZ,
    UNIQUE (tier, week_start)
);

-- Players compete inside a room, not across the whole league.
CREATE TABLE IF NOT EXISTS rooms (
    id         BIGSERIAL PRIMARY KEY,
    league_id  BIGINT NOT NULL REFERENCES leagues(id),
    capacity   INT    NOT NULL DEFAULT 30,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rooms_league ON rooms (league_id);

-- A player's seat in one league for one week.
-- UNIQUE changed from (user_id, week_start) to (user_id, league_id)
-- so a player may join each tier at most once per week (up to 3 entries/week),
-- but may join different tiers in the same week.
-- The old UNIQUE (user_id, week_start) prevented joining different tiers
-- in the same week; the new UNIQUE (user_id, league_id) allows multiple
-- entries (different leagues) per week while preventing re-joining the
-- same tier/league twice.
DO $$
BEGIN
    -- Drop old unique constraint (user_id, week_start) if it exists.
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints
               WHERE table_name = 'entries'
               AND constraint_type = 'UNIQUE'
               AND UPPER(constraint_name) LIKE '%USER_ID%WEEK_START%') THEN
        ALTER TABLE entries DROP CONSTRAINT entries_user_id_week_start_key;
    END IF;

    -- Add new unique constraint (user_id, league_id) if it does not exist.
    -- This prevents re-joining the same tier league in the same week
    -- while allowing entries in different tiers within the same week.
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE table_name = 'entries'
                   AND constraint_type = 'UNIQUE'
                   AND UPPER(constraint_name) LIKE '%USER_ID%LEAGUE_ID%') THEN
        ALTER TABLE entries ADD CONSTRAINT entries_user_id_league_id_key UNIQUE (user_id, league_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS entries_room   ON entries (room_id);
CREATE INDEX IF NOT EXISTS entries_league ON entries (league_id);

CREATE TABLE IF NOT EXISTS positions (
    entry_id   BIGINT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    symbol     TEXT   NOT NULL,
    shares     NUMERIC(20,8) NOT NULL,
    cost_basis NUMERIC(16,4) NOT NULL,  -- total dollars paid for the shares held
    PRIMARY KEY (entry_id, symbol)
);

-- Orders never fill at the price a player saw. They wait for the next price
-- the worker publishes after the order was placed ("forward pricing"), so a
-- quote that is newer elsewhere can't be used to trade against a stale one.
CREATE TABLE IF NOT EXISTS orders (
    id            BIGSERIAL PRIMARY KEY,
    entry_id      BIGINT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    symbol        TEXT   NOT NULL,
    side          TEXT   NOT NULL CHECK (side IN ('buy', 'sell')),
    amount        NUMERIC(16,4),               -- dollars, for buys and dollar sells
    sell_all      BOOLEAN NOT NULL DEFAULT false,
    status        TEXT   NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'filled', 'rejected', 'cancelled')),
    placed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    filled_at     TIMESTAMPTZ,
    fill_price    NUMERIC(14,4),
    fill_shares   NUMERIC(20,8),
    fill_amount   NUMERIC(16,4),
    reject_reason TEXT
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shares NUMERIC;

CREATE INDEX IF NOT EXISTS orders_pending
    ON orders (placed_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS orders_entry
    ON orders (entry_id, placed_at DESC);
