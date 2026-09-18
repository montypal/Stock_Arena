import Link from 'next/link';
import Icon from '../layout/icons';
import { weekLabel, weekRange } from '../../lib/utils/format';

// Points the player at the Battles tab when they can join a league: either
// they have never joined one, or their latest league is behind the week that
// is open for joining now.
//
// week  - joinableWeek(), the Monday a player joining now lands in
// entry - the player's latest entry (currentEntry()), or null
export default function FindBattleCard({ week, entry }) {
  let title;
  let body;
  if (!entry) {
    title = 'No league yet';
    body = `Join a league to get your play money and start picking stocks. Leagues for ${weekRange(week)} are open now.`;
  } else {
    title = 'Leagues are open';
    const status =
      entry.league_status === 'settled'
        ? 'Your last league is final.'
        : 'Trading has closed in your league.';
    body = `${status} Join one for ${weekRange(week)} to keep playing.`;
  }

  return (
    <section className="card home-cta" aria-labelledby="home-cta-title">
      <div className="card-head">
        <h2 id="home-cta-title">{title}</h2>
        <span className="pill blue">Week of {weekLabel(week)}</span>
      </div>
      <p className="muted">{body}</p>
      <Link href="/league" className="btn primary block">
        <Icon name="battles" size={20} strokeWidth={2} />
        Find a battle
      </Link>
    </section>
  );
}
