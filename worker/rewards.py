"""
Achievement rules: the pure half of the reward system.

The spec lives in contextHistory.md ("Achievements"). Two kinds, and they
never mix (see "The Two Currencies"):

  * weekly  -> pays LEAGUE CASH into the entry that earned it
  * career  -> pays COINS to the player's profile

Everything here is a pure function over plain dicts, so the rules can be
unit-tested without a database (python -m unittest test_rewards). The SQL that
builds those dicts, and the writes that pay out, live in game.py -- the worker
stays the single author of anything that moves money.

Mirrored for display by web/lib/rewards/catalog.js. The two tables must agree;
test_rewards.py asserts the numbers on this side.
"""

from decimal import Decimal

# The spec writes each award as a flat dollar amount. Those amounts only
# balance against a 100K portfolio: all ten together are $5,700, which is 5.7%
# of a $100,000 start -- a real catch-up boost next to a market that moves a
# few percent a week -- but 570% of a $1,000 start, which would make stock
# picking pointless in the 1K league. So the table is read as 100K-league
# dollars and paid as the same share of whatever you started with: every tier
# gets 5.7% of its starting cash from a full sweep.
#
# To pay the spec's flat amounts in every league instead, return Decimal(base).
# Mirrored by weeklyCash() in web/lib/rewards/catalog.js.
CALIBRATION_TIER = Decimal(100000)


def weekly_cash(base, tier):
    """League cash an achievement pays in `tier`, from its 100K-league `base`."""
    return (Decimal(base) * Decimal(int(tier)) / CALIBRATION_TIER).quantize(Decimal("0.01"))


def _held(ctx):
    return ctx.get("positions") or []


def _symbols(ctx):
    return {p["symbol"] for p in _held(ctx)}


def _snaps(ctx):
    """Daily snapshots, oldest first."""
    return sorted(ctx.get("snapshots") or [], key=lambda s: s["date"])


def _day_after(a, b):
    """True when `b` is the calendar day right after `a`."""
    return (b - a).days == 1


# ----------------------------------------------------------- weekly rules
# Each takes the entry context and answers "is this earned right now?".
# They are evaluated every worker cycle, so a condition that is only true for
# a moment (Photo Finish, Clean Sweep) still pays the first time it is seen.


def first_buy(ctx):
    """Build your portfolio on Monday."""
    d = ctx.get("first_buy_date")
    return d is not None and d == ctx["monday"]


def diversified(ctx):
    """Hold five or more different stocks."""
    return len(_held(ctx)) >= 5


def green_open(ctx):
    """Finish Monday in profit. Judged on Monday's closing snapshot.

    Achievement cash is already inside the snapshot value (it is paid into
    entries.cash), so it is subtracted here: otherwise First Buy's own payout
    put the player "in profit" on Monday and this paid out for free.
    """
    if ctx["today"] <= ctx["monday"]:
        return False  # Monday is not over yet
    for s in _snaps(ctx):
        if s["date"] == ctx["monday"]:
            traded_value = Decimal(s["value"]) - Decimal(s.get("awarded") or 0)
            return traded_value > ctx["starting_balance"]
    return False


def comeback(ctx):
    """Climb five or more places in a day."""
    snaps = _snaps(ctx)
    for prev, cur in zip(snaps, snaps[1:]):
        if _day_after(prev["date"], cur["date"]) and prev["rank"] - cur["rank"] >= 5:
            return True
    return False


def big_mover(ctx):
    """Own the league's best stock on any day."""
    best = ctx.get("best_symbol")
    return best is not None and best in _symbols(ctx)


def photo_finish(ctx):
    """Sit within $100 of the player above you.

    Needs a trade first. At the open every entry in a room is tied at the
    starting balance, so the gap is exactly 0 for everyone below first place
    and this would pay the whole room before anyone had played.
    """
    gap = ctx.get("gap_above")
    if gap is None or not ctx.get("traded"):
        return False
    return Decimal(0) <= gap <= Decimal(100)


def podium_streak(ctx):
    """Hold top three for three days running."""
    snaps = [s for s in _snaps(ctx)]
    run = 0
    prev_date = None
    for s in snaps:
        on_podium = s["rank"] <= 3
        if on_podium and (prev_date is None or _day_after(prev_date, s["date"])):
            run += 1
        elif on_podium:
            run = 1  # podium again, but the days are not consecutive
        else:
            run = 0
        prev_date = s["date"]
        if run >= 3:
            return True
    return False


def clean_sweep(ctx):
    """Every stock up at the same time.

    Needs at least two holdings -- a single stock in profit is not a sweep.
    """
    held = _held(ctx)
    if len(held) < 2:
        return False
    return all(p["value"] > p["cost_basis"] for p in held)


def conviction(ctx):
    """Make no changes at the Friday trade: hold through Friday without trading."""
    if ctx["today"] <= ctx["friday"]:
        return False  # Friday is not over yet
    if ctx.get("friday_order_count") is None:
        return False
    if not _held(ctx):
        return False
    # You have to have been playing before Friday for holding to mean anything.
    first = ctx.get("first_buy_date")
    return ctx["friday_order_count"] == 0 and first is not None and first < ctx["friday"]


def closer(ctx):
    """Finish higher than you were on Friday.

    Only decided once the league is over -- ctx["ending"] is set on the pass
    that runs after ends_at, just before settlement, when the live order is
    the finishing order. Judged any earlier it paid the first time a player
    was briefly above their Friday place, which they could then lose again
    before the week actually ended.
    """
    if not ctx.get("ending"):
        return False
    friday_rank = None
    for s in _snaps(ctx):
        if s["date"] == ctx["friday"]:
            friday_rank = s["rank"]
    if friday_rank is None:
        return False
    now_rank = ctx.get("final_rank") or ctx.get("rank")
    return now_rank is not None and now_rank < friday_rank


# slug, name, what the player is told, 1K-league award, rule
WEEKLY = [
    ("first-buy", "First Buy", "Build your portfolio on Monday", 250, first_buy),
    ("diversified", "Diversified", "Hold five or more different stocks", 300, diversified),
    ("green-open", "Green Open", "Finish Monday in profit", 250, green_open),
    ("comeback", "Comeback", "Climb five or more places in a day", 500, comeback),
    ("big-mover", "Big Mover", "Own the league's best stock on any day", 500, big_mover),
    ("photo-finish", "Photo Finish", "Sit within $100 of the player above", 400, photo_finish),
    ("podium-streak", "Podium Streak", "Hold top three for three days running", 750, podium_streak),
    ("clean-sweep", "Clean Sweep", "Every stock up at the same time", 1000, clean_sweep),
    ("conviction", "Conviction", "Make no changes at the Friday trade", 1000, conviction),
    ("closer", "Closer", "Finish higher than you were on Friday", 750, closer),
]


def earned_weekly(ctx, already=()):
    """[(slug, cash)] for every weekly achievement newly earned in this entry.

    Nothing pays until the player has actually traded. The placement payout
    takes the same line (coin_payout in game.py), and several of these rules
    can otherwise come true by standing still: a player who never buys keeps
    their starting balance and climbs the room as other portfolios fall, which
    would hand them Comeback, Podium Streak and Closer for doing nothing.
    """
    if not ctx.get("traded"):
        return []
    have = set(already)
    out = []
    for slug, _name, _how, base, rule in WEEKLY:
        if slug in have:
            continue
        if rule(ctx):
            out.append((slug, weekly_cash(base, ctx["tier"])))
    return out


# ----------------------------------------------------------- career rules
# Judged on settled leagues only, so a week in progress can't pay twice.


def first_league(ctx):
    """Finish a full league."""
    return ctx["settled"] >= 1


def first_win(ctx):
    """Win a league."""
    return ctx["wins"] >= 1


def podium_player(ctx):
    """Finish top three five times."""
    return ctx["podiums"] >= 5


def regular(ctx):
    """Play ten leagues."""
    return ctx["settled"] >= 10


def friendly_rival(ctx):
    """Win a private league. Private leagues do not exist yet, so this one
    cannot be earned; the UI shows it as waiting on that feature rather than
    pretending it is reachable."""
    return False


def three_peat(ctx):
    """Win three weeks in a row."""
    weeks = sorted(set(ctx.get("winning_weeks") or []))
    run = 1
    for prev, cur in zip(weeks, weeks[1:]):
        run = run + 1 if (cur - prev).days == 7 else 1
        if run >= 3:
            return True
    return False


def six_figures(ctx):
    """Reach $100,000 career profit."""
    return Decimal(ctx.get("career_profit") or 0) >= Decimal(100000)


def perfect_week(ctx):
    """Hold first every day of a league."""
    return bool(ctx.get("perfect_week"))


CAREER = [
    ("first-league", "First League", "Finish a full league", 100, first_league, True),
    ("first-win", "First Win", "Win a league", 500, first_win, True),
    ("podium-player", "Podium Player", "Finish top three five times", 400, podium_player, True),
    ("regular", "Regular", "Play ten leagues", 300, regular, True),
    ("friendly-rival", "Friendly Rival", "Win a private league", 400, friendly_rival, False),
    ("three-peat", "Three-Peat", "Win three weeks in a row", 1000, three_peat, True),
    ("six-figures", "Six Figures", "Reach $100,000 career profit", 750, six_figures, True),
    ("perfect-week", "Perfect Week", "Hold first every day of a league", 1500, perfect_week, True),
]


def earned_career(ctx, already=()):
    """[(slug, coins)] for every career achievement newly earned by a player."""
    have = set(already)
    out = []
    for slug, _name, _how, coins, rule, available in CAREER:
        if slug in have or not available:
            continue
        if rule(ctx):
            out.append((slug, coins))
    return out
