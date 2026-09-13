# StockArena — Regular Gameplay Plan

Gameplay plan. Architecture, constraints, and the shared change log live in
`contextHistory.md` at the repo root.

## 1. Core Concept

StockArena is a weekly stock-picking competition where players compete against
other players by investing fake money into real stocks.

Each league lasts one full week, from Monday through Sunday.

Players receive a set amount of virtual money when they join a league. They use
that money to buy stocks and build their portfolio. As the real stock market
moves throughout the week, the value of their portfolio changes.

Players also earn achievements during the week. Achievements pay out additional
virtual money directly into their portfolio, giving players a second way to grow
their balance beyond the market itself.

At the end of Sunday, the player whose portfolio has made the most money wins the
league.

## 2. Joining a League

**Random League** — join an automatically created league against randomly
selected players.

**Private League** — create or join a league with friends. Private leagues can
set their own name, players, starting balance, weekly schedule, and whether
achievements are on.

## 3. Weekly Game Loop

**Monday — League Begins.** Players receive their starting balance, which varies
by league (Bronze $10,000 · Silver $25,000 · Gold $50,000 · higher leagues more).
They buy stocks, which then move with the real market. The first achievements
become available immediately.

**Tuesday–Thursday — Watch Your Portfolio.** Players monitor portfolio value,
profit and loss, individual stock performance, league position, and distance from
the players above and below. Achievements unlock through these days based on
performance, paying cash into the available balance.

**Friday — Final Trade Opportunity.** One last chance to sell and rebuy.
Achievement money earned during the week is available to spend. After this trade
the portfolio is locked.

**Saturday–Sunday — Final Stretch.** No trading. Achievements can still be
earned, since they depend on performance and position rather than trading.

**Sunday — League Ends.** Final portfolio value is calculated including all
achievement money. Most profit wins.

## 4. League Structure

Every league has a fixed starting balance, a Monday start, a Sunday end, a player
group, a leaderboard, real prices, fake money, one Friday trade, a shared
achievement set, and a winner.

## 5. Leaderboard

Ranked by money made. Achievement money counts toward the total, so a player
behind on the market can still climb by earning more achievements than the people
around them.

Notifications fire when a player takes first, gets passed, enters the top three,
comes close to overtaking someone, earns an achievement, is near completing one,
or when the league is about to end.

## 6. Portfolio

Shows total value, starting balance, total profit and loss, stocks owned, amount
invested per stock, current value per position, per-stock profit and loss,
available cash, and achievement money earned this week. Tapping a stock shows its
performance during the competition.

## 7. Trading

Deliberately limited. Free choice of stocks on Monday, then one final trade on
Friday, then locked. The Friday trade is the week's major strategic moment:
"stay with what got me here, or make one last move?"

## 8. Achievements

Challenges completed during a league that pay virtual money. They give players
something to chase when the market is quiet, and give players who are behind a
way to catch up.

Every achievement is available to every player in the league. Nobody starts with
an advantage — achievements are earned during the week, not unlocked beforehand.

### Weekly achievements — pay into the current league

| Achievement | Condition | Award |
|---|---|---|
| First Buy | Build your portfolio on Monday | +$250 |
| Diversified | Hold five or more different stocks | +$300 |
| Green Open | Finish Monday in profit | +$250 |
| Comeback | Climb five or more places in a day | +$500 |
| Big Mover | Own the league's best stock on any day | +$500 |
| Photo Finish | Sit within $100 of the player above | +$400 |
| Podium Streak | Hold top three for three days running | +$750 |
| Clean Sweep | Every stock up at the same time | +$1,000 |
| Conviction | Make no changes at the Friday trade | +$1,000 |
| Closer | Finish higher than you were on Friday | +$750 |

### Career achievements — pay coins to the profile

| Achievement | Condition | Award |
|---|---|---|
| First League | Finish a full league | 100 |
| First Win | Win a league | 500 |
| Podium Player | Finish top three five times | 400 |
| Regular | Play ten leagues | 300 |
| Friendly Rival | Win a private league | 400 |
| Three-Peat | Win three weeks in a row | 1,000 |
| Six Figures | Reach $100,000 career profit | 750 |
| Perfect Week | Hold first every day of a league | 1,500 |

### Coins

Separate from league money and never spendable inside a league. Used to unlock
higher leagues, create additional private leagues, and customize a profile.

Weekly achievements help you win the week you are playing. Career achievements
build the profile over time. Keeping them separate is what stops veterans from
starting each week richer than new players.

## 9. League Types

Standard, Private, Higher-Level (unlocked with coins, larger balances), and
Special (limited-time, own stock pools or achievement sets).

## 10. Progression

A long-term profile tracking leagues played, leagues won, podium finishes, total
simulated profit, best weekly performance, win rate, career earnings,
best-performing stocks, achievements unlocked, coins earned, and current rank.

## 11. Core Gameplay Philosophy

- **Monday:** Build your portfolio.
- **Tuesday–Thursday:** Watch, strategize, chase achievements.
- **Friday:** Make your final trade.
- **Saturday–Sunday:** Hold and fight for the lead.
- **Sunday:** Most profit wins.

The excitement comes from watching the leaderboard change, earning achievements
that push you up it, and deciding whether to hold your strategy or make a final
move before the Friday lock.
