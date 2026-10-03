import Link from 'next/link';
import { requireUser } from '../../../lib/db/auth';
import { careerStats, pastEntries, tierInfo } from '../../../lib/trading/game';
import { BUDDIES, buddyState } from '../../../lib/rewards/buddies';
import { boardTotals, careerBoard } from '../../../lib/rewards/catalog';
import { userAchievements } from '../../../lib/rewards/read';
import { buyBuddy, pickBuddy } from '../../../lib/actions';
import { money, ordinal, signedMoney, tone, weekLabel } from '../../../lib/utils/format';
import { Flash, PageHead } from '../../../components/layout/ui';
import SubmitButton from '../../../components/layout/SubmitButton';
import CoinsCard from '../../../components/profile/CoinsCard';
import ForgetDevice from '../../../components/auth/ForgetDevice';

// How a league week actually runs. Every line here is a rule the code
// enforces -- the card this feeds used to claim a Friday 4:00 PM trading
// close and queued orders, neither of which exists.
const WEEK_FACTS = [
  { title: 'Leagues open Monday 7:00 AM ET', sub: 'One 1K, one 10K and one 100K league a week. You can be in all three.' },
  { title: 'Buy and sell all week', sub: 'Trading stays open until Sunday 7:00 PM ET — no Friday lock, no blackout.' },
  { title: 'Orders go through immediately', sub: 'You get the live price at the moment the server fills it, not a queue.' },
  { title: 'Sunday 7:00 PM ET settles the week', sub: 'Best portfolio wins. Your finishing place pays coins; achievements pay league cash.' },
];

// Colour for a finishing place: gold / silver / bronze for the podium.
function placeTone(rank) {
  return rank === 1 ? 'p1' : rank === 2 ? 'p2' : rank === 3 ? 'p3' : '';
}

export default async function ProfilePage({ searchParams }) {
  const sp = await searchParams;
  const user = await requireUser();
  const [history, career, buddies, earnedCareer] = await Promise.all([
    pastEntries(user.id),
    careerStats(user.id),
    buddyState(user.id),
    userAchievements(user.id),
  ]);
  // The real career achievements, the same eight the worker pays coins for.
  // This card used to show eight invented badges ("Champion", "Coin earner",
  // ...) that paid nothing and matched nothing in the game.
  const board = careerBoard(earnedCareer);
  const totals = boardTotals(board, 'coins');

  // The stats row shows full career totals (same source as Progress);
  // pastEntries() above only covers the latest 20 settled leagues.
  const careerPlayed = Number(career.played) || 0;
  const careerWins = Number(career.wins) || 0;
  const careerPodiums = Number(career.podiums) || 0;

  return (
    <main className="acct-profile">
      <PageHead eyebrow="Profile" title={user.display_name} />
      <Flash sp={sp} />

      <div className="split">
        <div className="col acct-profile-main">
          {/* The career board itself lives on Progress; this is the summary,
              built from the same catalogue and the same paid rows, so the two
              screens can never disagree. */}
          <section className="card acct-ach-card">
            <div className="card-head">
              <h2>Career achievements</h2>
              <span className="caption">
                {totals.count} of {totals.of} earned
              </span>
            </div>
            <ul className="acct-ach-grid">
              {board.map((a) => (
                <li
                  key={a.slug}
                  className={a.earned ? 'acct-ach is-on' : 'acct-ach is-off'}
                  title={a.how}
                >
                  <span className="acct-ach-text">
                    <span className="acct-ach-label">{a.name}</span>
                    <span className="acct-ach-state">
                      {a.earned
                        ? `+${a.coins.toLocaleString()} coins`
                        : a.waiting
                          ? `Waiting on ${a.waiting}`
                          : `${a.coins.toLocaleString()} coins`}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <Link href="/progress" className="btn small outline">
              See how each one is earned
            </Link>
          </section>

          <section className="card acct-history-card">
            <div className="card-head">
              <h2>Past leagues</h2>
              {history.length ? (
                <span className="caption">
                  {careerPlayed > history.length
                    ? `Latest ${history.length} of ${careerPlayed}`
                    : `${history.length} ${history.length === 1 ? 'league' : 'leagues'}`}
                </span>
              ) : null}
            </div>
            {history.length === 0 ? (
              <p className="empty">Your results show up here after your first league ends.</p>
            ) : (
              <ul className="acct-list">
                {history.map((e) => {
                  const profit = Number(e.final_value) - Number(e.starting_balance);
                  return (
                    <li key={e.id} className="row">
                      <span className="row-main">
                        <strong className={`place ${placeTone(e.final_rank)}`}>
                          {e.final_rank ? ordinal(e.final_rank) : '—'} of {e.room_size}
                        </strong>
                        <span className="acct-row-note">
                          {tierInfo(e.tier)?.label} · week of {weekLabel(e.week_start)}
                        </span>
                      </span>
                      <span className="row-side">
                        <span className={`num ${tone(profit)}`}>{signedMoney(profit)}</span>
                        <span className="acct-row-note num">{money(e.final_value)}</span>
                        <span className="acct-row-note num gold">
                          +{Number(e.coins_awarded ?? 0).toLocaleString()} coins
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <div className="col acct-profile-side">
          <CoinsCard coins={user.coins}>
            <dl className="stats">
              <div>
                <dt>Leagues</dt>
                <dd>{careerPlayed}</dd>
              </div>
              <div>
                <dt>Wins</dt>
                <dd>{careerWins}</dd>
              </div>
              <div>
                <dt>Podiums</dt>
                <dd>{careerPodiums}</dd>
              </div>
            </dl>
          </CoinsCard>

          {/* Buddies are bought with coins, never league cash. The catalogue in
              lib/rewards/buddies.js holds one entry per character whose model is
              actually in the repo, so this list is never padded out. */}
          <section className="card buddy-shop">
            <div className="card-head">
              <h2>Your buddy</h2>
              <span className="caption">
                {buddies.owned.length} of {BUDDIES.length} unlocked
              </span>
            </div>
            <p className="caption">
              Your buddy sits in the corner of Home, reacts to how your week is going, and opens
              your stats when you tap it.
            </p>
            <ul className="buddy-roster">
              {BUDDIES.map((b) => {
                const owned = buddies.owned.includes(b.slug);
                const active = buddies.active === b.slug;
                return (
                  <li key={b.slug} className={active ? 'buddy-pick is-active' : 'buddy-pick'}>
                    <div className="buddy-pick-top">
                      <strong>{b.name}</strong>
                      <span className={active ? 'pill gold' : 'pill'}>
                        {active
                          ? 'Out with you'
                          : owned
                            ? 'Unlocked'
                            : `${b.price.toLocaleString()} coins`}
                      </span>
                    </div>
                    <p className="muted small">
                      {b.species} · {b.blurb}
                    </p>
                    {active ? null : owned ? (
                      <form action={pickBuddy}>
                        <input type="hidden" name="slug" value={b.slug} />
                        <SubmitButton className="btn small outline" pendingLabel="Switching…">
                          Send out {b.name}
                        </SubmitButton>
                      </form>
                    ) : (
                      <form action={buyBuddy}>
                        <input type="hidden" name="slug" value={b.slug} />
                        <SubmitButton className="btn small primary" pendingLabel="Unlocking…">
                          Unlock for {b.price.toLocaleString()} coins
                        </SubmitButton>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="caption">
              More buddies arrive with their models — a character is listed here once its model is
              in the game.
            </p>
          </section>

          {/* A live-portfolio card used to sit here, fed from pastEntries()
              and gated on entry.trading_open. pastEntries() only returns
              settled leagues, where trading is closed by definition, so it
              never rendered -- it just cost two queries a visit. The live
              portfolio is on Home and Battles. */}

          <section className="card acct-notifs-card">
            <div className="card-head">
              <h2>How the week works</h2>
            </div>
            <ul className="acct-list">
              {WEEK_FACTS.map((n) => (
                <li key={n.title} className="row">
                  <span className="row-main">
                    <strong>{n.title}</strong>
                    <span className="muted small">{n.sub}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Device sign-in while there's no login page: a plain log out would
              sign this device straight back in on the landing page, so this
              also forgets the device id (components/auth/ForgetDevice.js). */}
          <div className="acct-signout">
            <ForgetDevice />
          </div>
        </div>
      </div>
    </main>
  );
}
