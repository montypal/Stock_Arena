import Link from 'next/link';
import { requireUser } from '../../../lib/db/auth';
import { careerStats, pastEntries } from '../../../lib/trading/game';
import { ordinal } from '../../../lib/utils/format';
import { PageHead, StatTile } from '../../../components/layout/ui';
import CoinsCard from '../../../components/profile/CoinsCard';

// pastEntries() returns at most this many settled leagues.
const HISTORY_LIMIT = 20;

export default async function ProgressPage() {
  const user = await requireUser();
  const [history, career] = await Promise.all([pastEntries(user.id), careerStats(user.id)]);

  const played = Number(career.played) || 0;
  const wins = Number(career.wins) || 0;
  const podiums = Number(career.podiums) || 0;
  const winRate = Math.round((Number(career.winRate) || 0) * 100);

  const totalCoins = history.reduce((sum, e) => sum + Number(e.coins_awarded ?? 0), 0);
  const ranks = history.map((e) => Number(e.final_rank)).filter((r) => r > 0);
  const bestFinish = ranks.length ? ordinal(Math.min(...ranks)) : '—';
  const capped = history.length >= HISTORY_LIMIT;

  return (
    <main>
      <PageHead eyebrow="Progress" title="Your" accent="career">
        <p className="muted small">Coins only — league cash never mixes with coins.</p>
      </PageHead>

      <div className="split">
        <div className="col">
          <CoinsCard coins={user.coins} label="Coins balance" />
          <div className="grid-3">
            <StatTile icon="battles" value={played} label="Leagues" />
            <StatTile icon="trophy" value={wins} label="Wins" tone="gold" />
            <StatTile icon="bars" value={podiums} label="Podiums" tone="flame" />
          </div>
        </div>

        <div className="col acct-pair">
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
                    <dt>Coins won</dt>
                    <dd className="gold">{totalCoins.toLocaleString()}</dd>
                  </div>
                </dl>
                {capped ? (
                  <p className="caption">Best finish and coins won cover your last {HISTORY_LIMIT} leagues.</p>
                ) : null}
                <p className="muted small">
                  Your league-by-league results live on your <Link href="/profile">Profile</Link>.
                </p>
              </>
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Store</h2>
              <span className="pill">Coming soon</span>
            </div>
            <p className="muted small">
              The coin store is on the way. No purchases yet — your coins are safe and stay put.
            </p>
            <p className="fineprint">Store coming soon. No store logic in this release.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
