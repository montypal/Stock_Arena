-- StockArena price cache.
--
-- Only the market-data layer is modelled here. League, room, entry, and
-- position tables come once the gameplay plan is final -- see docs/.

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
