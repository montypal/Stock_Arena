import Icon from '../layout/icons';
import SubmitButton from '../layout/SubmitButton';
import { join } from '../../lib/actions';
import { POSITION_CAP, ROOM_CAPACITY, TIERS, WIN_COINS } from '../../lib/trading/game';
import { money, weekLabel, weekRange } from '../../lib/utils/format';

// The three weekly leagues a player can join, one glass card per tier.
//
// week  - the league week's Monday ('YYYY-MM-DD'), from joinableWeek()
// live  - true once that week has started (weekHasStarted(week))
// level - heading level for the card titles (2 on their own, 3 when the
//         cards sit under a section heading)
//
// Each card posts its tier to the `join` server action, which places the
// player in a room of real players for that week. The submit button shows a
// spinner and "Joining…" while that runs, and can't be pressed twice.
export default function TierCards({ week, live, level = 2 }) {
  const Title = level === 3 ? 'h3' : 'h2';
  const cap = Math.round(POSITION_CAP * 100);
  const range = weekRange(week);

  return (
    <div className="battle-tiers">
      {TIERS.map((t) => {
        const start = money(t.tier).replace(/\.00$/, '');
        return (
          <article key={t.tier} className="card battle-tier">
            <div className="battle-tier-top">
              <span className="battle-medal" aria-hidden="true">
                {t.medal}
              </span>
              <Title className="battle-tier-title">{`$${t.label}`}</Title>
              <span className="pill blue battle-tier-pill">Weekly</span>
              <p className="battle-tier-blurb">{t.blurb}</p>
            </div>

            <ul className="battle-tier-meta">
              <li className={live ? 'battle-meta-live' : undefined}>
                <Icon name="clock" size={16} strokeWidth={2} />
                {live ? 'Live now' : `Opens ${weekLabel(week)}`}
              </li>
              <li className="gold">
                <Icon name="trophy" size={16} strokeWidth={2} />
                1st place wins {(WIN_COINS * t.multiplier).toLocaleString('en-US')} coins
              </li>
              <li className="prize-breakdown">
                <Icon name="chart" size={16} strokeWidth={2} />
                2nd {(350 * t.multiplier)} · 3rd {(250 * t.multiplier)} · top half {(100 * t.multiplier)} · finish {(50 * t.multiplier)} coins
              </li>
              <li className="free-entry">
                <Icon name="zap" size={16} strokeWidth={2} />
                Free to join — no coins to enter
              </li>
            </ul>

            <div className="panel battle-how">
              <div className="battle-how-head">
                <p className="eyebrow">How it works</p>
                <span className="pill battle-cap">{cap}% cap per stock</span>
              </div>
              <ul className="battle-how-list">
                <li>
                  <Icon name="shuffle" size={18} strokeWidth={2} />
                  <span>Get placed in a room of up to {ROOM_CAPACITY} players</span>
                </li>
                <li>
                  <Icon name="chart" size={18} strokeWidth={2} />
                  <span>Trade real stocks with {start} in play money</span>
                </li>
                <li>
                  <Icon name="trophy" size={18} strokeWidth={2} />
                  <span>Best portfolio when the week ends wins</span>
                </li>
              </ul>
            </div>

            <form action={join} className="battle-join">
              <input type="hidden" name="tier" value={t.tier} />
              {/* The tier name is screen-reader text inside the label (not an
                  aria-label) so "Joining…" is what gets read while pending. */}
              <SubmitButton className="btn blue block" pendingLabel="Joining…">
                Join · {range}
                <span className="battle-sr">{`, $${t.label}`}</span>
              </SubmitButton>
            </form>
          </article>
        );
      })}
    </div>
  );
}
