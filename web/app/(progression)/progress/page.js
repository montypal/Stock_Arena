import { requireUser } from '../../../lib/db/auth';
import { pastEntries } from '../../../lib/trading/game';
import { PageHead } from '../../../components/layout/ui';

export default async function ProgressPage() {
  const user = await requireUser();
  const history = await pastEntries(user.id);
  const wins = history.filter((e) => e.final_rank === 1).length;
  const podiums = history.filter((e) => e.final_rank && e.final_rank <= 3).length;
  const totalCoins = history.reduce((sum, e) => sum + Number(e.coins_awarded ?? 0), 0);

  return (
    <main>
      <PageHead eyebrow="Progress" title="Your career">
        <p className="muted small">Coins only — league cash never mixes with coins.</p>
      </PageHead>

      <section className="hero-card">
        <p className="eyebrow">Coins balance</p>
        <p className="big-number">{Number(user.coins).toLocaleString()}</p>
        <p className="muted small">Earned by finishing leagues. Coins are for in-game rewards only.</p>
        <dl className="stats">
          <div>
            <dt>Leagues</dt>
            <dd>{history.length}</dd>
          </div>
          <div>
            <dt>Wins</dt>
            <dd>{wins}</dd>
          </div>
          <div>
            <dt>Podiums</dt>
            <dd>{podiums}</dd>
          </div>
        </dl>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Career</h2>
          <span className="muted small">{totalCoins.toLocaleString()} coins earned all-time</span>
        </div>
        {history.length === 0 ? (
          <p className="empty">Finish your first league to start your career record.</p>
        ) : (
          <p className="muted small">
            {history.length} {history.length === 1 ? 'league' : 'leagues'} played · {wins}{' '}
            {wins === 1 ? 'win' : 'wins'} · {podiums} {podiums === 1 ? 'podium' : 'podiums'}. Full
            history lives on your Profile.
          </p>
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
    </main>
  );
}
