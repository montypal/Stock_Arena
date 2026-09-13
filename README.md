# StockArena

A stock-picking competition. Real market prices, fake money, no real trades.

## Shape of the system

```
Railway                          Vercel
┌──────────────────┐            ┌──────────────┐
│ worker/          │            │ web/         │
│ polls quotes ────┼──┐      ┌──┼─ reads cache │
└──────────────────┘  │      │  └──────────────┘
                      ▼      │
              ┌───────────────┐
              │ Postgres      │
              │ (Railway)     │
              └───────────────┘
```

**One rule: nothing but the worker talks to the data vendor.** The worker polls
the tracked symbols on a fixed interval and writes to Postgres. Every client
reads the cache. This is what keeps a small free-tier rate limit survivable, and
it means prices tick on a schedule we control.

## Layout

| Path | Runs on | What it is |
|---|---|---|
| `worker/` | Railway | Python price poller. Long-lived process. Config in `worker/railway.json`. |
| `web/` | Vercel | Next.js frontend. Currently a status page. |
| `docs/` | — | Project and gameplay plans. |

## Making changes

The code lives on this computer in `Documents\stockarena`. GitHub holds the
shared copy, and Railway and Vercel deploy from GitHub automatically.

1. Edit files here, locally.
2. Commit them.
3. Run `git push` from this folder in PowerShell.
4. Railway rebuilds `worker/` and Vercel rebuilds `web/` on their own.

Nothing is ever edited directly on GitHub, Railway, or Vercel. If code is ever
changed on GitHub, run `git pull` here before making new changes.

## Running the worker locally

No database needed — it runs in dry-run mode and prints quotes to the console.

```bash
cd worker
pip install -r requirements.txt
export FINNHUB_API_KEY=your_key
python poller.py
```

Set `MARKET_HOURS_ONLY=0` to poll outside the regular session.

## Environment

| Variable | Where | Notes |
|---|---|---|
| `FINNHUB_API_KEY` | worker | Data provider key. |
| `DATABASE_URL` | worker, web | Railway provides this. Unset = dry run. |
| `TICKERS` | worker | Comma-separated. Defaults to a test set. |
| `POLL_SECONDS` | worker | Default 60. |
| `MARKET_HOURS_ONLY` | worker | `1` to sleep when the market is closed. |

## Deploying

**Railway** — new project from this repo, root directory `worker`. Add a Postgres
database to the same project; Railway injects `DATABASE_URL` automatically. Set
`FINNHUB_API_KEY` in service variables.

**Vercel** — new project from this repo, root directory `web`. Add `DATABASE_URL`
as an environment variable, copied from Railway's Postgres connection string.

## Open before this grows

The gameplay plan is not final. Leagues, entries, and positions are deliberately
not modelled yet — only the price cache is. Two decisions gate the rest:

1. **Mobile-native or mobile web?** Determines whether `web/` is the real client
   or just a dashboard.
2. **Data provider and license.** Free tiers are typically personal,
   non-commercial use. Confirm redistribution is permitted before building on it.

The market-hours check in `poller.py` does not know about holidays or half-days.
It needs a real market calendar before it drives settlement.
