"""Tests for the pure game rules. Run with: python -m unittest test_game"""

import unittest
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from game import coin_payout, rank_room


class CoinPayoutTest(unittest.TestCase):
    def test_podium(self):
        self.assertEqual(coin_payout(1, 30, 1000, True), 500)
        self.assertEqual(coin_payout(2, 30, 1000, True), 350)
        self.assertEqual(coin_payout(3, 30, 1000, True), 250)

    def test_top_half_and_rest(self):
        self.assertEqual(coin_payout(15, 30, 1000, True), 100)
        self.assertEqual(coin_payout(16, 30, 1000, True), 50)
        self.assertEqual(coin_payout(30, 30, 1000, True), 50)

    def test_odd_room_rounds_top_half_down(self):
        self.assertEqual(coin_payout(3, 7, 1000, True), 250)  # podium wins over top half
        self.assertEqual(coin_payout(4, 9, 1000, True), 100)
        self.assertEqual(coin_payout(4, 7, 1000, True), 50)

    def test_tier_multiplier(self):
        self.assertEqual(coin_payout(1, 30, 10000, True), 1000)
        self.assertEqual(coin_payout(1, 30, 100000, True), 2000)
        self.assertEqual(coin_payout(20, 30, 100000, True), 200)

    def test_no_trades_no_coins(self):
        self.assertEqual(coin_payout(1, 30, 100000, False), 0)


class RankRoomTest(unittest.TestCase):
    def test_orders_by_value_then_join_time_then_id(self):
        t = datetime(2026, 9, 14, tzinfo=timezone.utc)
        rows = [
            {"entry_id": 1, "value": Decimal("1000"), "joined_at": t},
            {"entry_id": 2, "value": Decimal("1200"), "joined_at": t},
            {"entry_id": 3, "value": Decimal("1000"), "joined_at": t - timedelta(hours=1)},
            {"entry_id": 4, "value": Decimal("1000"), "joined_at": t},
        ]
        self.assertEqual([r["entry_id"] for r in rank_room(rows)], [2, 3, 1, 4])


if __name__ == "__main__":
    unittest.main()
