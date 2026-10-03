"""Tests for the achievement rules. Run with: python -m unittest test_rewards"""

import unittest
from datetime import date
from decimal import Decimal

import rewards
from rewards import CAREER, WEEKLY, earned_career, earned_weekly, weekly_cash

MON = date(2026, 9, 28)
TUE = date(2026, 9, 29)
WED = date(2026, 9, 30)
THU = date(2026, 10, 1)
FRI = date(2026, 10, 2)
SAT = date(2026, 10, 3)
SUN = date(2026, 10, 4)


def ctx(**over):
    """A weekly context with nothing earned: no holdings, mid-pack, Monday."""
    base = {
        "monday": MON,
        "friday": FRI,
        "today": MON,
        "tier": 1000,
        "starting_balance": Decimal("1000"),
        "value": Decimal("1000"),
        "cash": Decimal("1000"),
        "rank": 10,
        "room_size": 20,
        "positions": [],
        "snapshots": [],
        "gap_above": None,
        "best_symbol": None,
        "first_buy_date": None,
        "friday_order_count": None,
        "traded": False,
        "ending": False,
        "final_rank": None,
    }
    base.update(over)
    return base


def pos(symbol, value, cost):
    return {"symbol": symbol, "shares": 1, "value": Decimal(value), "cost_basis": Decimal(cost)}


def snap(d, value, rank, room=20, awarded="0"):
    return {
        "date": d,
        "value": Decimal(value),
        "rank": rank,
        "room_size": room,
        "awarded": Decimal(awarded),
    }


class AwardScalingTest(unittest.TestCase):
    def test_top_tier_pays_the_spec_number(self):
        self.assertEqual(weekly_cash(250, 100000), Decimal("250.00"))
        self.assertEqual(weekly_cash(1000, 100000), Decimal("1000.00"))

    def test_lower_tiers_pay_the_same_share(self):
        self.assertEqual(weekly_cash(250, 10000), Decimal("25.00"))
        self.assertEqual(weekly_cash(250, 1000), Decimal("2.50"))

    def test_a_full_sweep_is_the_same_percentage_in_every_tier(self):
        total = sum(base for _s, _n, _h, base, _r in WEEKLY)
        for tier in (1000, 10000, 100000):
            share = weekly_cash(total, tier) / Decimal(tier)
            self.assertAlmostEqual(float(share), 0.057, places=4)

    def test_spec_table_amounts(self):
        # Mirrors the table in contextHistory.md and web/lib/rewards/catalog.js.
        self.assertEqual(
            {slug: base for slug, _n, _h, base, _r in WEEKLY},
            {
                "first-buy": 250,
                "diversified": 300,
                "green-open": 250,
                "comeback": 500,
                "big-mover": 500,
                "photo-finish": 400,
                "podium-streak": 750,
                "clean-sweep": 1000,
                "conviction": 1000,
                "closer": 750,
            },
        )
        self.assertEqual(
            {slug: coins for slug, _n, _h, coins, _r, _a in CAREER},
            {
                "first-league": 100,
                "first-win": 500,
                "podium-player": 400,
                "regular": 300,
                "friendly-rival": 400,
                "three-peat": 1000,
                "six-figures": 750,
                "perfect-week": 1500,
            },
        )


class WeeklyRuleTest(unittest.TestCase):
    def test_first_buy_only_on_monday(self):
        self.assertTrue(rewards.first_buy(ctx(first_buy_date=MON)))
        self.assertFalse(rewards.first_buy(ctx(first_buy_date=TUE)))
        self.assertFalse(rewards.first_buy(ctx(first_buy_date=None)))

    def test_diversified_needs_five(self):
        four = [pos(f"S{i}", 10, 10) for i in range(4)]
        self.assertFalse(rewards.diversified(ctx(positions=four)))
        self.assertTrue(rewards.diversified(ctx(positions=four + [pos("S5", 10, 10)])))

    def test_green_open_waits_for_monday_to_end(self):
        up = [snap(MON, "1100", 5)]
        self.assertFalse(rewards.green_open(ctx(today=MON, snapshots=up)))
        self.assertTrue(rewards.green_open(ctx(today=TUE, snapshots=up)))

    def test_green_open_needs_profit(self):
        flat = [snap(MON, "1000", 5)]
        self.assertFalse(rewards.green_open(ctx(today=TUE, snapshots=flat)))

    def test_green_open_ignores_achievement_cash(self):
        # $1,002.50 of which $2.50 was First Buy's payout is not a profit.
        funded = [snap(MON, "1002.50", 5, awarded="2.50")]
        self.assertFalse(rewards.green_open(ctx(today=TUE, snapshots=funded)))
        real = [snap(MON, "1012.50", 5, awarded="2.50")]
        self.assertTrue(rewards.green_open(ctx(today=TUE, snapshots=real)))

    def test_comeback_needs_five_places_in_one_day(self):
        self.assertTrue(
            rewards.comeback(ctx(snapshots=[snap(MON, "1000", 12), snap(TUE, "1100", 7)]))
        )
        self.assertFalse(
            rewards.comeback(ctx(snapshots=[snap(MON, "1000", 12), snap(TUE, "1050", 8)]))
        )

    def test_comeback_ignores_a_gap_in_days(self):
        # Climbing 5 places across a missing day is not "in a day".
        self.assertFalse(
            rewards.comeback(ctx(snapshots=[snap(MON, "1000", 12), snap(WED, "1100", 5)]))
        )

    def test_big_mover_needs_the_stock_held(self):
        held = [pos("NVDA", 100, 90)]
        self.assertTrue(rewards.big_mover(ctx(positions=held, best_symbol="NVDA")))
        self.assertFalse(rewards.big_mover(ctx(positions=held, best_symbol="TSLA")))
        self.assertFalse(rewards.big_mover(ctx(positions=held, best_symbol=None)))

    def test_photo_finish_window(self):
        self.assertTrue(rewards.photo_finish(ctx(traded=True, gap_above=Decimal("99.99"))))
        self.assertTrue(rewards.photo_finish(ctx(traded=True, gap_above=Decimal("0"))))
        self.assertFalse(rewards.photo_finish(ctx(traded=True, gap_above=Decimal("100.01"))))
        self.assertFalse(rewards.photo_finish(ctx(traded=True, gap_above=None)))  # nobody above

    def test_photo_finish_ignores_the_tied_room_at_the_open(self):
        # Before anyone trades every entry sits on the starting balance, so the
        # gap to the player above is exactly 0 for the whole room.
        self.assertFalse(rewards.photo_finish(ctx(traded=False, gap_above=Decimal("0"))))

    def test_podium_streak_needs_three_consecutive_days(self):
        run = [snap(MON, "1", 2), snap(TUE, "1", 1), snap(WED, "1", 3)]
        self.assertTrue(rewards.podium_streak(ctx(snapshots=run)))

    def test_podium_streak_breaks_on_a_bad_day(self):
        broken = [snap(MON, "1", 2), snap(TUE, "1", 9), snap(WED, "1", 3)]
        self.assertFalse(rewards.podium_streak(ctx(snapshots=broken)))

    def test_podium_streak_breaks_on_a_missing_day(self):
        gapped = [snap(MON, "1", 2), snap(TUE, "1", 1), snap(THU, "1", 1)]
        self.assertFalse(rewards.podium_streak(ctx(snapshots=gapped)))

    def test_clean_sweep_needs_two_holdings_all_up(self):
        self.assertFalse(rewards.clean_sweep(ctx(positions=[pos("A", 110, 100)])))
        self.assertTrue(
            rewards.clean_sweep(ctx(positions=[pos("A", 110, 100), pos("B", 101, 100)]))
        )
        self.assertFalse(
            rewards.clean_sweep(ctx(positions=[pos("A", 110, 100), pos("B", 99, 100)]))
        )

    def test_conviction_waits_for_friday_then_needs_no_trades(self):
        held = [pos("A", 100, 100)]
        quiet = dict(positions=held, friday_order_count=0, first_buy_date=MON)
        self.assertFalse(rewards.conviction(ctx(today=FRI, **quiet)))
        self.assertTrue(rewards.conviction(ctx(today=SAT, **quiet)))
        self.assertFalse(
            rewards.conviction(ctx(today=SAT, positions=held, friday_order_count=1, first_buy_date=MON))
        )

    def test_conviction_needs_you_to_have_been_playing(self):
        # Joined on Friday and did nothing: that is not conviction.
        self.assertFalse(
            rewards.conviction(
                ctx(today=SAT, positions=[pos("A", 100, 100)], friday_order_count=0, first_buy_date=FRI)
            )
        )

    def test_closer_compares_to_friday(self):
        snaps = [snap(FRI, "1000", 6)]
        self.assertTrue(rewards.closer(ctx(today=SUN, ending=True, snapshots=snaps, rank=3)))
        self.assertFalse(rewards.closer(ctx(today=SUN, ending=True, snapshots=snaps, rank=6)))

    def test_closer_waits_until_the_league_is_over(self):
        # Briefly ahead on Saturday, or even early Sunday, is not finishing
        # ahead -- only the pass after ends_at sets `ending`.
        snaps = [snap(FRI, "1000", 6)]
        self.assertFalse(rewards.closer(ctx(today=SAT, snapshots=snaps, rank=1)))
        self.assertFalse(rewards.closer(ctx(today=SUN, snapshots=snaps, rank=1)))

    def test_closer_needs_a_friday_to_compare_with(self):
        self.assertFalse(rewards.closer(ctx(today=SUN, ending=True, snapshots=[], rank=1)))

    def test_closer_prefers_the_final_rank(self):
        snaps = [snap(FRI, "1000", 6)]
        self.assertTrue(
            rewards.closer(ctx(today=SUN, ending=True, snapshots=snaps, rank=9, final_rank=2))
        )


class EarnedWeeklyTest(unittest.TestCase):
    def test_pays_each_slug_once(self):
        c = ctx(traded=True, first_buy_date=MON, positions=[pos("A", 110, 100), pos("B", 110, 100)])
        got = dict(earned_weekly(c))
        self.assertEqual(got["first-buy"], Decimal("2.50"))
        self.assertEqual(got["clean-sweep"], Decimal("10.00"))
        again = dict(earned_weekly(c, already=got.keys()))
        self.assertEqual(again, {})

    def test_scales_to_the_entry_tier(self):
        c = ctx(traded=True, tier=100000, starting_balance=Decimal("100000"), first_buy_date=MON)
        self.assertEqual(dict(earned_weekly(c))["first-buy"], Decimal("250.00"))

    def test_nothing_for_a_player_who_has_not_played(self):
        self.assertEqual(earned_weekly(ctx()), [])

    def test_a_non_trader_earns_nothing_even_when_a_rule_is_satisfied(self):
        # Climbing six places on Tuesday because other portfolios fell, while
        # never having bought anything.
        drifted = ctx(
            traded=False,
            snapshots=[snap(MON, "1000", 12), snap(TUE, "1000", 6)],
        )
        self.assertTrue(rewards.comeback(drifted))  # the rule itself is true
        self.assertEqual(earned_weekly(drifted), [])  # but nothing is paid


class CareerRuleTest(unittest.TestCase):
    def career(self, **over):
        base = {
            "settled": 0,
            "wins": 0,
            "podiums": 0,
            "career_profit": Decimal("0"),
            "winning_weeks": [],
            "perfect_week": False,
        }
        base.update(over)
        return base

    def test_counting_rules(self):
        self.assertTrue(rewards.first_league(self.career(settled=1)))
        self.assertTrue(rewards.first_win(self.career(wins=1)))
        self.assertTrue(rewards.podium_player(self.career(podiums=5)))
        self.assertFalse(rewards.podium_player(self.career(podiums=4)))
        self.assertTrue(rewards.regular(self.career(settled=10)))
        self.assertFalse(rewards.regular(self.career(settled=9)))

    def test_six_figures(self):
        self.assertTrue(rewards.six_figures(self.career(career_profit=Decimal("100000"))))
        self.assertFalse(rewards.six_figures(self.career(career_profit=Decimal("99999.99"))))

    def test_three_peat_needs_consecutive_weeks(self):
        w = [date(2026, 9, 7), date(2026, 9, 14), date(2026, 9, 21)]
        self.assertTrue(rewards.three_peat(self.career(winning_weeks=w)))
        skipped = [date(2026, 9, 7), date(2026, 9, 14), date(2026, 9, 28)]
        self.assertFalse(rewards.three_peat(self.career(winning_weeks=skipped)))

    def test_three_peat_ignores_duplicates(self):
        dupes = [date(2026, 9, 7), date(2026, 9, 7), date(2026, 9, 14)]
        self.assertFalse(rewards.three_peat(self.career(winning_weeks=dupes)))

    def test_friendly_rival_is_unreachable_until_private_leagues_exist(self):
        self.assertFalse(rewards.friendly_rival(self.career(wins=99)))
        self.assertNotIn("friendly-rival", dict(earned_career(self.career(wins=99, settled=99))))

    def test_earned_career_pays_once(self):
        c = self.career(settled=1, wins=1)
        got = dict(earned_career(c))
        self.assertEqual(got, {"first-league": 100, "first-win": 500})
        self.assertEqual(earned_career(c, already=got.keys()), [])


if __name__ == "__main__":
    unittest.main()
