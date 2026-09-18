import { ProgressBar } from '../layout/ui';
import { marketOpen, tierInfo } from '../../lib/trading/game';
import { money, ordinal, pct, progress, signedMoney, timeUntil, tone, weekLabel } from '../../lib/utils/format';

// The player's league this week: portfolio value, profit, place in the room,
// and how far through the trading week we are. Shared by Home and Battles.
//
// entry   - row from currentEntry()
// summary - result of summarize(entry, holdings)
// place   - 1-based position in the room leaderboard (0 if unknown)
// total   - players in the room
export default function StandingCard({ entry, summary, place, total }) {
  const info = tierInfo(entry.tier);
  const settled = entry.league_status === 'settled';
  const live = entry.trading_open && !entry.not_started && marketOpen();
  const shownPlace = settled && entry.final_rank ? entry.final_rank : place;

  let caption;
  if (settled) {
    caption = `Final · ${ordinal(entry.final_rank)} place · +${Number(entry.coins_awarded ?? 0).toLocaleString()} coins`;
  } else if (entry.not_started) {
    caption = `Starts Monday, ${weekLabel(entry.week_start)} · orders fill at the open`;
  } else if (entry.trading_open) {
    caption = `Trading closes in ${timeUntil(entry.trading_closes_at)}`;
  } else {
    caption = 'Trading closed · final results Monday 12:00 AM ET';
  }

  return (
    <section className="hero-card standing">
      <div className="hero-top">
        <p className="eyebrow">
          {live ? <span className="live-dot" aria-hidden="true" /> : null}
          {info?.label ?? 'League'} · Room {entry.room_number}
        </p>
        {shownPlace ? (
          <span className="pill live">
            #{shownPlace} of {total}
          </span>
        ) : null}
      </div>
      <p className="big-number">{money(summary.value)}</p>
      <p className={`delta ${tone(summary.profit)}`}>
        {signedMoney(summary.profit)} <span>({pct(summary.change)})</span>
      </p>
      <div className="standing-progress">
        <ProgressBar
          value={settled ? 1 : progress(entry.starts_at, entry.trading_closes_at)}
          label="How far through the trading week"
        />
        <p className="caption">{caption}</p>
      </div>
      <dl className="stats">
        <div>
          <dt>Cash</dt>
          <dd>{money(summary.cash)}</dd>
        </div>
        <div>
          <dt>Invested</dt>
          <dd>{money(summary.invested)}</dd>
        </div>
        <div>
          <dt>Week of</dt>
          <dd>{weekLabel(entry.week_start)}</dd>
        </div>
      </dl>
    </section>
  );
}
