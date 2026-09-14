# StockArena — contextHistory.md

## How This File Works — Shared Project Memory

`contextHistory.md` is the shared memory for the project. It is used by both developers and AI coding agents, including OpenCode and Claude Code, so that everyone can understand the current state of the project and what has happened previously.

* It contains the current source of truth for the game's gameplay direction and a permanent history of changes made throughout development.
* ANY developer or AI working on this project MUST read `contextHistory.md` BEFORE making changes.
* It must be checked at the beginning of every task, not just once when the project is first opened.
* The information in this file should be used to understand previous decisions, current gameplay, existing functionality, and changes made by other collaborators.
* AFTER making a meaningful change to the project, the developer or AI MUST add an update to `contextHistory.md`.
* NEVER delete, remove, erase, or rewrite previous updates unless explicitly told to.
* Existing history must always be preserved.
* New updates are appended to the Updates section.
* The goal is for this file to eventually contain a very large chronological history of the project's development, so future developers and AI agents can understand how the project evolved.
* Every update must identify WHO made the change, WHEN the change was made, and WHAT was changed.
* Use the actual developer/AI identity. For my OpenCode changes, use `Jackson OpenCode`. For my friend's Claude Code changes, use his appropriate identity.
* Use the actual date and time whenever possible.
* Do not make up previous history. Only record changes that actually happened.
* If a task makes multiple related changes, they can be recorded together as one update.
* Do not consider a meaningful task complete until its corresponding update has been added to `contextHistory.md`.

> Project location: `C:\Users\jaxzc.JACKSON\OneDrive\Desktop\Coding\StockArena` (cloned from `https://github.com/montypal/Stock_Arena.git`, branch `main`).

# StockArena — Regular Gameplay Plan

StockArena is a weekly stock-picking competition where players compete against other players by investing fake money into real stocks.

Each league lasts one full week, from Monday through Sunday.

Players receive a set amount of virtual money when they join a league. They use that money to buy stocks and build their portfolio. As the real stock market moves throughout the week, the value of their portfolio changes.

Players also earn achievements during the week. Achievements pay out additional virtual money directly into their portfolio, giving players a second way to grow their balance beyond the market itself.

At the end of Sunday, the player whose portfolio has made the most money wins the league.

## Joining a League

**Random League** — join an automatically created league against randomly selected players.

**Private League** — create or join a league with friends. Private leagues can set their own name, players, starting balance, weekly schedule, and whether achievements are on.

## Weekly Game Loop

**Monday — League Begins.** Players receive their starting balance, which varies by league (Bronze $10,000 · Silver $25,000 · Gold $50,000 · higher leagues more). They buy stocks, which then move with the real market. The first achievements become available immediately.

**Tuesday–Thursday — Watch Your Portfolio.** Players monitor portfolio value, profit and loss, individual stock performance, league position, and distance from the players above and below. Achievements unlock through these days based on performance, paying cash into the available balance.

**Friday — Final Trade Opportunity.** One last chance to sell and rebuy. Achievement money earned during the week is available to spend. After this trade the portfolio is locked.

**Saturday–Sunday — Final Stretch.** No trading. Achievements can still be earned, since they depend on performance and position rather than trading.

**Sunday — League Ends.** Final portfolio value is calculated including all achievement money. Most profit wins.

## League Structure

Every league has a fixed starting balance, a Monday start, a Sunday end, a player group, a leaderboard, real prices, fake money, one Friday trade, a shared achievement set, and a winner.

## Leaderboard

Ranked by money made. Achievement money counts toward the total, so a player behind on the market can still climb by earning more achievements than the people around them.

Notifications fire when a player takes first, gets passed, enters the top three, comes close to overtaking someone, earns an achievement, is near completing one, or when the league is about to end.

## Portfolio

Shows total value, starting balance, total profit and loss, stocks owned, amount invested per stock, current value per position, per-stock profit and loss, available cash, and achievement money earned this week. Tapping a stock shows its performance during the competition.

## Trading

Deliberately limited. Free choice of stocks on Monday, then one final trade on Friday, then locked. The Friday trade is the week's major strategic moment: "stay with what got me here, or make one last move?"

## Achievements

Challenges completed during a league that pay virtual money. They give players something to chase when the market is quiet, and give players who are behind a way to catch up.

Every achievement is available to every player in the league. Nobody starts with an advantage — achievements are earned during the week, not unlocked beforehand.

### Weekly achievements — pay into the current league

| Achievement   | Condition                              | Award   |
| ------------- | -------------------------------------- | ------- |
| First Buy     | Build your portfolio on Monday         | +$250   |
| Diversified   | Hold five or more different stocks     | +$300   |
| Green Open    | Finish Monday in profit                | +$250   |
| Comeback      | Climb five or more places in a day     | +$500   |
| Big Mover     | Own the league's best stock on any day | +$500   |
| Photo Finish  | Sit within $100 of the player above    | +$400   |
| Podium Streak | Hold top three for three days running  | +$750   |
| Clean Sweep   | Every stock up at the same time        | +$1,000 |
| Conviction    | Make no changes at the Friday trade    | +$1,000 |
| Closer        | Finish higher than you were on Friday  | +$750   |

### Career achievements — pay coins to the profile

| Achievement    | Condition                        | Award |
| -------------- | -------------------------------- | ----- |
| First League   | Finish a full league             | 100   |
| First Win      | Win a league                     | 500   |
| Podium Player  | Finish top three five times      | 400   |
| Regular        | Play ten leagues                 | 300   |
| Friendly Rival | Win a private league             | 400   |
| Three-Peat     | Win three weeks in a row         | 1,000 |
| Six Figures    | Reach $100,000 career profit     | 750   |
| Perfect Week   | Hold first every day of a league | 1,500 |

### Coins

Separate from league money and never spendable inside a league. Used to unlock higher leagues, create additional private leagues, and customize a profile.

Weekly achievements help you win the week you are playing. Career achievements build the profile over time. Keeping them separate is what stops veterans from starting each week richer than new players.

## League Types

Standard, Private, Higher-Level (unlocked with coins, larger balances), and Special (limited-time, own stock pools or achievement sets).

## Progression

A long-term profile tracking leagues played, leagues won, podium finishes, total simulated profit, best weekly performance, win rate, career earnings, best-performing stocks, achievements unlocked, coins earned, and current rank.

## Core Gameplay Philosophy

* **Monday:** Build your portfolio.
* **Tuesday–Thursday:** Watch, strategize, chase achievements.
* **Friday:** Make your final trade.
* **Saturday–Sunday:** Hold and fight for the lead.
* **Sunday:** Most profit wins.

The excitement comes from watching the leaderboard change, earning achievements that push you up it, and deciding whether to hold your strategy or make a final move before the Friday lock.

# StockArena — App Overview

Game overall: what the app is, how it plays, and why its pieces fit together.

## What It Is

StockArena is a mobile app that turns real stock market movement into a competitive, game-like weekly tournament. Users don't invest real money and don't own real shares — instead, they play with fake money against real, live stock prices, competing against other players to see who can grow a simulated portfolio the most over the course of a week. It's part fantasy sports, part trading simulator, part light mobile game — with collectible rewards and a cute animated companion layered on top to make checking your stats fun instead of clinical.

## Core Concept: The Weekly League

Every week, a new competitive cycle begins. Users choose one of three league tiers to enter, based on how much starting fake capital they want to play with:

- **1K League** — start the week with $1,000 in play money
- **10K League** — start the week with $10,000 in play money
- **100K League** — start the week with $100,000 in play money

These tiers exist so players can pick a scale that feels meaningful to them — a $1,000 portfolio moves differently (in percentage terms, psychologically, and strategically) than a $100,000 one, so different tiers likely attract different playstyles (more aggressive/high-risk in lower tiers, perhaps more measured strategy in higher tiers).

Once a user enters a league for the week, their fake balance is locked in at that starting amount, and the trading period begins.

## Trading Mechanics

Within their chosen league, users can:

- Search for real, publicly traded stocks (e.g., AAPL, TSLA, NVDA, etc.)
- "Buy" shares using their fake league balance, at the stock's actual current market price
- "Sell" shares they hold, again at the real current market price
- Hold a portfolio of multiple stocks simultaneously, same as a real brokerage account would allow

No real money changes hands, no real shares are transferred — this is purely a simulation layered on top of real market data. But because the prices are real and moving in real time, the game requires genuine market awareness and reflects real-world volatility, news events, and trends. If NVDA jumps 5% in real life, your simulated NVDA holdings jump 5% too.

## Real-Time Portfolio Tracking

As the week progresses:

- Each user's total portfolio value updates continuously as the real prices of their held stocks move
- Users can see their gains/losses, both in dollar terms and percentage terms, updating live
- Users can view trends — how their portfolio has moved over the day/week, which holdings are up or down, etc.

This turns the week into an ongoing, live-feeling competition rather than a single static bet — value is visibly rising and falling throughout the week as real markets move.

## The Leaderboard

Within each league tier (1K / 10K / 100K), there is a live leaderboard showing all participants ranked by current total portfolio value. As prices move throughout the week:

- Users move up and down in real time relative to other players in their tier
- This creates the core competitive tension of the app — you're not just watching your own portfolio, you're watching your rank change against everyone else

## End of Week: Settlement & Winning

At the end of the week:

- The league "locks" — no more trading is allowed
- Final portfolio values are calculated based on final market prices
- Whoever has the highest total portfolio value (i.e., grew their starting fake money the most) is declared the winner of that league tier for the week
- Top finishers (winner, and likely some number of runners-up) earn rewards

After settlement, a new weekly cycle begins and users can enter again — potentially the same tier or a different one.

## Rewards: Coins & Chests

Winning or placing well in a weekly league earns the player coins — the app's separate reward currency (distinct from the fake trading balance, which resets each week). Coins persist across weeks and represent long-term progress/achievement, separate from any single week's trading performance.

Coins can be spent to open chests:

- Chests are opened via an engaging 3D spinning-open animation, similar in spirit to the chest-opening moment in Brawl Stars — the chest visibly spins/shakes before revealing its contents, making the reward moment feel exciting rather than just a text popup.
- Chest contents could include: more coins, cosmetic items, or new "buddies" (see below) — the exact reward table is a detail to define later, but the core idea is a satisfying, animated unlock moment tied to your competitive success.

## The Buddy — Your Companion & Stats Hub

This is the app's signature personality feature.

### What it is

A buddy is a small, cartoon-style 3D character that lives permanently in a corner widget/box on the app's main screen — always visible, similar in concept to how the Snoopy watch face sits in the corner of an Apple Watch face and performs cute idle animations continuously.

### What it does

- **Idle animations:** while just sitting in its box, the buddy performs a rotating set of small, cute animations — nothing the user needs to trigger, just ambient personality/charm while the app is open.
- **Reactive animations:** the buddy's behavior can reflect what's happening with the user's portfolio — e.g., a happy/celebratory animation when the user's portfolio is up, a worried/sad animation when it's down, perhaps something special when the user is winning their league.
- **Tap for stats:** tapping the buddy opens a stats/insights panel showing the user's own data at a glance:
  - Current portfolio value
  - Which individual stock holdings are up or down
  - Overall gain/loss for the week
  - Trend information over time

The buddy essentially turns a normal "view my stats" screen into something with personality and charm — instead of a plain dashboard, checking your performance means interacting with a character you've grown attached to.

### Future scope

Buddies may eventually be collectible — different buddy designs unlockable via chests — turning the companion feature into an additional long-term progression/collection layer on top of the weekly trading competition itself.

## Why These Pieces Fit Together

| Layer | Purpose |
|---|---|
| Weekly leagues (1K/10K/100K) | The core competitive game loop — real strategy, real stakes (in-game), resets regularly so it stays fresh |
| Real stock data | Makes the competition genuinely skill/knowledge-based, not arbitrary — ties the game to something meaningful and dynamic (the real market) |
| Live leaderboard | Creates ongoing competitive tension throughout the week, not just a single end-of-week reveal |
| Coins & chests | A reward loop that gives winning weeks lasting value beyond just bragging rights |
| Buddy companion | Adds personality, charm, and a friendlier "front door" into your own stats — differentiates the app emotionally, not just mechanically |

## Summary in One Paragraph

StockArena is a weekly fantasy-trading competition: you pick a league tier (1K, 10K, or 100K in starting fake money), build a simulated stock portfolio using real, live market prices, and compete on a live leaderboard against other players in your tier to see who grows their portfolio the most by week's end. Winning earns coins, which unlock animated 3D chests with rewards, and a cute animated companion — your "buddy" — lives in the corner of the app, reacting to your performance and giving you a charming way to check your stats at any time.

## Tech Stack

What we are building with (declared stack — see notes where the code hasn't caught up yet):

- **Web app:** Next.js 15 (App Router) + React 19, hosted on **Vercel** (`web/`, Root Directory `web`). NOTE: current code is JavaScript (`.js`); the TypeScript migration hasn't happened yet. `web/types/` is reserved for shared types/interfaces when it does.
- **3D:** Three.js / React Three Fiber for the buddy companion and chest-opening animations. Home: `web/components/three/` (buddy, chest), models in `web/public/models/` (`.glb`). NOTE: R3F is not installed yet and no 3D code exists — installing `three` + `@react-three/fiber` (+ `@react-three/drei` if needed) is a follow-up.
- **Worker:** Python 3.12 price poller + game engine (`worker/`), hosted on **Railway** with restart ON_FAILURE. Fills orders (forward pricing), settles leagues, seeds prices.
- **Database:** **Postgres** on Railway. Worker uses the private `DATABASE_URL`; Vercel uses `DATABASE_PUBLIC_URL` (TCP proxy).
- **Market data:** **Finnhub** (`/quote`), 30-stock universe in the `stocks` table — inside the 60 calls/min free limit. `TICKERS` env var retired.
- **Mobile plan:** wrap the web app with **Capacitor** for iOS/Android App Store submission once the core app is feature-complete. No React Native, no Swift.

Current `web/` layout (feature-based; route groups in parentheses don't change URLs):

- `app/` — `page.js`, `layout.js`, `globals.css`, `manifest.js` stay at top level; `(auth)/login`, `(auth)/signup`; `(battles)/league`, `(battles)/trade`, `(battles)/trade/[symbol]`; `(profile)/profile`; `(admin)/status`; `api/` reserved for backend routes; empty groups `(daily)`, `(social)`, `(community)`, `(mentor)`, `(leaderboard)`, `(progression)`, `(settings)` hold `.gitkeep` placeholders for upcoming features.
- `components/` — `layout/` (NavBar, PageHead/Flash, AutoRefresh); `battle/`, `social/`, `profile/` reserved; `three/` reserved for buddy/chest R3F components.
- `lib/` — `db/` (Postgres pool in `index.js`, auth/sessions in `auth.js`); `trading/` (league/portfolio/order logic in `game.js`); `utils/` (formatting in `format.js`); `xp/` reserved for XP/rank calculations; `actions.js` (server actions: signup, login, logout, join, trade, cancel).
- `types/` — reserved for shared TypeScript types (JS codebase for now).
- `public/models/` — reserved for `.glb` 3D model assets.
- `worker/` and top-level `assets/` are intentionally untouched by the restructure.

## Updates

The Updates section grows throughout the entire project. Every update is separated from the next by this exact separator:

---

Jackson OpenCode 4:15 PM 9/13/26

Created project `AGENTS.md` with the remote-check-before-edit rule (check the GitHub remote for new commits, pull when safe, stop and ask if local changes could conflict, never overwrite/discard/reset/force-push anyone else's work) and the `contextHistory.md` maintenance protocol (read before changing, update after, newest entry on top, same-commit history updates, real author attribution). Committed together with the history update in `1a55c72`. Follow-up: the Claude Code collaborator should read the new `AGENTS.md` so both sides follow the same workflow.

---

Jackson OpenCode 4:24 PM 9/13/26

Restructured `contextHistory.md` into the shared-memory format: a "How This File Works" explanation at the top, the weekly Regular Gameplay Plan as the current source of truth, and an `## Updates` section. Migrated the one genuinely existing historical update (project `AGENTS.md` creation, commit `1a55c72`) into the new update format with its original timestamp — no history was invented. Moved the entire pre-existing combined project context (gameplay visions, daily-contest V2 plan, architecture, worker/web deep dives, database, env vars, deploy notes, quick reference) into the preserved `## Reference` section below without deleting any information. Verified before editing: `git pull origin main` returned already up to date with a clean tree.

---

Aarav — Claude Code 4:48 PM 9/13/26

Catch-up entry for the infrastructure work done before this log existed, plus today's deployment. Code changes were made by Claude Code; the Railway and Vercel dashboard setup was done by Aarav following Claude Code's instructions.

- Commits: `10c3d46` scaffolded `worker/` (Python Finnhub poller → Postgres `price_ticks` + `latest_price`), `web/` (Next.js status page reading `latest_price`), and `docs/`. `7989b72` fixed the first Railway build (`pip: command not found`) by moving `railway.json` into `worker/`, dropping the forced `pip install` build command so Railway detects Python itself, and pinning Python 3.12 via `worker/.python-version`. `39dc7ba` added a "Making changes" section to `README.md` (edit locally → commit → `git push` → Railway/Vercel auto-deploy). `a6d8b78` merged Jackson's `AGENTS.md` / `contextHistory.md` commits; no conflicts.
- Railway (project "cozy-illumination"): worker service from this repo with Root Directory `worker`, plus a Postgres service. Worker variables: `FINNHUB_API_KEY`, `TICKERS` (AAPL,TSLA,NVDA,AMD,SOFI,PLTR,COIN,MARA), `POLL_SECONDS=60`, `MARKET_HOURS_ONLY=1`, and `DATABASE_URL=${{Postgres.DATABASE_URL}}` (private network, no egress fees). Postgres has a TCP proxy on 5432 and a `DATABASE_PUBLIC_URL` variable, used only by Vercel.
- Vercel (Aarav's account): Root Directory `web`, env `DATABASE_URL` = Railway's `DATABASE_PUBLIC_URL`. Live at https://web-orpin-nine-95.vercel.app, verified returning HTTP 200 with "8 symbols cached". Worker logs confirmed `wrote 8/8` each minute.
- Decision: Aarav approved following `AGENTS.md`; Claude Code will pull before editing and log changes here from now on.
- Follow-up: (1) Gameplay source of truth is out of sync. Aarav's latest draft — 1K/10K/100K leagues, rank-matched public leagues (private leagues unmatched), league money kept separate from coins, coins paid by finishing position — is not yet in the repo; both `docs/gameplay-plan.md` and the plan at the top of this file predate it. Aarav and Jackson should agree on one version before building features. (2) `poller.py` does not reconnect if Postgres restarts; it relies on Railway's ON_FAILURE restart. (3) Market-hours check has no holiday/half-day calendar yet. (4) `AGENTS.md` says newest entry on top, but this file appends oldest-first; this entry follows the file's existing order.

---

Jackson OpenCode 4:48 PM 9/13/26

Added the StockArena logo to the project (`assets/stockarena.png`, copied from `stockarena.png` in Downloads, ~1.1 MB) and rewrote `README.md` as a description of the app: centered logo header, what StockArena is, how a league week works, leagues and achievements, the worker → Postgres → web system diagram, layout, run/deploy notes. Preserved the collaborator's `Making changes` section verbatim, including their local-path wording. Pulled `origin/main` before editing, which fast-forwarded the friend's merge commit (`a6d8b78`, README `Making changes` section) with no conflicts. Logo is committed with the project so it renders on GitHub.

---

Aarav — Claude Code 4:54 PM 9/13/26

Repo cleanup before starting on the app, at Aarav's request ("delete all the files that are unnecessary; keep Jackson's work and the .md files"). Pulled `origin/main` first, which fast-forwarded Jackson's logo + README commits (`f0f66d8`, `9cfc809`) with no conflicts.

- Deleted `docs/StockArena-Plan-v2.pdf` (~800 KB). It described the superseded daily-contest design; its content is preserved in the Reference section below and the file remains in git history (`git show 5c3d914:docs/StockArena-Plan-v2.pdf`).
- Updated the header of `docs/gameplay-plan.md`, which pointed at the deleted PDF, to point at `contextHistory.md` instead. Plan content unchanged.
- Kept everything else deliberately: `worker/` and `web/` are the code running live on Railway and Vercel; `worker/Procfile`, `railway.json`, and `.python-version` are needed by the Railway build; all `.md` files and `assets/stockarena.png` kept as requested. Mentions of the PDF in earlier entries and the Reference section are history and were left as-is.
- Follow-up: the gameplay source of truth is still split (see the 4:48 PM entry). `web/` is still the infrastructure status page and will be replaced as the app is built.

---

Aarav — Claude Code 4:56 PM 9/13/26

Removed the `docs/` folder at Aarav's request: `contextHistory.md` is now the single home for the gameplay plan and project context. Pulled `origin/main` first (already up to date).

- Deleted `docs/gameplay-plan.md`, the last file in `docs/`. Its weekly plan is the same one already at the top of this file, and it remains in git history.
- Removed the `docs/` row from the layout table in `README.md`.
- Changed the footer of `web/app/page.js` from "finalize the gameplay plan in `docs/`" to "in `contextHistory.md`". Text-only change; Vercel will redeploy on push.
- Follow-up: the plan at the top of this file is still the Bronze/Silver/Gold version. Aarav's newer draft (1K/10K/100K leagues, rank-matched public leagues, coins separate from league money) should replace it here once Aarav and Jackson agree.

---

Aarav — Claude Code 5:12 PM 9/13/26

Started building the app (stage 1 of 2: the game engine in `worker/`). Aarav gave the build prompt: StockArena Project Plan Draft v1 plus Claude's feedback. Pulled `origin/main` first (up to date).

**v1 build spec, as decided for this build** (Draft v1 core + the feedback's technical fixes):
- Weekly leagues at three tiers: 1K / 10K / 100K starting play money. One league per player per week.
- Players are placed in rooms of up to 30 inside a league; leaderboards are per room. Rank-based matchmaking is deferred (no rank exists yet).
- Weeks run Monday 00:00 → next Monday 00:00 America/New_York. Trading is open until Friday's 4:00 PM close; after that, "join" means next week's league, and pre-open orders fill at Monday's open.
- Buy by dollar amount (fractional shares), sell by dollar amount or "sell all". Long-only.
- No stock may exceed 20% of portfolio value at the time of buying.
- **Forward pricing:** orders are stored as pending and fill only at the first price the worker observes *after* the order was placed. Prices seeded while the market is closed are display-only and never fill orders.
- Tradable universe is a fixed list of 30 stocks in the `stocks` table (30 calls/min, inside Finnhub's 60/min free limit). The `TICKERS` env var is no longer used.
- Settlement at Monday 00:00 ET: pending orders cancelled, rooms ranked by final value (ties → earlier join), coins paid: 1st 500, 2nd 350, 3rd 250, top half 100, everyone else 50, × tier multiplier (1K ×1, 10K ×2, 100K ×4). Players with no filled order get 0. Coins are never cashable, tradable, or purchasable.
- Chests, buddy, rank matchmaking, achievements, notifications come after the core loop works.

**Changes:**
- `worker/schema.sql`: added `stocks` (30 seeded), `users`, `sessions`, `leagues`, `rooms`, `entries`, `positions`, `orders`; added `latest_price.prev_close`. All idempotent; applied by the worker on start.
- `worker/game.py` (new): `fill_pending_orders` (per-order transaction, row locks, Decimal math, dust handling), `settle_due_leagues` (idempotent via `FOR UPDATE` on the league row + status check), `coin_payout`, `rank_room`.
- `worker/poller.py`: polls active symbols from the DB, stores previous close, stamps each quote with database time taken just before its request (so the forward-pricing comparison with `orders.placed_at` uses one clock), fills orders and settles leagues each open cycle, settles + seeds missing prices while closed, and reconnects after a lost DB connection instead of crashing.
- `worker/test_game.py` (new): unit tests for payouts and ranking; 6/6 pass locally. SQL paths were not run locally (no local Postgres); they get exercised on Railway.
- `worker/.env.example`: dropped `TICKERS`.
- Follow-up: stage 2 is the web app (accounts, league picker, trading screens, portfolio, leaderboard). The Railway `TICKERS` variable can be deleted.

---

Aarav — Claude Code 5:18 PM 9/13/26

Stage 2 of the v1 build: the playable web app in `web/`. Pulled `origin/main` first (up to date). Verified stage 1 in production before pushing: the worker applied the new schema and seeded prices for all 30 stocks while the market was closed (live status page showed "30 symbols cached").

- **Accounts** (`web/lib/auth.js`): username + password, scrypt hashes via `node:crypto`, 30-day httpOnly session cookie; only a sha256 of the session token is stored in `sessions`. No third-party auth service.
- **Data layer** (`web/lib/db.js`, `web/lib/game.js`): shared `pg` pool; NUMERIC/BIGINT parsed to numbers, DATE kept as `YYYY-MM-DD` strings. `game.js` has league joining (creates the week's league row on demand, first room with space, else a new room of 30), portfolio + leaderboard queries, the stock list, trade limits, order placement, and cancel. Order placement re-checks everything server-side: trading window, stock has a price, available cash (cash minus pending buys), and the 20% cap (position value + pending buys of that stock). Fills themselves stay in the worker.
- **Server actions** (`web/app/actions.js`): signup, login, logout, join, trade, cancel. Each redirects back with an `?ok=` / `?error=` message.
- **Screens**: `/` landing, `/signup`, `/login`, `/league` (tier picker; portfolio value, P/L, place, cash; holdings; pending orders with cancel; room leaderboard; auto-refresh every 30s), `/trade` (searchable list of the 30 stocks with day change), `/trade/[symbol]` (price, position, buy by dollars, sell by dollars or sell all, pending orders), `/profile` (coins, record, past leagues, log out). The old infrastructure page moved to `/status`. Bottom tab bar, light/dark themes, installable via `app/manifest.js`.
- Not built locally (no Node on this machine); Vercel's build is the first compile. `README.md` layout row for `web/` updated.
- Follow-up: chests (deterministic reveals, no loot boxes), achievements, rank matchmaking, notifications, holiday calendar, login rate-limiting.

---

Jackson OpenCode 8:28 PM 9/13/26

Removed the `## Reference — Preserved Combined Project Context` section from `contextHistory.md` at Jackson's explicit request, and inserted the StockArena App Overview ("game overall": 1K/10K/100K tiers, trading mechanics, live tracking, leaderboard, settlement, coins/chests, buddy companion) between the Regular Gameplay Plan and `## Updates`. File order is now: how-to-use explanation, gameplay plan, app overview, updates at the end. All 8 existing Updates entries preserved untouched; the removed Reference content remains recoverable in git history. Note: the friend's 4:54 PM entry and older entries mention the Reference section and the deleted `docs/` files — those mentions are history and were left as-is.

---

Jackson OpenCode 8:55 PM 9/13/26

Restructured `web/` into the feature-based layout (route groups, `components/`, `lib/db|xp|trading|utils`, `types/`, `public/models/`) with zero logic changes — moves via `git mv` so file history is preserved; `worker/` and top-level `assets/` untouched. Did it in 3 incremental moves, each verified: (1) `lib/` split (`db.js`→`lib/db/index.js`, `auth.js`→`lib/db/auth.js`, `game.js`→`lib/trading/game.js`, `format.js`→`lib/utils/format.js`, `app/actions.js`→`lib/actions.js`, `lib/xp/` placeholder); (2) shared UI into `components/layout/` (`nav.js`, `ui.js`, `refresh.js`) with `battle/`, `social/`, `profile/`, `three/` placeholders; (3) pages into route groups (`(auth)`, `(battles)`, `(profile)`, `(admin)`) plus `api/` and future-feature placeholders — parenthesized groups, so all 9 URLs are byte-identical. Ran `npm install` + `npx next build` after every move (all green; route table identical each time) and smoke-tested the production server (`/`, `/login`, `/status`, `/league` all HTTP 200). Also added a `## Tech Stack` section documenting Next.js App Router + React, planned TypeScript migration (`types/` reserved; code is JS today), Three.js/R3F for buddy/chest (`three/` + `public/models/` reserved, not installed yet), Vercel + Railway + Postgres + Finnhub, and the Capacitor wrap plan for App Store submission (no React Native, no Swift). Follow-ups: install R3F packages, TS migration, XP/rank logic in `lib/xp/`, backend routes in `app/api/`; `web/package-lock.json` (from the local install) left untracked.

---
