import Link from 'next/link';
import { requireUser } from '../../../lib/db/auth';
import { careerStats, pastEntries } from '../../../lib/trading/game';
import { careerBoard, boardTotals } from '../../../lib/rewards/catalog';
import { coinSources, userAchievements } from '../../../lib/rewards/read';
import { ordinal } from '../../../lib/utils/format';
import { PageHead, ProgressBar, StatTile } from '../../../components/layout/ui';
import CoinsCard from '../../../components/profile/CoinsCard';
import AchievementCard from '../../../components/rewards/AchievementCard';

// pastEntries() returns at most this many settled leagues.
const HISTORY_LIMIT = 20;

export default async function ProgressPage() {
  const user = await requireUser();
  const [history, career, awarded, sources] = await Promise.all([
    pastEntries(user.id),
    careerStats(user.id),
    userAchievements(user.id),
    coinSources(user.id),
  ]);

  const played = Number(career.played) || 0;
  const wins = Number(career.wins) || 0;
  const podiums = Number(career.podiums) || 0;
  const winRate = Math.round((Number(career.winRate) || 0) * 100);

  const ranks = history.map((e) => Number(e.final_rank)).filter((r) => r > 0);
  const bestFinish = ranks.length ? ordinal(Math.min(...ranks)) : '—';
  // Only true once the career has more finished leagues than pastEntries()
  // returns, which is the one number below drawn from that capped list.
  const capped = played > history.length && history.length >= HISTORY_LIMIT;

  const earnedCoins = sources.fromPlacements + sources.fromAchievements;
  // Coins leave the profile when they are spent on unlocks, so the balance
  // can sit below what was earned. Only worth a line when it has happened.
  const spent = Math.max(0, earnedCoins - (Number(user.coins) || 0));

  const board = careerBoard(awarded);
  const totals = boardTotals(board, 'coins');
  // Some achievements wait on a feature that isn't built, so "x of 8" alone
  // would read as a target the player could actually finish.
  const blocked = board.filter((a) => a.waiting);
  const earnable = totals.of - blocked.length;

  return (
    <main className="acct-progress">
      <PageHead
        eyebrow="Progress"
        title="Your"
        accent="career"
        sub="Coins are your profile currency. They carry across weeks and never mix with league cash."
      />

      <div className="split">
        <div className="col">
          <CoinsCard coins={user.coins} label="Coins balance" />

          <section className="card">
            <div className="card-head">
              <h2>Where they came from</h2>
              <span className="caption">All time</span>
            </div>
            {earnedCoins === 0 ? (
              <p className="empty">
                No coins yet. Finishing a league pays coins for your place, and each career
                achievement below pays once.
              </p>
            ) : (
              <ul className="acct-list">
                <li className="row">
                  <span className="row-main">
                    <strong>League placements</strong>
                    <span className="muted small">Paid when a league settles, by where you finished.</span>
                  </span>
                  <span className="row-side">
                    <span className="num gold">+{sources.fromPlacements.toLocaleString()}</span>
                  </span>
                </li>
                <li className="row">
                  <span className="row-main">
                    <strong>Career achievements</strong>
                    <span className="muted small">Paid once each, the first time you meet the condition.</span>
                  </span>
                  <span className="row-side">
                    <span className="num gold">+{sources.fromAchievements.toLocaleString()}</span>
                  </span>
                </li>
                {spent > 0 ? (
                  <li className="row">
                    <span className="row-main">
                      <strong>Spent</strong>
                      <span className="muted small">Coins you have already put into unlocks.</span>
                    </span>
                    <span className="row-side">
                      <span className="num">−{spent.toLocaleString()}</span>
                    </span>
                  </li>
                ) : null}
              </ul>
            )}
          </section>
        </div>

        <div className="col">
          <div className="grid-3">
            <StatTile icon="battles" value={played} label="Leagues" />
            <StatTile icon="trophy" value={wins} label="Wins" tone="gold" />
            <StatTile icon="bars" value={podiums} label="Podiums" tone="flame" />
          </div>

          <section className="card">
            <div className="card-head">
              <h2>Career</h2>
              <span className="caption">Finished leagues</span>
            </div>
            {played === 0 ? (
              <p className="empty">Finish your first league to start your career record.</p>
            ) : (
              <>
                <dl className="stats acct-career-stats">
                  <div>
                    <dt>Win rate</dt>
                    <dd>{winRate}%</dd>
                  </div>
                  <div>
                    <dt>Best finish</dt>
                    <dd>{bestFinish}</dd>
                  </div>
                  <div>
                    <dt>Place coins</dt>
                    <dd className="gold">{sources.fromPlacements.toLocaleString()}</dd>
                  </div>
                </dl>
                {capped ? (
                  <p className="caption">Best finish covers your last {HISTORY_LIMIT} leagues.</p>
                ) : null}
                <p className="muted small">
                  Your league-by-league results live on your{' '}
                  <Link href="/profile" className="acct-link">
                    Profile
                  </Link>
                  .
                </p>
              </>
            )}
          </section>
        </div>
      </div>

      <section className="acct-board-sec" aria-labelledby="career-board-title">
        <header className="acct-board-head">
          <p className="eyebrow">Career achievements</p>
          <h2 id="career-board-title">Built over time</h2>
          <p className="acct-board-sub">
            These pay coins to your profile, once each. Weekly achievements are the other half of
            the reward system — they pay league cash and live on Daily.
          </p>
        </header>

        <section className="card acct-board-sum rim-gold">
          <div className="card-head">
            <h2>Unlocked</h2>
            <span className="caption">
              {totals.count} of {totals.of}
            </span>
          </div>
          <ProgressBar
            value={totals.of ? totals.count / totals.of : 0}
            label={`${totals.count} of ${totals.of} career achievements unlocked`}
          />
          <p className="muted small">
            <span className="gold">{totals.value.toLocaleString()} coins</span> earned from career
            achievements so far.
          </p>
          {blocked.length > 0 ? (
            <p className="caption">
              {earnable} of {totals.of} can be earned today. {blocked.map((a) => a.name).join(', ')}{' '}
              waits on {blocked[0].waiting}.
            </p>
          ) : null}
        </section>

        <ul className="acct-board">
          {board.map((a) => (
            <AchievementCard key={a.slug} ach={a} currency="coins" />
          ))}
        </ul>
      </section>
    </main>
  );
}
