# StockArena — contextHistory.md

## How This File Works — Shared Project Memory

`contextHistory.md` is the shared memory and project source of truth for StockArena. It is used by all developers and AI coding agents, including OpenCode and Claude Code.

### Mandatory Agent Rules

**1. Read this file before every task.**

Any developer or AI agent MUST read `contextHistory.md` before making changes. Do not rely on memory from a previous task or conversation.

**2. Check the repository before editing.**

At the beginning of every task:

* Check `git status`.
* Check the current branch.
* Check the GitHub remote and whether new commits exist.
* Pull/fetch the latest changes when it is safe to do so.
* Inspect relevant existing code before changing it.

The project is shared between collaborators. Never assume the local repository is the latest version.

**3. Protect collaborator work.**

Known collaborators include:

* `Jackson OpenCode`
* `Aarav — Claude Code`

Never overwrite, discard, reset, or silently replace another collaborator's work.

Never use:

* `git reset --hard`
* `git clean -fd`
* force-push
* destructive history rewriting

unless explicitly instructed to do so.

If local changes and remote changes could conflict, STOP and ask before proceeding.

**4. Do not invent project requirements.**

The current sections of this file describe the intended project. Do not invent gameplay mechanics, currencies, rewards, screens, architecture, or technical behavior that are not supported by the current project requirements.

If something important is ambiguous or contradictory, STOP and ask rather than guessing.

Historical information in `## Updates` describes what happened in the past. It must not override the current requirements above it.

**5. Preserve working functionality.**

Before making a large change:

* Inspect the existing implementation.
* Understand its dependencies.
* Preserve existing behavior unless the task specifically requires changing it.
* Avoid unrelated refactors.
* Do not rewrite working systems just because another implementation would be preferred.

**6. Use real functionality.**

Do not fake core functionality with placeholder behavior when the requested feature is supposed to work for real.

External APIs, databases, market data, authentication, trading logic, and other important systems must be implemented and verified rather than simulated unless the task explicitly calls for a temporary mock.

**7. Verify changes.**

Testing is part of completing a task.

After making meaningful changes:

* Run relevant tests.
* Run the relevant build.
* Run lint/type checks when applicable.
* Smoke-test important affected routes or functionality.
* Investigate and fix failures rather than ignoring them.
* Do not claim something works if it was not actually verified.

If something cannot be tested, state that clearly.

**8. Be careful with dependencies.**

Before adding a dependency, check whether the project already has something suitable.

Do not add unnecessary packages.

When adding a dependency, make sure it is compatible with the existing stack and update the appropriate lockfile.

**9. Protect secrets and production data.**

Never commit API keys, passwords, tokens, private credentials, or other secrets.

Use environment variables for secrets.

Be especially careful when changing:

* Postgres schemas
* production data
* Railway configuration
* Vercel configuration
* authentication
* market-data systems

Do not perform destructive database operations without explicit permission.

**10. Respect the declared architecture.**

The current declared stack and architecture are documented below.

Do not introduce a different framework, hosting platform, mobile framework, or major architecture without a deliberate project decision.

**11. Keep the code understandable.**

Prefer simple, maintainable solutions.

Do not overengineer features before they are needed.

Use the existing project structure and conventions where practical.

**12. Update project memory.**

After every meaningful change, add an update to the `## Updates` section.

Every update must contain:

* who made the change
* the actual date/time when possible
* what was changed
* relevant commit information when applicable
* important follow-up items when applicable

Do not invent history.

**13. History is append-only.**

The existing `## Updates` section is permanent historical record.

NEVER:

* delete an old update
* rewrite an old update
* summarize an old update
* correct an old update
* reorder old updates
* remove information from an old update

New updates are appended to the end of the existing Updates section.

The historical entries may contain decisions or information that were later changed. That is intentional. Do not modify historical entries to make them match the current design.

**14. Attribute changes accurately.**

Use the actual developer/AI identity.

For Jackson's OpenCode work, use:

`Jackson OpenCode`

For Aarav's Claude Code work, use:

`Aarav — Claude Code`

Do not claim another collaborator made a change.

Do not invent timestamps.

**15. Keep history and current requirements separate.**

The sections before `## Updates` describe the current project.

`## Updates` describes what happened historically.

If an old update says something different from the current plan, the current plan takes precedence.

**16. Do not consider a meaningful task complete until the history is updated.**

The code change and its corresponding `contextHistory.md` update should normally be part of the same commit when practical.

**17. Real players only — no bots or fake people.**

Everyone a player competes against must be a real person with a real account who joined through the app. On every change to the game, check that this is still true.

Never:

* create bot, fake, test, seed, sample, or demo player accounts in the production database
* add simulated or computer-controlled players to leagues, rooms, duels, or leaderboards
* fill empty rooms or leaderboards with made-up players to make them look busy
* show invented people or names anywhere a player can see them — including example leaderboards, mock screens, placeholder copy, previews, and screenshots shared with collaborators

If a room is empty or small, show it as empty or small. Test accounts, if ever needed, must never be placed in a real league and must be removed afterwards.

If any existing bot, fake, or sample player is found, remove it (database changes still follow rule 9) and record it in `## Updates`.

### Completion Checklist

Before considering a meaningful task complete, verify:

* [ ] `contextHistory.md` was read.
* [ ] `git status` was checked.
* [ ] The remote/latest commits were checked.
* [ ] Collaborator changes were preserved.
* [ ] Relevant existing code was inspected.
* [ ] The requested feature was implemented.
* [ ] Relevant tests/builds/checks were run.
* [ ] Failures were investigated.
* [ ] Actual behavior was verified.
* [ ] No secrets were committed.
* [ ] No destructive Git operation was performed.
* [ ] `contextHistory.md` was updated.
* [ ] The update accurately describes what actually happened.
* [ ] Every player in leagues, rooms, and leaderboards is a real user — no bots, fake, sample, or demo people were added anywhere (rule 17).

### Stop and Ask When

An agent should stop and ask for clarification when:

* requirements are materially ambiguous
* two current requirements conflict
* collaborator changes may conflict
* a destructive Git operation would be required
* a destructive database operation would be required
* credentials are missing for an essential production integration
* a major architecture change appears necessary
* the agent cannot determine which implementation is authoritative
* the requested behavior would contradict the current project plan
* a change would add, simulate, or display players who are not real users

> Project location: `C:\Users\jaxzc.JACKSON\OneDrive\Desktop\Coding\StockArena` (cloned from `https://github.com/montypal/Stock_Arena.git`, branch `main`).

---

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

**Monday 6:00 AM ET — Leagues Open.** Three leagues open every week — **1K ($1,000)**, **10K ($10,000)**, **100K ($100,000)** — and a player may join one, two, or all three; each is a separate competition with its own portfolio. In the 1K league you are given $1,000 (same logic for 10K/100K with more money). When you click **Join** you enter that league's interface where you can see how much money you have, how much you've spent, and what stocks you've bought. You buy stocks at the real stock market price and during the week the stocks' value increases and decreases with the real market — a simulation but with real data. You can join and add stocks **anytime** while the league is open; joining later just means less time for your stocks to grow. The first achievements become available immediately.

**Monday–Sunday — Watch Your Portfolio.** Players monitor portfolio value, profit and loss, individual stock performance, league position, and distance from the players above and below. Achievements unlock through these days based on performance, paying cash into the available balance. Buy and sell remains open all week.

**Sunday 7:00 PM ET — Leagues Close & Settle.** No new joins or trades after close. Final portfolio value is calculated including all achievement money. Most profit wins in each league you joined; your finishing place in each league pays **coins** (game currency) — and **currency and the money used to buy stocks are NOT the same**: coins are for the game, money is only for that league's stock buying and resets each week.

## League Structure

Every league has a fixed starting balance (Monday 6:00 AM start, Sunday 7:00 PM end), a player group, a leaderboard, real prices, fake money, shared achievements, and a winner. You can join and trade anytime that window is open — later just means less time to grow.

## Leaderboard

Ranked by money made. Achievement money counts toward the total, so a player behind on the market can still climb by earning more achievements than the people around them.

Notifications fire when a player takes first, gets passed, enters the top three, comes close to overtaking someone, earns an achievement, is near completing one, or when the league is about to end.

## Portfolio

Shows total value, starting balance, total profit and loss, stocks owned, amount invested per stock, current value per position, per-stock profit and loss, available cash, and achievement money earned this week. Tapping a stock shows its performance during the competition.

## Trading

You can buy and sell whenever the league is open (Monday 6:00 AM ET until Sunday 7:00 PM ET) — no Friday lock, no blackout. Buy as much as you want as long as you have the money — no per-stock cap and no share-count cap beyond affordability. Enter any stock while open, trade by share count (whole shares) with a -/+ stepper; pending orders fill at the next observed real price after you place them. You can join and add stocks anytime during the open window — joining later just means less time for your stocks to grow. There is exactly one 1K, one 10K, and one 100K league per week; a player may join each at most once (up to 3 entries/week, never twice the same tier).

## Achievements

Challenges completed during a league that pay virtual money. They give players something to chase when the market is quiet, and give players who are behind a way to catch up.

Every achievement is available to every player in the league. Nobody starts with an advantage — achievements are earned during the week, not unlocked beforehand.

### Weekly achievements — pay into the current league

| **AchievementConditionAward** |                                        |         |
| ----------------------------- | -------------------------------------- | ------- |
| First Buy                     | Build your portfolio on Monday         | +$250   |
| Diversified                   | Hold five or more different stocks     | +$300   |
| Green Open                    | Finish Monday in profit                | +$250   |
| Comeback                      | Climb five or more places in a day     | +$500   |
| Big Mover                     | Own the league's best stock on any day | +$500   |
| Photo Finish                  | Sit within $100 of the player above    | +$400   |
| Podium Streak                 | Hold top three for three days running  | +$750   |
| Clean Sweep                   | Every stock up at the same time        | +$1,000 |
| Conviction                    | Make no changes at the Friday trade    | +$1,000 |
| Closer                        | Finish higher than you were on Friday  | +$750   |

### Career achievements — pay coins to the profile

| **AchievementConditionAward** |                                  |       |
| ----------------------------- | -------------------------------- | ----- |
| First League                  | Finish a full league             | 100   |
| First Win                     | Win a league                     | 500   |
| Podium Player                 | Finish top three five times      | 400   |
| Regular                       | Play ten leagues                 | 300   |
| Friendly Rival                | Win a private league             | 400   |
| Three-Peat                    | Win three weeks in a row         | 1,000 |
| Six Figures                   | Reach $100,000 career profit     | 750   |
| Perfect Week                  | Hold first every day of a league | 1,500 |

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

---

# StockArena — App Overview

## What It Is

StockArena is a mobile app that turns real stock market movement into a competitive, game-like weekly tournament. Users don't invest real money and don't own real shares — instead, they play with fake money against **real, live stock prices**, competing against other players to see who can grow a simulated portfolio the most over the course of a week. It's part fantasy sports, part trading simulator, part light mobile game — with collectible rewards and a cute animated companion layered on top to make checking your stats fun instead of clinical.

## Core Concept: The Weekly League

Every week, a new competitive cycle begins. Users choose one of three **league tiers** to enter, based on how much starting fake capital they want to play with:

* **1K League** — start the week with $1,000 in play money
* **10K League** — start the week with $10,000 in play money
* **100K League** — start the week with $100,000 in play money

These tiers exist so players can pick a scale that feels meaningful to them — a $1,000 portfolio moves differently (in percentage terms, psychologically, and strategically) than a $100,000 one, so different tiers likely attract different playstyles (more aggressive/high-risk in lower tiers, perhaps more measured strategy in higher tiers). A player may join one, two, or all three tiers in the same week; each league is a separate competition with its own portfolio and leaderboard.

When you click **Join** on any tier you enter that league's interface where you can see how much money you have, how much you've spent, and what stocks you've bought. You buy stocks at the real market price and during the week the value rises and falls with the real price — a simulation, but with real data. The same applies to 10K ($10,000) and 100K ($100,000); only the starting money changes.

Once a user enters a league for the week, their fake balance is locked in at that starting amount, and the trading period begins.

### The Two Currencies

StockArena has two completely separate types of currency/value:

**League Cash**

* Fake money provided when a player joins a league.
* Used exclusively for buying stocks during that league.
* The amount depends on the league tier.
* It is part of the player's temporary league portfolio.
* Rewards, achievements, placements, and coins do **not** give players additional league cash unless a future gameplay rule explicitly says otherwise.
* League cash does not function as the app's general-purpose currency.
* League cash is tied to the current league and resets when the weekly competition ends.

**Coins**

* The persistent in-game currency.
* Earned through league rewards, placements, achievements, and other progression systems.
* Coins carry across weeks and are part of the player's profile.
* Coins are not used to buy stocks.
* Coins are separate from the fake money used inside a league.
* Coins can be used for progression systems such as chests, cosmetics, buddies, and other future profile/unlock systems.

**Important rule: Never mix league cash and coins. CURRENCY AND THE MONEY TO BUY STOCKS ARE NOT THE SAME — coins are for the game while money is for the leagues.**

A reward that gives the player coins must never be implemented as giving them additional league cash. Different places in each league pay **coins** (game currency) based on finishing place; league money ($1,000 / $10,000 / $100,000) is only the cash you use to buy stocks inside that league.

League cash exists for stock trading inside a league. Coins exist as the persistent in-game currency.

## Trading Mechanics

Within their chosen league, users can:

* **Search for real, publicly traded stocks** (e.g., AAPL, TSLA, NVDA, etc.)
* **"Buy"** shares using their fake league balance, at the stock's actual current market price
* **"Sell"** shares they hold, again at the real stock price
* Hold a **portfolio** of multiple stocks simultaneously, same as a real brokerage account would allow

No real money changes hands, no real shares are transferred — this is purely a simulation layered on top of real market data. But because the prices are real and moving in real time, the game requires genuine market awareness and reflects real-world volatility, news events, and trends. If NVDA jumps 5% in real life, your simulated NVDA holdings jump 5% too.

League cash is the only money used for stock purchases. Coins cannot be used to purchase stocks.

## Real-Time Portfolio Tracking

As the week progresses:

* Each user's total portfolio value updates continuously as the real prices of their held stocks move
* Users can see their **gains/losses**, both in dollar terms and percentage terms, updating live
* Users can view **trends** — how their portfolio has moved over the day/week, which holdings are up or down, etc.

This turns the week into an ongoing, live-feeling competition rather than a single static bet — value is visibly rising and falling throughout the week as real market prices move.

## The Leaderboard

Within each league tier (1K / 10K / 100K), there is a **live leaderboard** showing all participants ranked by current total portfolio value. As prices move throughout the week:

* Users move up and down in real time relative to other players in their tier
* This creates the core competitive tension of the app — you're not just watching your own portfolio, you're watching your rank change against everyone else
* **Every player on a leaderboard is a real person with a real account.** There are no bots, simulated opponents, or filler players — an empty or small room is shown as it is (see Mandatory Agent Rule 17)

## End of Week: Settlement & Winning

At the end of the week:

* The league "locks" — no more trading is allowed
* Final portfolio values are calculated based on final market prices
* Whoever has the **highest total portfolio value** (i.e., grew their starting fake money the most) is declared the winner of that league tier for the week
* Top finishers earn **coins and other applicable rewards**
* Players do **not** receive league cash as a reward for winning or placing
* League cash remains the temporary trading currency for that league only

After settlement, a new weekly cycle begins and users can enter again — potentially the same tier or a different one.

## Rewards: Coins & Chests

Winning or placing well in a weekly league earns the player **coins** — the app's persistent in-game currency.

Coins are completely separate from the fake league cash used for buying stocks.

**Rewards do not add money to the player's stock-trading balance.** Instead, rewards provide coins and other progression rewards.

Coins persist across weeks and represent long-term progression separate from any single week's trading performance.

Coins can be spent to **open chests**:

* Chests are opened via an engaging **3D spinning-open animation**, similar in spirit to the chest-opening moment in Brawl Stars — the chest visibly spins/shakes before revealing its contents, making the reward moment feel exciting rather just a text popup.
* Chest contents could include more coins, cosmetic items, or new "buddies" (see below) — the exact reward table is a detail to define later, but the core idea is a satisfying, animated unlock moment tied to competitive success.
* Chests and their contents do not provide additional league cash unless a future gameplay rule explicitly introduces that mechanic.

## The Buddy — Your Companion & Stats Hub

This is the app's signature personality feature.

### What it is

A **buddy** is a small, cartoon-style 3D character that lives permanently in a **corner widget/box** on the app's main screen — always visible, similar in concept to how the Snoopy watch face sits in the corner of an Apple Watch face and performs cute idle animations continuously.

### What it does

* **Idle animations:** while just sitting in its box, the buddy performs a rotating set of small, cute animations — nothing the user needs to trigger, just ambient personality/charm while the app is open.
* **Reactive animations:** the buddy's behavior can reflect what's happening with the user's portfolio — e.g., a happy/celebratory animation when the user's portfolio is up, a worried/sad animation when it's down, perhaps something special when the user is winning their league.
* **Tap for stats:** tapping the buddy opens a stats/insights panel showing the user's own data at a glance:

  * Current portfolio value
  * Which individual stock holdings are up or down
  * Overall gain/loss for the week
  * Trend information over time

The buddy essentially turns a normal "view my stats" screen into something with personality and charm — instead of a plain dashboard, checking your performance means interacting with a character you've grown attached to.

### Future scope

Buddies may eventually be **collectible** — different buddy designs unlockable via chests — turning the companion feature into an additional long-term progression/collection layer on top of the weekly trading competition itself.

---

## Why These Pieces Fit Together

| Layer                            | Purpose                                                                                                                                |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Weekly leagues (1K/10K/100K)** | The core competitive game loop — real strategy, real stakes (in-game), resets regularly so it stays fresh                              |
| **Real stock data**              | Makes the competition genuinely skill/knowledge-based, not arbitrary — ties it to something meaningful and dynamic (the real market)   |
| **Live leaderboard**             | Creates ongoing competitive tension throughout the week, not just a single end-of-week reveal                                          |
| **Coins & chests**               | A reward loop that gives winning weeks lasting value beyond just bragging rights                                                       |
| **Buddy companion**              | Adds personality, charm, and a friendlier "front door" into your own stats — differentiates the app emotionally, not just mechanically |

---

## Summary in One Paragraph

StockArena is a weekly fantasy-trading competition: you pick a league tier (1K, 10K, or 100K in starting fake money), build a simulated stock portfolio using real, live market prices, and compete on a live leaderboard against other players in your tier to see who grows their portfolio the most by week's end. Winning and placing well earns **coins**, the persistent in-game currency. Coins can be used for progression systems such as animated 3D chests, cosmetics, and collectible buddies. **Coins are completely separate from league cash: league cash is only provided when joining a league and is used only for buying stocks. Rewards do not give league cash.** A cute animated companion — your "buddy" — lives in the corner of the app, reacting to your performance and giving you a charming way to check your stats at any time.

---

## Tech Stack

What we are building with (declared stack — see notes where the code hasn't caught up yet):

* **Web app:** Next.js 15 (App Router) + React 19, hosted on **Vercel** (`web/`, Root Directory `web`). NOTE: current code is JavaScript (`.js`); the TypeScript migration hasn't happened yet. `web/types/` is reserved for shared types/interfaces when it does.
* **3D:** Three.js / React Three Fiber for the buddy companion and chest-opening animations. Home: `web/components/three/` (buddy, chest), models in `web/public/models/` (`.glb`). **Header runner:** `web/public/models/running.fbx` is now installed and rendered small inside the top bar (`web/components/layout/HeaderRunner.js` — transparent R3F canvas between StockArena and the coin/money chip). It runs left→right across the bar (StockArena → money), disappears off the right edge, pauses 2 seconds hidden, then re-enters from the left and repeats; `prefers-reduced-motion` parks it static. Requires `three` + `@react-three/fiber` + `@react-three/drei` (now installed).
* **Worker:** Python 3.12 price poller + game engine (`worker/`), hosted on **Railway** with restart ON_FAILURE. Fills orders (forward pricing), settles leagues, seeds prices.
* **Database:** **Postgres** on Railway. Worker uses the private `DATABASE_URL`; Vercel uses `DATABASE_PUBLIC_URL` (TCP proxy).
* **Market data:** **Finnhub** (`/quote`), 30-stock universe in the `stocks` table — inside the 60 calls/min free limit. `TICKERS` env var retired.
* **Mobile plan:** wrap the web app with **Capacitor** for iOS/Android App Store submission once the core app is feature-complete. No React Native, no Swift.
* **Accounts (TEMPORARY, for testing — since 9/17/26):** there is no login or sign-up page. Each browser keeps a random device id in `localStorage`; the server stores only its sha256 (`users.device_hash`) and signs that device in. On first visit the player picks their own player name. "Sign out of this device" forgets the id, so the next visit starts a new player. Password login code (`login`/`signup` in `web/lib/actions.js`) is kept, unused, for when a login page is re-installed. Known limit: one person can create several players by clearing storage or using private windows — see rule 17.
* **Design:** Apple-style liquid glass on an animated green/black mesh gradient — frosted glass containers (`.glass`, `.card`, ...), inner glass for nested items, rim-colour modifiers (`.rim-accent|gold|ok|bad|blue`) instead of borders, glass buttons with hover/pointer-light/spring-press/pending states (`SubmitButton`), and a sliding liquid-glass tab lens. Tokens and shared classes live in `web/app/globals.css`; screen styles in `web/styles/screens/*.css`. The header bar's runner track (`HeaderRunner`) lives inside `app-header-inner` on that same glass language.
* **Responsiveness (REQUIRED, since 9/17/26):** the app must feel **snappy AND stay liquid glass** — the glass look is never the thing that gets cut to gain speed. Tab switches must acknowledge instantly (active tab + lens move in under ~300 ms, well before the new page's data arrives); a full page switch should never leave the user staring at a dead, unresponsive screen for ~3 seconds. Keep the green/black mesh, frosted glass, rim light, sheen, and sliding lens; gain the speed from the data path instead — stream each page (glass skeleton first, cards fill in via Suspense), kill the per-navigation server waterfall, and give every route an instant loading state. Measured on a mid-range phone over LTE, not just localhost.

Current `web/` layout (feature-based; route groups in parentheses don't change URLs):

* `app/` — `page.js` (landing + device sign-in when signed out, dashboard when signed in), `layout.js`, `globals.css`, `manifest.js` stay at top level; no `(auth)` pages while login is removed; `(battles)/league`, `(battles)/trade`, `(battles)/trade/[symbol]`; `(daily)/daily`; `(progression)/progress`; `(profile)/profile`; `(admin)/status`; `api/` reserved for backend routes; empty groups `(daily)`, `(social)`, `(community)`, `(mentor)`, `(leaderboard)`, `(progression)`, `(settings)` hold `.gitkeep` placeholders for upcoming features.
* `components/` — `layout/` (header, nav with the glass tab lens, icons, `ui.js` PageHead/Flash/StatTile/ProgressBar, `SubmitButton`, `PointerGlow`, AutoRefresh); `auth/` (`DeviceEntry`, `ForgetDevice` — temporary device sign-in); `home/`, `battle/` (StandingCard, TierCards, LeagueBoard), `trade/`, `profile/`; `social/` reserved; `three/` reserved for buddy/chest R3F components. Screen styles live in `web/styles/screens/`.
* `lib/` — `db/` (Postgres pool in `index.js`; sessions and the temporary device identity in `auth.js`); `trading/` (league/portfolio/order logic and career stats in `game.js`); `utils/` (formatting in `format.js`); `xp/` reserved for XP/rank calculations; `actions.js` (server actions: resumeDevice, enterWithDevice, forgetDevice, join, trade, cancel; signup/login/logout kept unused for when a login page returns).
* `types/` — reserved for shared TypeScript types (JS codebase for now).
* `public/models/` — reserved for `.glb` 3D model assets.
* `worker/` and top-level `assets/` are intentionally untouched by the restructure.

## Updates

Jackson OpenCode 4:15 PM 9/13/26

Created project `AGENTS.md` with the remote-check-before-edit rule (check the GitHub remote for new commits, pull when safe, stop and ask if local changes could conflict, never overwrite/discard/reset/force-push anyone else's work) and the `contextHistory.md` maintenance protocol (read before changing, update after, newest entry on top, same-commit history updates, real author attribution). Committed together with the history update in `1a55c72`. Follow-up: the Claude Code collaborator should read the new `AGENTS.md` so both sides follow the same workflow.

---

Jackson OpenCode 4:24 PM 9/13/26

Restructured `contextHistory.md` into the shared-memory format: a "How This File Works" explanation at the top, the weekly Regular Gameplay Plan as the current source of truth, and an `## Updates` section. Migrated the one genuinely existing historical update (project `AGENTS.md` creation, commit `1a55c72`) into the new update format with its original timestamp — no history was invented. Moved the entire pre-existing combined project context (gameplay visions, daily-contest V2 plan, architecture, worker/web deep dives, database, env vars, deploy notes, quick reference) into the preserved `## Reference` section below without deleting any information. Verified before editing: `git pull origin main` returned already up to date with a clean tree.

---

Aarav — Claude Code 4:48 PM 9/13/26

Catch-up entry for the infrastructure work done before this log existed, plus today's deployment. Code changes were made by Claude Code; the Railway and Vercel dashboard setup was done by Aarav following Claude Code's instructions.

* Commits: `10c3d46` scaffolded `worker/` (Python Finnhub poller → Postgres `price_ticks` + `latest_price`), `web/` (Next.js status page reading `latest_price`), and `docs/`. `7989b72` fixed the first Railway build (`pip: command not found`) by moving `railway.json` into `worker/`, dropping the forced `pip install` build command so Railway detects Python itself, and pinning Python 3.12 via `worker/.python-version`. `39dc7ba` added a "Making changes" section to `README.md` (edit locally → commit → `git push` → Railway/Vercel auto-deploy). `a6d8b78` merged Jackson's `AGENTS.md` / `contextHistory.md` commits; no conflicts.
* Railway (project "cozy-illumination"): worker service from this repo with Root Directory `worker`, plus a Postgres service. Worker variables: `FINNHUB_API_KEY`, `TICKERS` (AAPL,TSLA,NVDA,AMD,SOFI,PLTR,COIN,MARA), `POLL_SECONDS=60`, `MARKET_HOURS_ONLY=1`, and `DATABASE_URL=${{Postgres.DATABASE_URL}}` (private network, no egress fees). Postgres has a TCP proxy on 5432 and a `DATABASE_PUBLIC_URL` variable, used only by Vercel.
* Vercel (Aarav's account): Root Directory `web`, env `DATABASE_URL` = Railway's `DATABASE_PUBLIC_URL`. Live at https://web-orpin-nine-95.vercel.app, verified returning HTTP 200 with "8 symbols cached". Worker logs confirmed `wrote 8/8` each minute.
* Decision: Aarav approved following `AGENTS.md`; Claude Code will pull before editing and log changes here from now on.
* Follow-up: (1) Gameplay source of truth is out of sync. Aarav's latest draft — 1K/10K/100K leagues, rank-matched public leagues (private leagues unmatched), league money kept separate from coins, coins paid by finishing position — is not yet in the repo; both `docs/gameplay-plan.md` and the plan at the top of this file predate it. Aarav and Jackson should agree on one version before building features. (2) `poller.py` does not reconnect if Postgres restarts; it relies on Railway's ON_FAILURE restart. (3) Market-hours check has no holiday/half-day calendar yet. (4) `AGENTS.md` says newest entry on top, but this file appends oldest-first; this entry follows the file's existing order.

---

Jackson OpenCode 4:48 PM 9/13/26

Added the StockArena logo to the project (`assets/stockarena.png`, copied from `stockarena.png` in Downloads, ~1.1 MB) and rewrote `README.md` as a description of the app: centered logo header, what StockArena is, how a league week works, leagues and achievements, the worker → Postgres → web system diagram, layout, run/deploy notes. Preserved the collaborator's `Making changes` section verbatim, including their local-path wording. Pulled `origin/main` before editing, which fast-forwarded the friend's merge commit (`a6d8b78`, README `Making changes` section) with no conflicts. Logo is committed with the project so it renders on GitHub.

---

Aarav — Claude Code 4:54 PM 9/13/26

Repo cleanup before starting on the app, at Aarav's request ("delete all the files that are unnecessary; keep Jackson's work and the .md files"). Pulled `origin/main` first, which fast-forwarded Jackson's logo + README commits (`f0f66d8`, `9cfc809`) with no conflicts.

* Deleted `docs/StockArena-Plan-v2.pdf` (~800 KB). It described the superseded daily-contest design; its content is preserved in the Reference section below and the file remains in git history (`git show 5c3d914:docs/StockArena-Plan-v2.pdf`).
* Updated the header of `docs/gameplay-plan.md`, which pointed at the deleted PDF, to point at `contextHistory.md` instead. Plan content unchanged.
* Kept everything else deliberately: `worker/` and `web/` are the code running live on Railway and Vercel; `worker/Procfile`, `railway.json`, and `.python-version` are needed by the Railway build; all `.md` files and `assets/stockarena.png` kept as requested. Mentions of the PDF in earlier entries and the Reference section are history and were left as-is.
* Follow-up: the gameplay source of truth is still split (see the 4:48 PM entry). `web/` is still the infrastructure status page and will be replaced as the app is built.

---

Aarav — Claude Code 4:56 PM 9/13/26

Removed the `docs/` folder at Aarav's request: `contextHistory.md` is now the single home for the gameplay plan and project context. Pulled `origin/main` first (already up to date).

* Deleted `docs/gameplay-plan.md`, the last file in `docs/`. Its weekly plan is the same one already at the top of this file, and it remains in git history.
* Removed the `docs/` row from the layout table in `README.md`.
* Changed the footer of `web/app/page.js` from "finalize the gameplay plan in `docs/`" to "in `contextHistory.md`". Text-only change; Vercel will redeploy on push.
* Follow-up: the plan at the top of this file is still the Bronze/Silver/Gold version. Aarav's newer draft (1K/10K/100K leagues, rank-matched public leagues, coins separate from league money) should replace it here once Aarav and Jackson agree.

---

Aarav — Claude Code 5:12 PM 9/13/26

Started building the app (stage 1 of 2: the game engine in `worker/`). Aarav gave the build prompt: StockArena Project Plan Draft v1 plus Claude's feedback. Pulled `origin/main` first (up to date).

**v1 build spec, as decided for this build** (Draft v1 core + the feedback's technical fixes):

* Weekly leagues at three tiers: 1K / 10K / 100K starting play money. One league per player per week.
* Players are placed in rooms of up to 30 inside a league; leaderboards are per room. Rank-based matchmaking is deferred (no rank exists yet).
* Weeks run Monday 00:00 → next Monday 00:00 America/New_York. Trading is open until Friday's 4:00 PM close; after that, "join" means next week's league, and pre-open orders fill at Monday's open.
* Buy by dollar amount (fractional shares), sell by dollar amount or "sell all". Long-only.
* No stock may exceed 20% of portfolio value at the time of buying.
* **Forward pricing:** orders are stored as pending and fill only at the first price the worker observes *after* the order was placed. Prices seeded while the market is closed are display-only and never fill orders.
* Tradable universe is a fixed list of 30 stocks in the `stocks` table (30 calls/min, inside Finnhub's 60/min free limit). The `TICKERS` env var is no longer used.
* Settlement at Monday 00:00 ET: pending orders cancelled, rooms ranked by final value (ties → earlier join), coins paid: 1st 500, 2nd 350, 3rd 250, top half 100, everyone else 50, × tier multiplier (1K ×1, 10K ×2, 100K ×4). Players with no filled order get 0. Coins are never cashable, tradable, or purchasable.
* Chests, buddy, rank matchmaking, achievements, notifications come after the core loop works.

**Changes:**

* `worker/schema.sql`: added `stocks` (30 seeded), `users`, `sessions`, `leagues`, `rooms`, `entries`, `positions`, `orders`; added `latest_price.prev_close`. All idempotent; applied by the worker on start.
* `worker/game.py` (new): `fill_pending_orders` (per-order transaction, row locks, Decimal math, dust handling), `settle_due_leagues` (idempotent via `FOR UPDATE` on the league row + status check), `coin_payout`, `rank_room`.
* `worker/poller.py`: polls active symbols from the DB, stores previous close, stamps each quote with database time taken just before its request (so the forward-pricing comparison with `orders.placed_at` uses one clock), fills orders and settles leagues each open cycle, settles + seeds missing prices while closed, and reconnects after a lost DB connection instead of crashing.
* `worker/test_game.py` (new): unit tests for payouts and ranking; 6/6 pass locally. SQL paths were not run locally (no local Postgres); they get exercised on Railway.
* `worker/.env.example`: dropped `TICKERS`.
* Follow-up: stage 2 is the web app (accounts, league picker, trading screens, portfolio, leaderboard). The Railway `TICKERS` variable can be deleted.

---

Aarav — Claude Code 5:18 PM 9/13/26

Stage 2 of the v1 build: the playable web app in `web/`. Pulled `origin/main` first (up to date). Verified stage 1 in production before pushing: the worker applied the new schema and seeded prices for all 30 stocks while the market was closed (live status page showed "30 symbols cached").

* **Accounts** (`web/lib/auth.js`): username + password, scrypt hashes via `node:crypto`, 30-day httpOnly session cookie; only a sha256 of the session token is stored in `sessions`. No third-party auth service.
* **Data layer** (`web/lib/db.js`, `web/lib/game.js`): shared `pg` pool; NUMERIC/BIGINT parsed to numbers, DATE kept as `YYYY-MM-DD` strings. `game.js` has league joining (creates the week's league row on demand, first room with space, else a new room of 30), portfolio + leaderboard queries, the stock list, trade limits, order placement, and cancel. Order placement re-checks everything server-side: trading window, stock has a price, available cash (cash minus pending buys), and the 20% cap (position value + pending buys of that stock). Fills themselves stay in the worker.
* **Server actions** (`web/app/actions.js`): signup, login, logout, join, trade, cancel. Each redirects back with an `?ok=` / `?error=` message.
* **Screens**: `/` landing, `/signup`, `/login`, `/league` (tier picker; portfolio value, P/L, place, cash; holdings; pending orders with cancel; room leaderboard; auto-refresh every 30s), `/trade` (searchable list of the 30 stocks with day change), `/trade/[symbol]` (price, position, buy by dollars, sell by dollars or sell all, pending orders), `/profile` (coins, record, past leagues, log out). The old infrastructure page moved to `/status`. Bottom tab bar, light/dark themes, installable via `app/manifest.js`.
* Not built locally (no Node on this machine); Vercel's build is the first compile. `README.md` layout row for `web/` updated.
* Follow-up: chests (deterministic reveals, no loot boxes), achievements, rank matchmaking, notifications, holiday calendar, login rate-limiting.

---

Jackson OpenCode 8:28 PM 9/13/26

Removed the `## Reference — Preserved Combined Project Context` section from `contextHistory.md` at Jackson's explicit request, and inserted the StockArena App Overview ("game overall": 1K/10K/100K tiers, trading mechanics, live tracking, leaderboard, settlement, coins/chests, buddy companion) between the Regular Gameplay Plan and `## Updates`. File order is now: how-to-use explanation, gameplay plan, app overview, updates at the end. All 8 existing Updates entries preserved untouched; the removed Reference content remains recoverable in git history. Note: the friend's 4:54 PM entry and older entries mention the Reference section and the deleted `docs/` files — those mentions are history and were left as-is.

---

Jackson OpenCode 8:55 PM 9/13/26

Restructured `web/` into the feature-based layout (route groups, `components/`, `lib/db|xp|trading|utils`, `types/`, `public/models/`) with zero logic changes — moves via `git mv` so file history is preserved; `worker/` and top-level `assets/` untouched. Did it in 3 incremental moves, each verified: (1) `lib/` split (`db.js`→`lib/db/index.js`, `auth.js`→`lib/db/auth.js`, `game.js`→`lib/trading/game.js`, `format.js`→`lib/utils/format.js`, `app/actions.js`→`lib/actions.js`, `lib/xp/` placeholder); (2) shared UI into `components/layout/` (`nav.js`, `ui.js`, `refresh.js`) with `battle/`, `social/`, `profile/`, `three/` placeholders; (3) pages into route groups (`(auth)`, `(battles)`, `(profile)`, `(admin)`) plus `api/` and future-feature placeholders — parenthesized groups, so all 9 URLs are byte-identical. Ran `npm install` + `npx next build` after every move (all green; route table identical each time) and smoke-tested the production server (`/`, `/login`, `/status`, `/league` all HTTP 200). Also added a `## Tech Stack` section documenting Next.js App Router + React, planned TypeScript migration (`types/` reserved; code is JS today), Three.js/R3F for buddy/chest (`three/` + `public/models/` reserved, not installed yet), Vercel + Railway + Postgres + Finnhub, and the Capacitor wrap plan for App Store submission (no React Native, no Swift). Follow-ups: install R3F packages, TS migration, XP/rank logic in `lib/xp/`, backend routes in `app/api/`; `web/package-lock.json` (from the local install) left untracked.

---

Jackson OpenCode 9:24 PM 9/14/26

Removed project `AGENTS.md` (`git rm`) and replaced `contextHistory.md` with Jackson's new version at his explicit request. Pulled `origin/main` first (already up to date, no new collaborator commits). All 10 prior Updates entries preserved verbatim; no history invented. New content: 16 Mandatory Agent Rules + completion checklist + stop-and-ask conditions, League Cash vs Coins split added to the App Overview, Tech Stack section kept. Note: project rules now live solely in `contextHistory.md`; the global `~/.config/opencode/AGENTS.md` (OpenCode operating config) was not touched. Follow-up: Aarav/Claude Code should read the new Mandatory Agent Rules — especially append-only history, no-invention, verify-changes, and secrets rules.

---

Jackson OpenCode evening 9/17/26 PDT

Green-black liquid-glass mobile UI overhaul + removed signup page UI at Jackson's request. Pulled/cloned `origin/main` clean before work; no collaborator commits conflicted; no destructive git ops; no secrets touched.

* Deleted `web/app/(auth)/signup/page.js`. Rewired all `/signup` refs: `web/app/page.js` landing now has single Log in CTA, `web/app/(auth)/login/page.js` dropped Create-account link, `web/lib/actions.js` signup error redirects now point to `/login` (exported `signup()` kept unused so auth/session logic untouched).
* New 5-tab black bottom bar in `web/components/layout/nav.js`: Home `/`, Battles `/league`, Daily `/daily`, Progress `/progress`, Profile `/profile`. Black `rgba(0,0,0,0.85)` + blur, green active pill, Home exact-match only, others prefix-match. Still gated to signed-in users in `web/app/layout.js` (themeColor `#04120a`).
* New routes: `web/app/(daily)/daily/page.js` (`/daily` static news placeholders), `web/app/(progression)/progress/page.js` (`/progress` coins hero + career stats + Store coming soon, coins only). Home `/` for logged-in users is now an overview dashboard (value, P/L, place, cash + quick links) instead of redirect to `/league`; logged-out landing preserved.
* Restyled `web/app/globals.css` to green-black gradient + liquid glass (blur 18px/saturate 140%, translucent surfaces, green glow primary); class names preserved. Profile adds achievements icon grid (derived from history/wins/podiums) + notifications placeholder; trading/league logic untouched in `worker/` and `web/lib/trading/game.js`.
* Verified: `cmd /c npm run build` in `web/` green — routes `/`, `/daily`, `/league`, `/login`, `/profile`, `/progress`, `/status`, `/trade`, `/trade/[symbol]`, no `/signup`; `Select-String /signup` across `web/app+components+lib` = zero hits. LSP diagnostics unavailable (daemon unreachable), build used as evidence. `web/package-lock.json` again left untracked.
* Follow-up: visual QA on a phone viewport (tabbar spacing, glass contrast), decide if logged-out users should see tabs, wire real Daily news + real achievements/notifications, commit + push when Jackson approves (left uncommitted per no-commit rule).

---

Aarav — Claude Code 9:38 PM 9/17/26 PDT

Redesign pass on top of Jackson's `f2f3aad` + added Mandatory Agent Rule 17 (real players only), both at Aarav's request. Pushed as an in-progress snapshot because Aarav asked to push immediately; a follow-up commit will finish the screens.

* **Base + conflict handling:** fetched first and found Jackson's three new commits (`319cb4e` feature-based restructure, `c53912e` new rules, `f2f3aad` green-black UI) conflicting with Aarav/Claude's own *unpushed* web restructure. Stopped and asked per rule 3; Aarav chose Jackson's version. Claude's restructure was set aside with `git stash push -u` (stash "Aarav/Claude: unpushed web restructure…", recoverable, nothing deleted), then `git pull --ff-only`. Jackson's structure, routes, 5 tabs, and signup removal are kept as-is.
* **Rule 17 — real players only:** added to Mandatory Agent Rules, the Completion Checklist, Stop-and-Ask, and the App Overview leaderboard section. No bots existed: `git grep` across code and history found nothing that creates, seeds, or simulates players (only real users joining via `join`). The names Aarav saw ("Marcus", "Sarah") were sample rows in Claude's *local* design-preview page, never in the app or database; they were removed from that preview. The production `users` table was not inspected (no DB credentials on this machine).
* **Design system (`web/app/globals.css`, rewritten):** animated green/black gradient on every screen (two fixed `body::before/::after` layers animating transform/opacity only; paused under `prefers-reduced-motion`); all cards/containers now solid and opaque with 1.5px edges (removed the translucent/backdrop-blur surfaces); no decorative shapes; Orbitron display + Space Grotesk body via `next/font`; mobile-first with 768px and 1100px breakpoints (desktop: nav becomes a left rail, `.split` two-column layouts).
* **Navigation (`components/layout/nav.js`):** same 5 tabs; the active tab is now a single liquid-glass lens (frosted blur, specular sheen, refraction tints) that slides between tabs with a brief fluid stretch; Battles also lights up on `/trade`. New `components/layout/header.js` (logo + coin balance / Log in), `components/layout/icons.js`, and `StatTile`/`ProgressBar` in `components/layout/ui.js`. Logo mark and app icons restored from the stash into `web/public/` and `web/app/`.
* **Data helpers:** `lib/trading/game.js` — `TIERS` gain `medal`/`blurb`, `WIN_COINS`, `weekHasStarted()`, `careerStats()` (wins, podiums, win rate, weekly streak), and leaderboard rows now include `stocks` (positions held). `lib/utils/format.js` — `weekRange`, `timeUntil`, `progress`. No worker or schema changes.
* **Screens (in progress, by a parallel agent workflow on the shared system):** Battles = browse/join tier cards, then the joined league's leaderboard with per-player value, P/L, return %, stocks held; holdings + pending orders move to Home; Trade, Daily, Progress, Profile, Login, Status restyled. Per-screen CSS in `web/styles/screens/{home,battles,trade,account}.css`. At push time three screen groups were built and under review and Battles was still being built.
* **Verification:** no Node on this machine, so no `next build` here. Gate used: a static checker (parses every JS/JSX file, resolves every import/export, `'use server'` exports, CSS brace balance, and the redesign rules — no translucent backgrounds, `backdrop-filter`, or decorative pseudo-elements in screen CSS) — all passed on this snapshot. Foundation visually checked in a local HTML harness at 375px and 1280px (gradient drift, solid cards, lens sliding, desktop rail). Vercel's build is the first real compile.
* **Follow-up:** finish + review the screens and push; confirm the Vercel build; Jackson to smoke-test with `npm run build` locally if possible; Aarav to confirm the production `users` table contains only real people.

---

Aarav — Claude Code 10:06 PM 9/17/26 PDT

Second redesign pass at Aarav's request: login page removed with device-based identity for testing, Apple-style liquid glass everywhere (cards included), a more modern animated gradient, and more responsive buttons. Pushed as a snapshot because Aarav asked to push immediately; the screen-integration agents are still finishing and a follow-up commit will complete them.

* **Decisions (asked and answered in chat):** (1) Removing `/login` would lock everyone out, so Claude asked; Aarav chose "remove it for testing and identify everyone by local storage on their computer; login comes back later". (2) Liquid glass conflicts with the earlier "solid, opaque cards" request; Aarav chose "everything, cards too", which replaces that rule.
* **Login removed:** deleted `web/app/(auth)/login/page.js` (recoverable from git history). No links or redirects to `/login` or `/signup` remain; `requireUser()` and the server actions now send signed-out visitors to `/`. Password `signup`/`login` actions are kept unused for when login returns (their error redirects now point at `/`).
* **Device identity (temporary):** `web/lib/db/auth.js` (`validDeviceId`, `userForDevice`, `createDeviceUser`), `web/lib/actions.js` (`resumeDevice`, `enterWithDevice`, `forgetDevice`), `web/components/auth/DeviceEntry.js` (landing sign-in: random id in `localStorage` key `stockarena.device`, known devices auto-resume, new devices pick their own player name) and `ForgetDevice.js` (replaces Log out; forgets the device, so the next visit is a new player). Only a sha256 of the device id is stored. `worker/schema.sql`: `ALTER TABLE users ADD COLUMN IF NOT EXISTS device_hash TEXT UNIQUE` (nullable, non-destructive; applied when the worker restarts). Device accounts get `password_hash = 'device'`, which can never pass password verification.
* **Rule 17 note:** every device player is a real person who typed their own name. Known limit (flagged by the review critic, not solved): one person can create several players by clearing storage or using private windows, and "signed out" players stay in their rooms. Acceptable for testing per Aarav's choice; revisit when login returns. Also removed invented claims about players' standings from Daily's placeholder blurbs (done by the review critic) and one made-up Profile notification line (in progress).
* **Liquid glass design system (`web/app/globals.css`, rewritten):** frosted glass containers (`.glass`, `.card`, `.hero-card`, `.stat-tile`, `.flash`, header, tab bar) with light rim, sheen and depth; inner glass for nested items; rim-colour modifiers `.rim-accent|gold|ok|bad|blue` (glass has no borders); near-opaque fallback when blur is unsupported or reduced transparency is requested. Floating glass tab bar (capsule on phones, rail on desktop) keeps the sliding liquid-glass lens.
* **Gradient:** replaced the two linear layers with an animated green/black mesh (soft colour fields that drift, turn and cross-fade; transform/opacity only; off under reduced motion).
* **Buttons:** glass capsules with hover lift, a light that follows the pointer (`web/components/layout/PointerGlow.js`), spring press, focus ring, disabled and pending states; `web/components/layout/SubmitButton.js` shows a spinner and blocks double-submits while a server action runs (being wired into every form by the integration agents).
* **Also:** header "Drop in" jumps to the landing sign-in; Tech Stack section updated for the temporary accounts and design; shared fixes from the first review round (numbers never wrap mid-value on phones, shared medal colours for places, inline `code` style, a bit more room next to the desktop rail); first-round screen rebuild (review workflow: 4 builders, 4 adversarial reviewers, 1 critic — all checks passed) included in this commit.
* **Verification:** static checker (parse, imports/exports, `'use server'` exports, CSS, screen-CSS glass rules, no removed routes) passed on this snapshot; glass foundation checked in the local harness at 375px and 1280px. No Node here, so Vercel's build is the first compile. Not yet verified with real data: the device sign-in flow end to end (needs the worker to add the column first).
* **Follow-up:** finish + review the integration pass and push; confirm the Vercel build and that the worker applied `device_hash`; Aarav's earlier password account (if any) can't be reached while login is removed — a new player name is needed on each device.

---

Jackson OpenCode evening 9/17/26 PDT

README update at Jackson's request after pulling latest (`06cd97a`). No collaborator conflicts; `git fetch` showed `f2f3aad..06cd97a` fast-forward. `git status` clean except `web/package-lock.json` untracked (left untracked).

* `README.md`: in `## Leagues and achievements` clarified **real opponents, not a solo simulation** — every league is live vs real people, random leagues match real opponents, joining places you in a room with real players on a shared leaderboard. In `## Design — liquid glass, green and black` (new) and `## Layout` described the required UI language — mobile-first liquid glass over an animated green/black mesh gradient (frosted glass, rim light, sheen, depth, sliding glass lens on the 5-tab bar Home/Battles/Daily/Progress/Profile), motion paused for `prefers-reduced-motion`, system in `web/app/globals.css` + `web/styles/screens/`. No code, secrets, or DB changes; verified README renders.
* Follow-up: commit + push when Jackson approves; collaborators should keep real-players-only (Rule 17) and liquid-glass green/black language for all new screens.

---

Jackson OpenCode evening 9/17/26 PDT

Pushed the README update (`0ea0367` — `README: document liquid-glass green/black UI + real opponents not simulation`) to `origin/main` at Jackson's request. `git push origin main` from `06cd97a..0ea0367` succeeded; `git status` clean except `web/package-lock.json` untracked (left untracked). No additional code changes; previous `contextHistory.md` entry preserved verbatim per append-only rule.

---

Jackson OpenCode evening 9/17/26 PDT

Aligned game mechanics in `README.md` and `contextHistory.md` to Jackson's spec at his request. `git status` clean before edits; no remote changes to pull.

* `README.md`: intro now states every week three leagues open — 1K ($1,000), 10K ($10,000), 100K ($100,000) — and you may join one, two, or all three at once; clicking Join enters that league's interface showing how much money you have / spent / stocks bought; buying at real market price with real-time rises/falls (simulation with real data, same for all tiers). `## How a league week works` Monday bullet rewritten for 1K/10K/100K.Sunday pays coins per league. `## Leagues and achievements` now ends with explicit **CURRENCY != LEAGUE MONEY** bullet (coins = game currency from finishing place, league money = only for buying stocks, resets weekly).
* `contextHistory.md` (current plan, not history): `## Weekly Game Loop` Monday rewritten for 1K/10K/100K + multi-join + interface description; Sunday note adds coins per league and CURRENCY != MONEY; `## Core Concept: The Weekly League` tier paragraphs now note you may join 1/all three + interface description; `### The Two Currencies` important rule now includes **CURRENCY AND THE MONEY TO BUY STOCKS ARE NOT THE SAME — coins are for the game while money is for the leagues** and clarifies places pay coins vs league money for stocks. No code, secrets, or DB changes; no history rewritten.
* Follow-up: push committed as one doc commit; collaborators should treat 1K/10K/100K multi-join + real-price simulation + coins≠league-money as source of truth going forward.

---

Jackson OpenCode evening 9/17/26 PDT

PLAN-only pass at Jackson's request: audited the 5-tab sidebar + liquid-glass implementation and recorded a snappy-but-glassy speedup plan. No code changed. `git fetch` showed no new remote commits; tree clean except untracked `web/package-lock.json` (left untracked).

* **Audit (how it works today):** `web/components/layout/nav.js` (client) renders 5 `next/link` tabs (Home `/`, Battles `/league`+`/trade`, Daily, Progress, Profile) with outline SVGs from `components/layout/icons.js`; the active tab is a single `.tab-glass` lens positioned by `--i` that slides via a 0.62 s `translate` transition and briefly stretches (`data-moving`, 260 ms timer). Phone = floating bottom capsule; ≥1100px = left rail. The glass material (`web/app/globals.css`): `--glass-blur: blur(26px) saturate(175%)` (strong: 30px/190%) on every top-level container + masked 1px rim light, sheen, inset highlights; animated green/black mesh behind everything on `body::before/::after` (transform/opacity only, 23–44 s loops); pointer light via `PointerGlow.js` (`--mx/--my`).
* **Why a tap takes ~3 s:** the delay is the data path, not the glass. Root layout is `force-dynamic` and runs `currentUser()` (DB roundtrip to Railway Postgres over the public TCP proxy) on EVERY navigation, then each page runs 2–6 more queries (e.g. Home: currentEntry + joinableWeek + careerStats, then holdings + orders + leaderboard). No `loading.js`/Suspense anywhere, so the tap looks dead until the whole waterfall finishes; cold starts and `next/font/google` add on top. CSS lens (0.62 s) and heavy blur add render cost on phones but are second-order.
* **Plan (glass stays, speed comes from elsewhere):** (1) instant feedback — lens/active state flips in <300 ms on tap, independent of data; shorten lens travel to ~0.25 s; (2) stream every route — glass skeleton `loading.js` + Suspense around slow cards (leaderboard, holdings) so the shell paints immediately; (3) collapse the per-navigation DB waterfall (per-request user cache, parallel queries, only what the viewport needs); (4) keep blur expensive-looking but cheap — blur only on top-level surfaces (already the rule), shorten giant transitions, keep mesh transform/opacity-only; (5) measure on a mid-range phone over LTE before/after. Recorded as the **Responsiveness (REQUIRED)** bullet in Tech Stack above; PLAN approved for implementation next.
* Follow-up: implement the plan (code changes + Vercel build check); collaborators must not "fix" speed by removing the glass.

---

Jackson OpenCode evening 9/17/26 PDT

Implemented the snappy-tabs plan + fixed league prize copy at Jackson's request (two parallel specialists, verified in review). No remote changes; no destructive ops; no secrets.

* **Snappier tabs, same glass:** `web/components/layout/nav.js` — optimistic pending index on tap so active tab + lens move immediately, cleared when the real route arrives; `web/app/globals.css` — lens travel 0.62 s → 0.22 s (same curve family; 2-line diff, all glass tokens/blur/colors/mesh untouched). New `web/components/layout/tab-skeletons.js` + six route `loading.js` files (glass skeletons, no new visual language, no mock data) so every tab paints instantly. `web/app/page.js`, `(battles)/league/page.js`, `(battles)/trade/page.js` — shell renders after minimal queries, slow cards (leaderboard, holdings, stock list, career) stream via keyed Suspense with same queries. `web/lib/db/auth.js` — `currentUser` wrapped in React `cache()` so layout + page share one session lookup; `force-dynamic` kept. No trading/payout/auth logic changed.
* **League prize copy:** `web/components/battle/TierCards.js` — replaced "X coins to win" with "1st place wins X coins" + full placement breakdown per card (2nd 350 · 3rd 250 · top half 100 · finish 50, all × tier multiplier) + "Free to join — no coins to enter". Numbers mirror `worker/game.py` exactly (PLACE_COINS {1:500, 2:350, 3:250}, TOP_HALF 100, FINISH 50). Review catch: agent used a nonexistent `check` icon (renders empty) — swapped to existing `zap` icon.
* **Verified:** `npm run build` green (5/5 static, all tab routes present); `coins to win` grep = zero hits; diff limited to nav + 2 CSS lines + skeletons/streaming + TierCards + auth cache.
* Follow-up: feel the difference on a phone over LTE; Vercel build is the production check.

---

Jackson OpenCode evening 9/17/26 PDT

Rebuilt the buying flow at Jackson's request: real data everywhere, sortable trade list, company descriptions, buy/sell by share count with a -/+ stepper (replaces dollar-amount inputs, all 30 stocks). Pulled first (already up to date); no destructive ops; no secrets.

* **Real data:** prices were already live Finnhub `/quote` via the worker (web never calls the vendor). Descriptions are new: worker fetches Finnhub `/stock/profile2` and caches per symbol in new nullable `stocks.description`/`industry` columns (`schema.sql`, ADD COLUMN only); `poller.py` backfills missing-only each cycle (steady state = zero extra calls, inside 60/min). Detail page renders the cached description, neutral fallback if missing — nothing invented.
* **Trade list:** default sort is now trending (biggest day-change % first); new Sort control (Trending / A–Z / Z–A / Price ↑ / Price ↓) via `?sort=`, server-side whitelist in `stocks()`; `?q=` search kept. New client `SortSelect.js` (server components can't carry onChange).
* **Share stepper:** new client `ShareStepper.js` (`- N +`, default 0, whole shares, max = affordable/cap room or held) bound to a `shares` form field; `DollarField.js` deleted. `placeOrder` validates integer shares ≥1, cost ≤ cash and 20% cap (at that time); stores shares + estimated cost. Worker `_fill_one` fills N shares at the next observed price (actual cost deducted, rejects if cash short at fill; old dollar orders still fill). Sell stepper mirrors buy + Sell-all kept.
* **Review fixes (agent gaps):** description/industry were never selected by `stock()` (page would have shown nothing) — fixed; `symbol-desc` sort fell through to trending — fixed; stepper/select interactivity can't live in server components — extracted to client components; whole-shares guard added; buy-button disable now share-based; removed a noop line in worker fill.
* **Verified:** `npm run build` green (all routes incl. `/trade`, `/trade/[symbol]`); worker `py_compile` clean + 6/6 unit tests pass; forward pricing, 20% cap, settlement, payouts, nav, glass untouched.
* Follow-up: descriptions populate when the worker runs its next cycle (Railway); confirm Vercel build + spot-check a fill.

---

Jackson OpenCode evening 9/17/26 PDT

Removed the 20% per-stock cap + the ~15-share effective limit at Jackson's request (`git pull` already up to date). No destructive ops; no secrets.

* **Rule change:** you can now buy as much as you want as long as you have the money — no per-stock cap and no share-count cap beyond affordability. `POSITION_CAP` stays exported as 1 (no cap) for import compatibility but is no longer enforced; `web/lib/trading/game.js` `tradeLimits()` now caps only on `available = cash - pendingBuys` (`maxShares = floor(available / price)`, `maxBuy = available`), and `placeOrder` no longer rejects on `capRoom`. UI that taught the cap removed: `TierCards.js` pill, `HoldingsCard.js` empty-state "plan on at least 5" text, `daily` placeholder reminder, and the trade-detail hint (now "buy as many as you can afford").
* **Game plan:** `## Trading` in Regular Gameplay Plan rewritten to the new open-trading rule and share-stepper buying.
* **Verified:** `npm run build` green (all routes); worker tests unchanged (payout/ranking, not trading). Follow-up: design/wording around "free trade" to be tuned if needed.

---

Jackson OpenCode evening 9/17/26 PDT

Added live cost + affordability gray-out to the buy widget at Jackson's request. No pull needed (already up to date); no destructive ops; no secrets.

* **Buy widget (`web/components/trade/BuySharesForm.js`, new client component, used in `/trade/[symbol]`):** the same widget as the stepper + order button now shows the live total (`Total ≈ $X for N shares`, updating per tap; button itself reads `Buy N for ≈ $X`). The **+** button grays out the moment another share is unaffordable, and the **buy button** is disabled until the count is ≥1 and affordable — no more tappable-but-doomed orders. Sell stepper unchanged (already capped at held shares).
* **Verified:** `npm run build` green (all routes incl. `/trade/[symbol]`).
* Follow-up: Vercel build check.

---

Jackson OpenCode evening 9/17/26 PDT

League window is now Mon 6:00 AM ET → Sun 7:00 PM ET at Jackson's request (pulled already up to date; no destructive ops; no secrets). You can join and add stocks anytime the window is open — later just means less time to grow.

* **Timing:** `JOINABLE_WEEK` now resolves to this Monday if `now() < Sunday 19:00 ET` else next Monday; `leagues` rows use `starts_at = Monday 06:00 ET` and `ends_at = trading_closes_at = Sunday 19:00 ET` (settlement on `ends_at`). `ENTRY_SELECT` `trading_open` now `status='open' AND now()>=starts_at AND now()<ends_at` and `placeOrder` mirrors that window so buying/selling stays open all week. `worker/schema.sql` comment updated.
* **Docs:** `README` intro + `How a league week works` and `contextHistory` `Weekly Game Loop` / `League Structure` / `Trading` rewritten to Mon 6am–Sun 7pm, always-open trading, and "anytime but less time to grow."
* **Verified:** `npm run build` green (5/5); worker `py_compile` clean + 6/6 tests pass.
* Follow-up: confirm Railway's next league row uses the new window.

---

Jackson OpenCode evening 9/17/26 PDT

Made leagues one-per-tier + always-trade at Jackson's request (git pull already up to date; no destructive ops; no secrets). Interpreted "but you can join a 1k league twice" as a typo for "can't" (you just said "you can only join each league once") — so same-tier re-joins are now rejected.

* **Leagues:** exactly one 1K, one 10K, one 100K per week (`leagues` UNIQUE(tier, week_start) kept). A player may now hold up to 3 entries in one week — one per tier — instead of 1/week. `worker/schema.sql` idempotently swaps `entries` UNIQUE from (user_id, week_start) to (user_id, league_id) via a DO block (drop old if exists, add new if missing) so re-applying is safe; `entries` UNIQUE(user_id, league_id) prevents joining the same tier twice while allowing other tiers.
* **Join:** `web/lib/trading/game.js` `joinLeague` now checks existing entry for that tier's league_id for the joinable week and throws tier-specific `You've already joined the X League this week.`; workers `23505` fallback updated to same message. Added `currentEntries(userId)` and `entriesForWeek(userId, week)` helpers; kept `currentEntry` for compat.
* **Trading whenever:** `ENTRY_SELECT` `trading_open` now `l.status='open' AND now() < l.ends_at` (not `trading_closes_at`), so buy/sell stays open until settlement Monday 00:00 ET. `placeOrder` now looks up all open entries for the user, picks the requested `entryId` or the first open league (fallback to most recent), and enforces `trading_open` on that entry; supports `entryId` param for future multi-league trade forms. No per-stock cap (already removed) — only affordability.
* **Review fixes:** subagent dropped `pastEntries(userId)` (broke 2 pages) — restored; `placeOrder` used `entry.rowLength` (wrong pg field) — fixed to `rowCount` + proper `String(id)` lookup and ordered query; build went from warning to clean.
* **Verified:** `npm run build` green (5/5, warnings gone); worker `py_compile` clean + 6/6 `test_game` pass; forward pricing, payouts, profile still use real data via worker only.
* Follow-up: wire a tier/entry picker into `/trade` + `/` when a player is in >1 league this week (currently trade picks the first open league); update `## Weekly Game Loop` / `## Trading` wording to "always open" in next doc pass; confirm Railway applies the new constraint on next worker start.

---

Jackson OpenCode evening 9/17/26 PDT

Header runner: installed the `running.fbx` model small inside the top bar at Jackson's request. Pulled already up to date; copied `Running.fbx` from Downloads to `web/public/models/running.fbx` (6.3 MB).

* **Runner (`web/components/layout/HeaderRunner.js`, client-only via `next/dynamic` `ssr:false`):** transparent R3F `Canvas` (56×36, `dpr` capped 1–1.5) loads `/models/running.fbx` via `useFBX` + `useAnimations`; run clip plays looped with `AnimationMixer` (falls back to a gentle bob if no clip). Model normalised by bounding box to ~1 unit tall (~26px on screen), facing right (Y +90°). Positioned in a `runner-track` flex strip between StockArena and the money/coin chip; the wrapper `runner-fly` translates left→right over 2.6 s, disappears off the right, waits 2 s hidden, then re-enters from the left and repeats forever; `prefers-reduced-motion` parks it static mid-track. Track is 36px tall, `overflow:hidden`, no layout shift.
* **Header (`web/components/layout/header.js`):** `<HeaderRunner />` inserted between brand and `coin-chip` / Drop-in; brand + chip order unchanged.
* **Styling (`web/app/globals.css`):** `.runner-track` / `.runner-fly` added; header glass unchanged. 3D stack now installed (`three` + `@react-three/fiber` + `@react-three/drei`, `--legacy-peer-deps` for React 19).
* **Verified:** `npm run build` green (5/5, all routes); model loads from `/models/running.fbx`.
* Follow-up: tune run speed/scale if Jackson wants, and confirm on a phone viewport that the runner never collides with long player names.

---

Jackson OpenCode evening 9/17/26 PDT

Fixed the invisible header runner at Jackson's request ("don't see the model running"). Root-caused with Playwright against local dev + Node inspection of the FBX — two stacked bugs, both in framing/materials, loop was always fine.

* **Bug 1 (fatal — nothing rasterised):** the file's `world` group scales the mesh ~100x, so raw-geometry normalisation left the camera buried *inside* the model (backfaces culled → 0 lit pixels; verified via canvas pixel probe). Fix: `HeaderRunner.js` now divides by the mesh's world scale too (`setFromMatrixScale`), landing the runner ~1 unit tall in view (bumped 1.25x for legibility, ~30px in the 36px track). Also replaced `Box3.setFromObject` (uninitialised skinned bone matrices inflate it ~100x the other way) with a raw-geometry union; bind pose is vertically centred so Y stays 0.
* **Bug 2 (visual — black on dark green):** the FBX references converter-absolute texture paths (`/var/www/miconvertv2/...`, 404) so materials stayed unlit black. Fix: drop maps at load for a flat kit, keep authored colours (#cccccc grey reads on the dark header).
* **Verified with my own eyes:** Playwright screenshots show the grey runner at two different track positions (traversal + 2.6 s run / 2 s gap loop confirmed alive via flyer transform reads); `npm run build` green (5/5). Console shows only the harmless texture 404 + a local-only DB ECONNREFUSED from device resume (no local Postgres — production unaffected). Scratch inspect scripts and dev log removed, dev server stopped.
* Follow-up: first load takes a few seconds (6.3 MB model fetch + 439k-vert parse) — consider a tiny loading shimmer in the track if it feels empty; confirm on Vercel + phone viewport.

---

Jackson OpenCode evening 9/17/26 PDT

Rebuilt `HeaderRunner.js` for the Mixamo bull (Jackson confirmed: bull + Mixamo run clip, model must not be replaced). New root cause found via in-browser diagnostics — the Mixamo clip carries **root motion**, which outranks the earlier framing theories.

* **Inspection (logged, not assumed):** `fbx.animations` = 1 clip, `mixamo.com`, 0.70 s, 29 tracks, bones `mixamorig*` (matches the hierarchy, so `useAnimations` resolves tracks against the fbx descendants — clip never assumed on the outer group). Pre-fix posed bounds measured **center x=+94** — the Hips position track sprints the rig forward, so the bull shot off-frame in <1 s and snapped back every 0.7 s loop: effectively invisible, which is exactly what Jackson saw.
* **Fix:** pin `mixamorigHips.position` X/Z to first-keyframe values before playing (Y bob kept, legs/arms untouched); post-pin bounds recentered to x≈7 (stride residual only). Clip plays looped via `AnimationMixer`, updated every frame in `useFrame`. Auto-fit now measures the posed box at frame 12 (bones initialised by then) and scales/centers once; `console.log` reports meshes, clip names/durations/tracks, posed size/center, and final scale.
* **No silent failures:** `console.error` if zero clips, if the clip's action is missing, if bounds are empty/degenerate, and a `RunnerErrorBoundary` reports load/parse failures for `/models/running.fbx`. No bob fallback anymore — the real clip plays or an error says why.
* **Verified:** temporarily enlarged to a 320×180 canvas — screenshot shows the white-grey bull clearly mid-track; then `DEBUG=false` back to the 56×36 slot and re-verified with a production-size screenshot (small bull visible just right of STOCK ARENA). `npm run build` green (5/5). Dev server stopped, scratch files removed.
* Follow-up: same as before — 6.3 MB first-load cost; confirm on Vercel + phone.

---

Jackson OpenCode evening 9/17/26 PDT

Runner polish at Jackson's request: bull ~17% larger, 0.75x gait, map preserved, same model/animation, traversal untouched.

* **Size:** `FIT_H` 1.0 → 1.175 — auto-fit keeps the whole bull centered/visible in the 56×36 slot (verified in screenshot).
* **Speed:** `action.timeScale = 0.75` on the looped `mixamo.com` clip (logged); clip bytes untouched; header traversal (2.6 s run / 2 s gap) unchanged.
* **Materials:** removed all `material.map = null` code — the FBX map slot is preserved verbatim. Forensics: the slot references converter-absolute `/var/www/miconvertv2/.../Image_0` (Video node, no extension, no embedded pixels — binary scan found no PNG/JPEG; sibling Copilot3D FBX and Downloads hold no UV texture either). A `DefaultLoadingManager.setURLModifier` remaps that path to local `web/public/models/textures/packed/Image_0` (proven firing via remap log + network tab). Tested the only local candidate (`BCO.*.png` — a T-pose preview render, not a UV map) — wrong pixels for the file's UVs, so it was NOT shipped; the slot stays clean for the real export.
* **Verified:** `npm run build` green (5/5); production-mode screenshot shows the bull visible mid-track at the new size, looping. No `map = null` anywhere in the component.
* Follow-up: to get the painted (brown/green) bull, export the texture with the FBX from Copilot3D/Mixamo and drop it at `web/public/models/textures/packed/Image_0` — no code change needed, the remap picks it up automatically. Confirm on Vercel.

---

Jackson OpenCode evening 9/17/26 PDT

Runner texture breakthrough at Jackson's request ("can't see it running… with color and texture"). An explore agent independently corroborated the diagnosis (map kept + missing file = black bull; error boundary never fires on texture 404 since useFBX resolves at FBX parse).

* **The `BCO.*.png` IS the texture after all:** the mesh was generated from that exact image (image-to-3D), so its UVs sample it meaningfully — not garbage. Shipped it as `web/public/models/textures/packed/Image_0` (731 KB, copied from Downloads, exact name the remap targets). Production test: FBX 200 → texture 200 (clean URL, no suffix — the `:0` in dev logs was Chromium's `url:line` error formatting, not part of the filename), and the header screenshot shows a BROWN/GREEN bull mid-track instead of black/grey.
* **Kept:** same `running.fbx`, same `mixamo.com` clip at 0.75x, 17% larger fit, map slot preserved (no nulling), traversal untouched. No code changes needed for the texture — the committed remap picked it up automatically.
* **Verified:** production `npm run build` + `npm run start` locally, network tab confirms both files 200, screenshot confirms colored running bull. Dev-server lesson relearned: never delete `.next` under a running server (causes `./331.js` rot); restart cleanly instead.
* Follow-up: confirm on Vercel (public/ ships the texture automatically); if Jackson exports a higher-res UV map later, overwrite the same path.

---
