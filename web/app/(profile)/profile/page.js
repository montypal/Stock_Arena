import { requireUser } from '../../../lib/db/auth';
import { pastEntries, tierInfo } from '../../../lib/trading/game';
import { money, ordinal, signedMoney, tone, weekLabel } from '../../../lib/utils/format';
import { logout } from '../../../lib/actions';
import { PageHead } from '../../../components/layout/ui';

export default async function ProfilePage() {
  const user = await requireUser();
  const history = await pastEntries(user.id);
  const wins = history.filter((e) => e.final_rank === 1).length;
  const podiums = history.filter((e) => e.final_rank && e.final_rank <= 3).length;

  return (
    <main>
      <PageHead eyebrow="Profile" title={user.display_name} />

      <section className="hero-card">
        <p className="eyebrow">Coins</p>
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
        <h2>Past leagues</h2>
        {history.length === 0 ? (
          <p className="empty">Your results show up here after your first league ends.</p>
        ) : (
          <ul className="rows">
            {history.map((e) => {
              const profit = Number(e.final_value) - Number(e.starting_balance);
              return (
                <li key={e.id} className="row">
                  <span className="row-main">
                    <strong>
                      {ordinal(e.final_rank)} of {e.room_size}
                    </strong>
                    <span className="muted small">
                      {tierInfo(e.tier)?.label} · week of {weekLabel(e.week_start)}
                    </span>
                  </span>
                  <span className="row-side">
                    <span className={`num ${tone(profit)}`}>{signedMoney(profit)}</span>
                    <span className="num small muted">
                      {money(e.final_value)} · +{Number(e.coins_awarded ?? 0).toLocaleString()} coins
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <form action={logout}>
        <button className="btn ghost block" type="submit">
          Log out
        </button>
      </form>
    </main>
  );
}
