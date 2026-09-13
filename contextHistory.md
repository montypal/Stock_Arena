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

## Reference — Preserved Combined Project Context

> The content below is the pre-restructure combined context, compiled 2026-09-13 from `README.md`, `docs/gameplay-plan.md`, `docs/StockArena-Plan-v2.pdf` (Draft V2, supersedes Draft V1), `worker/` (`poller.py`, `schema.sql`, `requirements.txt`, `railway.json`, `Procfile`, `.env.example`, `.python-version`), `web/` (`app/page.js`, `app/layout.js`, `app/globals.css`, `package.json`, `next.config.js`), `.gitignore`, and git history. Preserved verbatim during the 9/13/26 restructure — nothing deleted. Where it overlaps the gameplay source of truth above, the source of truth wins.

## 1. What StockArena Is

**One-liner (README):** A stock-picking competition. Real market prices, fake money, no real trades.

**Expanded:**
StockArena is a competitive investing game. Players join leagues/rooms/contests, get virtual money, build a fake portfolio from real stocks, and win by growing it the most as real market prices move. Achievements, trophies, ranks, and social feeds keep it engaging when the market itself is slow.

There are currently **two gameplay visions in the repo that disagree**:

- `docs/gameplay-plan.md` = **Weekly league vision.** Says: "Current source of truth for gameplay. The infrastructure plan lives in `StockArena-Plan-v2.pdf`; where the two disagree, this file wins on gameplay and the PDF wins on architecture."
- `docs/StockArena-Plan-v2.pdf` = **Daily contest vision (Draft V2).** Says it "replaces the weekly league of Draft v1 — because the thing most likely to kill this app was never the market data, the 3D chests, or the choice of builder platform. It was a five-day feedback loop on an asset class that moves one percent a day."

Both are documented below. Weekly is marked current-gameplay-truth; Daily V2 is the newer reframe.

---

## 2A. Gameplay Vision 1 — Weekly Leagues (`docs/gameplay-plan.md`)

### Core concept
Weekly stock-picking competition. Each league lasts one full week, Monday through Sunday. Players receive virtual money on join, buy stocks, portfolio moves with real market. Achievements pay extra virtual money into portfolio (second way to grow beyond market). Sunday: most profit wins.

### Joining a league
- **Random League** — auto-created league vs randomly selected players.
- **Private League** — create/join with friends. Can set own name, players, starting balance, weekly schedule, achievements on/off.

### Weekly game loop
- **Monday — League Begins.** Starting balance varies by league (Bronze $10,000 · Silver $25,000 · Gold $50,000 · higher more). Buy stocks. First achievements available immediately.
- **Tuesday–Thursday — Watch Your Portfolio.** Monitor portfolio value, P&L, per-stock performance, league position, distance from players above/below. Achievements unlock, paying cash into available balance.
- **Friday — Final Trade Opportunity.** One last chance to sell and rebuy. Achievement money earned is spendable. After this trade portfolio is locked.
- **Saturday–Sunday — Final Stretch.** No trading. Achievements still earnable (based on performance/position, not trading).
- **Sunday — League Ends.** Final value incl. all achievement money. Most profit wins.

### League structure
Every league has: fixed starting balance, Monday start, Sunday end, player group, leaderboard, real prices, fake money, one Friday trade, shared achievement set, winner.

### Leaderboard
Ranked by money made. Achievement money counts, so behind-on-market players can climb via achievements. Notifications fire when: player takes first, gets passed, enters top three, comes close to overtaking someone, earns achievement, near completing one, league about to end.

### Portfolio
Shows: total value, starting balance, total P&L, stocks owned, amount invested per stock, current value per position, per-stock P&L, available cash, achievement money earned this week. Tapping a stock shows its performance during competition.

### Trading
Deliberately limited. Free choice Monday, one final trade Friday, then locked. Friday trade is the strategic moment: "stay with what got me here, or make one last move?"

### Achievements
Challenges during a league that pay virtual money. Give players something to chase when market is quiet + comeback path.

Every achievement available to every player in league. Nobody starts with advantage.

**Weekly achievements — pay into current league:**
| Achievement | Condition | Award |
|---|---|---|
| First Buy | Build portfolio on Monday | +$250 |
| Diversified | Hold 5+ different stocks | +$300 |
| Green Open | Finish Monday in profit | +$250 |
| Comeback | Climb 5+ places in a day | +$500 |
| Big Mover | Own league's best stock on any day | +$500 |
| Photo Finish | Within $100 of player above | +$400 |
| Podium Streak | Hold top three 3 days running | +$750 |
| Clean Sweep | Every stock up at same time | +$1,000 |
| Conviction | No changes at Friday trade | +$1,000 |
| Closer | Finish higher than Friday position | +$750 |

**Career achievements — pay coins to profile:**
| Achievement | Condition | Award |
|---|---|---|
| First League | Finish full league | 100 |
| First Win | Win league | 500 |
| Podium Player | Finish top three 5x | 400 |
| Regular | Play 10 leagues | 300 |
| Friendly Rival | Win private league | 400 |
| Three-Peat | Win 3 weeks in a row | 1,000 |
| Six Figures | Reach $100k career profit | 750 |
| Perfect Week | Hold first every day | 1,500 |

**Coins:** Separate from league money, never spendable inside league. Used to unlock higher leagues, create additional private leagues, customize profile. Weekly achievements = win the week. Career achievements = build profile. Separation stops veterans starting richer than new players.

### League types
Standard, Private, Higher-Level (unlocked with coins, larger balances), Special (limited-time, own pools/achievement sets).

### Progression
Long-term profile: leagues played/won, podiums, total simulated profit, best weekly performance, win rate, career earnings, best stocks, achievements unlocked, coins earned, current rank.

### Philosophy
- Monday: Build.
- Tue–Thu: Watch, strategize, chase achievements.
- Friday: Final trade.
- Sat–Sun: Hold and fight for lead.
- Sunday: Most profit wins.
Excitement = leaderboard changes + achievement climbs + hold-vs-move decision before Friday lock.

---

## 2B. Gameplay Vision 2 — Daily Contest (Draft V2 PDF)

### Why daily, not weekly (Change 01-04)
1. **Daily contests, not weekly.** Week is too slow — by Tuesday most know they can't win and stop opening. Daily is simpler (no mid-week joins, no multi-day state, no partial settlement) and you learn if fun in a day.
2. **Engagement mechanics are the product.** Drafts, duels, feeds, progression treated as polish in V1 — actually reason anyone opens twice. All in V1.
3. **Real reward system.** "Coins and chests" placeholder replaced by Brawl Stars-style trophy ladder + Trophy Road + per-ticker ranks + two currencies. Losing must cost something for winning to mean anything.
4. **Tool comparison removed.** Was 70% of V1, covered most reversible decision. Replaced by single architectural requirement: need scheduled job + real database.

**Three problems V1 missed:**
- Delayed prices + instant fills = free-money exploit. Solved by forward pricing (§6).
- Data licensing = redistribution question, not rate-limit. Free tiers typically personal/non-commercial. (§9).
- Chests = loot box. Requires published odds (App Store) + regulated in jurisdictions. Replaced by deterministic reveals (§5).

### The reframe: rank is drama, not price
Stocks are slow (big day = 2%). Don't compete on price movement. Compete on rank. Rank is zero-sum, discrete, churns constantly — in room of 30, 0.3% move reshuffles 5 positions. Never show "+0.41%". Show "↑3 spots — two behind Marcus." Score in points (1% = 100 points). Market closed 17h/day becomes ritual (pool drops 8PM, draft overnight, overnight gap = biggest move).

### Core loop (single trading day)
- **8:00 PM prev day — Pool drops.** Tomorrow's 20 curated tickers published. Push notification.
- **8 PM–9:30 AM — Draft.** Snake-draft book vs room. Exclusive ownership.
- **9:30 AM — Bell.** Positions lock. Live feed opens. Rank moves.
- **All session — Five trades.** Hard budget of five. Every one a real decision.
- **4:00 PM — Buzzer.** Settlement at close. Final rank, trophies, graded recap.
Evening pool + overnight draft moves highest-tension decision outside market hours where you control clock. Five-trade scarcity turns tap into decision + caps write/API load.

### What ships in V1 (12 features)
- **Format:** Daily contest. One per trading day, opens 8PM night before, settles at close.
- **Universe:** Curated 20-ticker pool. Hand-picked high-beta/news-driven, rotated daily. Solves movement + no paralysis in 5000-symbol search. Gives meta.
- **Entry:** Snake draft, exclusive ownership. If you take NVDA, nobody else in room can. Tension before open, on schedule you control.
- **Economy:** Five trades/day. Hard budget, no roll-over.
- **Scoring:** Points, never percentages. 1% = 100 pts.
- **Balance:** 20% position cap. Without cap optimal play = dump all into most volatile name. Caps force real portfolio (min 4 positions).
- **Structure:** Rooms of 30. Small rooms = everyone near top of something.
- **Structure:** 1v1 duels. Challenge friend, 24h, higher score wins. Solves cold-start (needs 2 not 30).
- **Progression:** Trophies & Trophy Road (see §5).
- **Identity:** Track Record. Permanent career equity curve. Every contest adds point to lifetime chart that never resets.
- **Signal:** Ownership %. "Only 6% of room holds this." Bet against people, contrarian identity.
- **Risk:** CallYourShot. Before bell, spend Gold to publicly declare one pick. If day's top performer, big multiplier + permanent mark. If not, everyone watched you miss.
- **Events:** Live room feed. Sports-broadcast framing: "10:42 — Sarah dumped SOFI, up 4 spots."
- **Events:** Notifications with stakes. "You passed 4 players." "One spot from payout." "Earnings in 20 min." Highest-leverage retention, missing in V1.
- **Payoff:** Graded recap. 15-sec animated replay + grade: "B+. You sold NVDA 40 min early — cost you 3 spots." Shareable.
- **Payoff:** 3D reward reveal. Spinning chest animation from V1, attached to Trophy Road milestones not random boxes. Same moment, no compliance cost.

### Rewards (Brawl Stars model)
Every ticker = brawler. Finish green holding NVDA → NVDA gains trophies. Total = sum of all tickers ever played. Rotating pool becomes "which of my brawlers playable today." No authored content needed — market supplies roster.

**Trophies go down as well as up.** 28th must cost something or 1st means nothing. Drop small enough setback not wipeout. Plus Brawl Stars soft cap past ~1000 trophies: gains shrink, losses grow per bracket.

| Finish (room 30) | Trophies |
|---|---|
| 1st | +12 |
| 2nd–3rd | +9 |
| 4th–6th | +7 |
| 7th–10th | +5 |
| 11th–15th | +2 |
| 16th–20th | 0 |
| 21st–25th | -3 |
| 26th–30th | -5 |

**Trophy Road — one linear track, visible day one (features not just decoration):**
| Trophies | League | Unlocks |
|---|---|---|
| 25 | — | Shop opens · name colors |
| 50 | Bronze | 1v1 duels |
| 150 | — | Signature ticker badge |
| 250 | Silver | Private rooms |
| 600 | Gold | Bracket tournaments |
| 800 | — | Trophy case (3 display slots) |
| 1000 | Diamond | Draft entrance animations |
| 1500 | — | Custom pool contests (pick own 20) |
| 2000 | Mythic | Second Call Your Shot slot |
| 3000 | — | Earnings-night contests |
| 5000 | Legendary | Animated card frame |
| 10000 | Masters | Global leaderboard |

**Ticker ranks:** Each ticker ranks on own trophies like brawler. Rank 5/10/20 = bronze/silver/gold badge. Gold ticker wearable as signature next to name (e.g. Marcus · NVDA). Players build stable/identity (e.g. semis player).

**Two currencies, no third:**
- **Gold (Common):** From Trophy Road milestones + daily quests. Buys shop cosmetics + Call Your Shot. Flows steadily so losing week still produces win.
- **StarPoints (Rare):** Only at monthly season reset, scaled by how far above reset threshold climbed. Buys prestige items nothing else can.
- **Not in V1:** No purchasable currency. Nothing bought with money, nothing converts to money. Keeps app a game not contest with prizes of value.
- **Rule:** Never gate information or edge. No better stats, faster prices, extra trades, larger cap. Otherwise pay-to-win, new players quit.

**Shop:** Only sell things other players in room can see. Name colors, badges, card frames, draft animations, Track Record skins, earned titles (Diamond Hands, The Fade). Rotates daily, 3 items, same appointment mechanic as chest, same 3D reveal, no randomness.

**Season reset:** Monthly. Everyone above threshold pushed back toward it, difference → Star Points. Peak league kept permanently on card. Stops top calcifying, fresh start monthly.

### Simulation spec (must settle before code)
| Rule | V1 Decision | Why |
|---|---|---|
| Fill price | Forward pricing. Order at T fills at next published price after T. | Last-price fill = free-money exploit with live quote elsewhere. Forward closes it. |
| Price source | Delayed data, cached server-side, fixed interval. | With forward pricing delay doesn't matter for fairness; delayed far simpler to license than real-time. |
| Position cap | 20% per holding, min 4 positions. | Kills max-variance degenerate. |
| Trade budget | 5/session, no roll-over. | Scarcity + caps load. |
| Shorting | Not in V1. Long-only. | Doubles edge cases (borrow, unlimited loss, forced close) for no proven gain. |
| Fractional | Yes. Allocate by % of book, not share count. | Removes rounding bugs, $500 stock as playable as $5. |
| Halts/missing | Freeze at last good price; reject trades with visible reason. | Silent failures read as cheating. |
| Settlement | Official close 4PM ET. Half-days via market calendar. Idempotent, keyed by contest ID. | Double-pay cron = most damaging bug. |
| Ties | Fewest trades used, then earliest draft entry. | Rewards conviction, deterministic. |
| Late joins | Locked out once bell rings. Next opens 8PM. | Cleaner than partial entry, makes pool drop matter. |

### Deliberately NOT in V1
- Randomized chests — CUT PERMANENTLY. Loot box = Apple odds + jurisdictional regulation. Deterministic Trophy Road reveals replace it.
- Buddy (3D character) — V2 strongest candidate. Graded recap delivers insight payload cheaper; validate anyone reads it first.
- 1K/10K/100K tiers — reconsider, don't rebuild. With % scoring mechanically identical, splits small pool, empty leaderboards.
- Weekly leagues — V1.1 as season layer daily contests roll up into, not primary format.
- Brackets & earnings nights — V1.1 on Trophy Road. Build "contest" as row with start/end/pool, these cost almost nothing.
- Crypto — V1.1 with legal review. 24/7, more volatile, fills weekends/overnight. Own regulatory questions.
- Clans — V1.1. Strongest retention (teammates notice absence) but needs population.
- Ticker card collection — V2. Card per green stock, sector sets. Overlaps ticker ranks; hold until know if want second collection.

### Hard constraints (non-negotiable, mostly legal)
- Trophies/Gold/StarPoints never cashable, tradable, purchasable. Ranked contest with real-value prizes = sweepstakes/skill-contest law. Cosmetic-only keeps it a game.
- Confirm data license covers redistribution. Free tiers typically personal/non-commercial. Real-time generally requires exchange agreements; delayed far less encumbered. Verify before integration.
- Unofficial Yahoo endpoint is not foundation. Against terms, rebuild later. OK as one-off local cross-check only.
- No loot boxes, any version. Deterministic reveals remove compliance surface.
- Nothing is investment advice. Graded recap describes simulation, never suggests what to buy, never refers to outside positions.

### Build order (test riskiest assumption — is one-day fun? — early)
1. **Foundation:** Accounts. Schema for contests, rooms, entries, positions, price ticks. Scheduled price-cache job vs curated pool, market calendar day one. SHIPS: nothing visible, everything depends.
2. **Engine:** Contest lifecycle: open, draft, lock, live, settle. Forward fills, caps, budget, points, idempotent settlement. Test vs replayed historical day before UI. SHIPS: contest runs correctly, no UI.
3. **Playable:** Draft screen, portfolio, trade flow, live leaderboard. Rank-first throughout. SHIPS: first internal playtest. STOP, decide honestly if fun.
4. **Stakes:** Trophies/Road, ticker ranks, duels, feed, ownership %, Call Your Shot, push. Converts simulation to something opened twice. SHIPS: first stranger-worthy build.
5. **Payoff:** Track Record, animated recap/graded post-mortem, shop + 3D reveal, sharing. Basic anti-cheat (multi-account detection — duplicate accounts attack trophy economy). SHIPS: V1.

### Open decisions (PDF Q1-Q6, deliberately unsettled)
- Q1 Mobile-native or mobile web? V1 said "mobile app" but evaluated tools (Bolt, Lovable, Replit, v0, R3F) build web. Determines if App Store rules apply. Needed before phase 3.
- Q2 Who curates daily pool, how? Hand-picked for launch, doesn't scale. Rule becomes top movers / implied vol / earnings calendar? Decide before daily chore.
- Q3 Draft or free-pick default? Draft stronger but needs populated room. Free-pick fallback while thin?
- Q4 Season reset threshold? Too low = punishing pushdown monthly; too high = no StarPoints flow. Start near 1000 (soft cap) tune with real distribution.
- Q5 Trophy Road milestone Gold amount? Whole shop economy hangs off it, can't set until phase 4 playable.
- Q6 Monetization, if any. Determines compliance work. Cosmetics-only low-risk, preserves constraints.

Plus README adds:
- 1. Mobile-native or mobile web? Determines whether `web/` is real client or just dashboard.
- 2. Data provider and license. Confirm redistribution permitted before building on it.
- Market-hours check doesn't know holidays/half-days. Needs real calendar before drives settlement.

---

## 3. How It Works (Architecture)

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

**One rule: nothing but the worker talks to the data vendor.** Worker polls tracked symbols on fixed interval, writes to Postgres. Every client reads cache. Keeps small free-tier rate limit survivable, prices tick on schedule we control. Also what makes forward pricing implementable.

- Poll union of symbols in today's pool (20, not 5000). Draft V1 calling 60/min "generous" was wrong — 150 held symbols would consume quota on single refresh. Curated pool is architectural decision as much as design.
- Published price ticks on your schedule.
- Tooling implication: need scheduled background job + real database. Filter platforms through that — most free builder tiers lack cron, disqualifies regardless of credits.

---

## 4. Repo Layout

| Path | Runs on | What it is |
|---|---|---|
| `worker/` | Railway | Python price poller. Long-lived process. Config in `worker/railway.json`. |
| `web/` | Vercel | Next.js frontend. Currently status page. |
| `docs/` | — | Project + gameplay plans (`gameplay-plan.md`, `StockArena-Plan-v2.pdf`). |
| `contextHistory.md` | — | This file. |
| `.gitignore` | — | Secrets, python, node, platform, OS (see §9). |

Root files: `README.md` (76 lines), `.gitignore`.

---

## 5. Worker Deep Dive (`worker/`)

Python 3.12 (`.python-version` = `3.12`). Deps (`requirements.txt`): `requests>=2.32`, `psycopg[binary]>=3.2`.

- `poller.py` (183 lines): long-lived Railway worker. Polls quotes, writes to Postgres. Every client reads DB — nothing ever calls vendor directly.
  - Env: `DATABASE_URL` (omit = dry-run), `FINNHUB_API_KEY`, `TICKERS` (default `AAPL,TSLA,NVDA,AMD,SOFI,PLTR,COIN,MARA`), `POLL_SECONDS` (default 60), `MARKET_HOURS_ONLY` (default 1).
  - `market_is_open()`: Mon-Fri 9:30-16:00 ET. Deliberately no holidays/half-days. Needs real calendar before drives settlement.
  - `fetch_quote(symbol)`: GET `https://finnhub.io/api/v1/quote?symbol=X&token=KEY`, timeout 10s. 429 → log rate-limited, None. `raise_for_status`, `price = data.get("c")`. Finnhub returns 0 for unknown symbols → log no price, None. Only place that knows vendor response shape — swap function to change providers.
  - `get_connection()`: None if no DATABASE_URL else `psycopg.connect(DATABASE_URL, autocommit=True)`.
  - `ensure_schema(conn)`: executes `schema.sql`, logs "schema ready".
  - `write_ticks(conn, quotes)`: `INSERT INTO price_ticks (symbol, price, captured_at) VALUES … now()` + upsert `INSERT INTO latest_price … ON CONFLICT (symbol) DO UPDATE SET price, updated_at`.
  - `cycle(conn)`: fetch all TICKERS, if none log "no quotes", else `wrote N/M | SYM price…` or `DRY RUN N/M | …`.
  - `main()`: handles SIGTERM/SIGINT, FATAL if no API_KEY exit 1, log tracking N symbols every S s + symbols list, connect or dry-run log, loop: if MARKET_HOURS_ONLY and closed → log "market closed, sleeping 5m" sleep 300x1s check running; else cycle then sleep POLL_SECONDS x1s; close, "stopped".
- `schema.sql` (21 lines): price cache only. League/room/entry/position tables come once gameplay final.
  ```sql
  price_ticks(id BIGSERIAL PK, symbol TEXT NOT NULL, price NUMERIC(14,4) NOT NULL, captured_at TIMESTAMPTZ DEFAULT now());
  INDEX price_ticks_symbol_time ON price_ticks(symbol, captured_at DESC);
  latest_price(symbol TEXT PK, price NUMERIC(14,4) NOT NULL, updated_at TIMESTAMPTZ DEFAULT now());
  ```
  Comment: "Current price per symbol. This is what the app reads."
- `railway.json`: `{"$schema":"https://railway.com/railway.schema.json","deploy":{"startCommand":"python poller.py","restartPolicyType":"ON_FAILURE","restartPolicyMaxRetries":10}}`
- `Procfile`: `worker: python poller.py`
- `.env.example`:
  ```
  FINNHUB_API_KEY=your_key_here
  TICKERS=AAPL,TSLA,NVDA,AMD,SOFI,PLTR,COIN,MARA
  POLL_SECONDS=60
  MARKET_HOURS_ONLY=1
  # DATABASE_URL unset locally = dry-run
  ```

Running locally (no DB needed — dry-run prints to console):
```bash
cd worker
pip install -r requirements.txt
export FINNHUB_API_KEY=your_key  # or set in PowerShell
python poller.py
```
Set `MARKET_HOURS_ONLY=0` to poll outside regular session.

---

## 6. Web Deep Dive (`web/`)

Next.js frontend, currently status page proving full chain worker → Postgres → web. Renders fine with no DB attached.

- `package.json` (`stockarena-web` 0.1.0 private): scripts `dev: next dev`, `build: next build`, `start: next start`. Deps: `next ^15.0.0`, `pg ^8.13.0`, `react ^19.0.0`, `react-dom ^19.0.0`.
- `next.config.js`: `module.exports = {}`.
- `app/layout.js`: imports `globals.css`, metadata title StockArena, description "Weekly stock-picking competition with fake money and real prices.", `RootLayout({children})` → `<html lang="en"><body>{children}</body></html>`.
- `app/page.js` (99 lines, `export const dynamic='force-dynamic'`):
  - `getPrices()`: if no DATABASE_URL return `{state:'no-db'}`; else `import('pg') Client({connectionString, ssl:{rejectUnauthorized:false}})`, connect, `SELECT symbol, price, updated_at FROM latest_price ORDER BY symbol`, end, `{state:'ok', rows}`; catch → `{state:'error', message}`.
  - `Status({state,count,message})`: label no-db="No database attached yet", error="Database unreachable", ok=`${count} symbols cached` or "Connected, no prices written yet"; tone ok/bad/wait; renders dot + label.
  - `Page()`: header eyebrow "StockArena · Infrastructure", H1 "Price cache", lede "The worker on Railway polls quotes and writes them here. This page reads the database directly — it never calls the data vendor." + Status + table Symbol/Price/Updated (price 2 decimals, time ET America/New_York) + footer "Next step: finalize gameplay plan in docs/, then model leagues, entries, and positions."
- `app/globals.css` (120 lines): light/dark CSS vars (`--ground #f3f5f8 / #0c1118`, `--surface`, `--ink`, `--accent #1b45e0`, `--ok #0e7c5a`, `--bad #be3a28`, `--wait`), `main max-width 640px margin auto padding 64px 24px 80px`, eyebrow mono uppercase accent, status card, table with mono numbers, footer faint. Supports `prefers-color-scheme: dark`.

---

## 7. Database

Provider: Postgres on Railway. Railway injects `DATABASE_URL` automatically. Vercel gets copy as env var.

Current tables: only price cache (see §5 schema). Future (per build order phase 1): accounts, contests, rooms, entries, positions + price ticks + market calendar day one. Gameplay plan leagues/entries/positions deliberately not modelled yet — only price cache is. Two decisions gate rest: mobile-native vs web, data provider/license.

---

## 8. Environment Variables

| Variable | Where | Notes |
|---|---|---|
| `FINNHUB_API_KEY` | worker | Data provider key. Required, else FATAL exit 1. |
| `DATABASE_URL` | worker, web | Railway provides. Unset = dry-run (worker prints, web shows no-db). Web uses `ssl:{rejectUnauthorized:false}`. |
| `TICKERS` | worker | Comma-separated. Defaults to test set `AAPL,TSLA,NVDA,AMD,SOFI,PLTR,COIN,MARA`. V2 wants curated 20/day. |
| `POLL_SECONDS` | worker | Default 60. |
| `MARKET_HOURS_ONLY` | worker | `1` sleep when closed (5m loop). `0` poll always. |

---

## 9. Deploying + Ignore

**Railway** — new project from repo, root `worker`. Add Postgres to same project; Railway injects `DATABASE_URL`. Set `FINNHUB_API_KEY` in service variables. Start `python poller.py`, restart ON_FAILURE x10.

**Vercel** — new project from repo, root `web`. Add `DATABASE_URL` env var copied from Railway Postgres string.

`.gitignore`: secrets (`.env`, `.env.local`, `*.pem`), python (`__pycache__/`, `*.py[cod]`, `.venv/`, `venv/`), node (`node_modules/`, `.next/`, `out/`), platform (`.vercel`, `.railway`), OS (`Thumbs.db`, `.DS_Store`).

---

## 10. Current State

- Scaffold: price worker + web dashboard + plans. Git log (main): `7989b72 Fix Railway build: let it detect Python in worker/` + `10c3d46 Scaffold StockArena: price worker, web dashboard, plans`. Working tree clean, up to date with `origin/main`.
- Playable game NOT built: no auth, contests, rooms, draft, trading, leaderboard, trophies, feed, shop, recap, notifications, settlement job.
- Next step per web footer: finalize gameplay in `docs/`, then model leagues, entries, positions. Per PDF build order: foundation → engine (replay test) → playable (stop, is it fun?) → stakes → payoff.
- Shared repo: collaborator + another dev using Claude Code. Workflow: pull latest before new task when safe; ask before commit/push unless told.

---

## 11. Quick Reference

- Concept: weekly (gameplay-plan) vs daily (V2 reframe rank-first, points, 20-pool, snake draft, 5 trades, 20% cap, rooms 30, duels, trophies/road/ticker ranks, feed, CallYourShot, recap).
- Architecture: worker polls Finnhub → Postgres (`price_ticks`, `latest_price`) → Next.js reads cache. Never client→vendor. Forward pricing to kill exploit. Delayed cached data OK.
- Worker: `cd worker; pip install -r requirements.txt; FINNHUB_API_KEY=… python poller.py`.
- Web: root `web`, `next dev/build/start`, needs `DATABASE_URL`.
- Blockers: mobile-native vs web, pool curation rule, draft vs free-pick fallback, reset threshold (~1000 start), Gold-per-milestone tuning, monetization (cosmetics-only low-risk), data redistribution license, market calendar (holidays/half-days), idempotent settlement, anti-cheat multi-account.
- Never: cashable/tradable/purchasable rewards, loot boxes, Yahoo unofficial endpoint in app, investment advice, gating edge/information, shorting in V1.
