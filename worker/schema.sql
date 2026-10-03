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

-- One league per tier per week. Weeks start Monday 07:00 America/New_York
-- and end Sunday 19:00; you can join and trade anytime that window is open.
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
-- The table itself was lost from this file during an earlier edit while the
-- live database kept it, so the statements below (and positions/orders) had
-- nothing to attach to on a fresh database. Recreated from the columns the
-- app and worker actually read and write. IF NOT EXISTS keeps the live table
-- untouched.
CREATE TABLE IF NOT EXISTS entries (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    league_id        BIGINT NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    room_id          BIGINT NOT NULL REFERENCES rooms(id)   ON DELETE CASCADE,
    week_start       DATE   NOT NULL,
    starting_balance NUMERIC(16,4) NOT NULL,
    cash             NUMERIC(16,4) NOT NULL,
    joined_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Written once, by the worker, when the league settles.
    final_value      NUMERIC(16,4),
    final_rank       INT,
    coins_awarded    BIGINT NOT NULL DEFAULT 0
);

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

-- Align any still-open leagues created under the old Monday 06:00 window
-- to the current Monday 07:00 start. Idempotent; settled leagues untouched.
UPDATE leagues
   SET starts_at = (week_start::timestamp + time '07:00') AT TIME ZONE 'America/New_York'
 WHERE status = 'open'
   AND starts_at = (week_start::timestamp + time '06:00') AT TIME ZONE 'America/New_York';

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

-- =============================================================== rewards
-- Two currencies, never mixed (see contextHistory.md "The Two Currencies"):
-- weekly achievements pay league cash into one entry; career achievements pay
-- coins to the profile. Both are written only by the worker, which is the
-- single author of everything that moves money.

-- One row per entry per ET day, upserted by the worker while a league is open.
-- The last write of a day is that day's closing state, which is what the
-- day-based achievements (Green Open, Comeback, Podium Streak, Closer,
-- Perfect Week) are judged on.
CREATE TABLE IF NOT EXISTS entry_snapshots (
    entry_id      BIGINT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    snapshot_date DATE   NOT NULL,              -- America/New_York calendar day
    value         NUMERIC(16,4) NOT NULL,       -- cash + market value of holdings
    cash          NUMERIC(16,4) NOT NULL,
    rank          INT    NOT NULL,              -- place in the room that day
    room_size     INT    NOT NULL,
    positions     INT    NOT NULL,
    -- Achievement cash paid into this entry by the time of the snapshot. It is
    -- already inside `value` (achievements pay into entries.cash), so the
    -- rules that ask "were you in profit" subtract it.
    awarded       NUMERIC(16,4) NOT NULL DEFAULT 0,
    taken_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (entry_id, snapshot_date)
);

ALTER TABLE entry_snapshots ADD COLUMN IF NOT EXISTS awarded NUMERIC(16,4) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS entry_snapshots_date ON entry_snapshots (snapshot_date);

-- Weekly achievements: paid in league cash, into the entry that earned them.
-- The row is the receipt; cash was added to entries.cash in the same
-- transaction, so a slug can only ever pay once per entry.
CREATE TABLE IF NOT EXISTS entry_achievements (
    entry_id   BIGINT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    slug       TEXT   NOT NULL,
    cash       NUMERIC(16,4) NOT NULL,
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (entry_id, slug)
);

CREATE INDEX IF NOT EXISTS entry_achievements_time ON entry_achievements (awarded_at DESC);

-- Career achievements: paid in coins, to the profile, once per player.
CREATE TABLE IF NOT EXISTS user_achievements (
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slug       TEXT   NOT NULL,
    coins      BIGINT NOT NULL,
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, slug)
);

-- =============================================================== buddies
-- The buddy catalogue lives in code (web/lib/rewards/buddies.js), so a new
-- character is one entry plus its .glb. The database only records what a
-- player owns and which one is out.

CREATE TABLE IF NOT EXISTS user_buddies (
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slug        TEXT   NOT NULL,
    coins_spent BIGINT NOT NULL DEFAULT 0,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, slug)
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS active_buddy TEXT;
