import { requireUser } from '../../../lib/db/auth';
import { pastEntries, tierInfo } from '../../../lib/trading/game';
import { money, ordinal, signedMoney, tone, weekLabel } from '../../../lib/utils/format';
import { logout } from '../../../lib/actions';
import { PageHead } from '../../../components/layout/ui';
import Icon from '../../../components/layout/icons';
import CoinsCard from '../../../components/profile/CoinsCard';

const ACH_DEFS = [
  {
    id: 'first',
    label: 'First battle',
    icon: <path d="M5 21V4M5 4h11l-2.5 4L16 12H5" />,
  },
  {
    id: 'podium',
    label: 'Podium finish',
    icon: <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" />,
  },
  {
    id: 'champion',
    label: 'Champion',
    icon: <path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8L12 3Z" />,
  },
  {
    id: 'veteran',
    label: '5 leagues',
    icon: <path d="M12 3v18M5 8l7-5 7 5M5 16l7 5 7-5" />,
  },
  {
    id: 'regular',
    label: '10 leagues',
    icon: <path d="M12 3l1.9 4.6 5 .4-3.8 3.3 1.1 4.9L12 13.7l-4.2 2.5 1.1-4.9L5.1 8l5-.4L12 3Z" />,
  },
  {
    id: 'earner',
    label: 'Coin earner',
    icon: <path d="M12 3a9 9 0 1 0 9 9M12 7v10M9 9.5h5M9 14.5h5" />,
  },
  {
    id: 'hot',
    label: 'Top half',
    icon: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
  },
  {
    id: 'loyal',
    label: '3 podiums',
    icon: <path d="M6 21v-7a6 6 0 0 1 12 0v7M9 21h6M12 8v4" />,
  },
];

const NOTIFS = [
  { title: 'League ends Sunday', sub: 'Final ranks lock at the closing bell.' },
  { title: 'Achievement near complete', sub: 'One more podium unlocks a new badge.' },
  { title: 'Market opens 9:30 AM ET', sub: 'Queued orders fill when trading resumes.' },
];

// Colour for a finishing place: gold / silver / bronze for the podium.
function placeTone(rank) {
  return rank === 1 ? 'p1' : rank === 2 ? 'p2' : rank === 3 ? 'p3' : '';
}

export default async function ProfilePage() {
  const user = await requireUser();
  const history = await pastEntries(user.id);
  const wins = history.filter((e) => e.final_rank === 1).length;
  const podiums = history.filter((e) => e.final_rank && e.final_rank <= 3).length;
  const totalCoins = history.reduce((sum, e) => sum + Number(e.coins_awarded ?? 0), 0);
  const topHalf = history.filter((e) => e.final_rank && e.room_size && e.final_rank <= Math.ceil(e.room_size / 2)).length;

  const unlocked = {
    first: history.length >= 1,
    podium: podiums >= 1,
    champion: wins >= 1,
    veteran: history.length >= 5,
    regular: history.length >= 10,
    earner: totalCoins > 0,
    hot: topHalf >= 1,
    loyal: podiums >= 3,
  };
  const unlockedCount = Object.values(unlocked).filter(Boolean).length;

  return (
    <main className="acct-profile">
      <PageHead eyebrow="Profile" title={user.display_name} />

      <div className="split">
        <div className="col acct-profile-main">
          <section className="card acct-ach-card">
            <div className="card-head">
              <h2>Achievements</h2>
              <span className="caption">
                {unlockedCount} of {ACH_DEFS.length} unlocked
              </span>
            </div>
            <ul className="acct-ach-grid">
              {ACH_DEFS.map((a) => {
                const on = unlocked[a.id];
                return (
                  <li key={a.id} className={on ? 'acct-ach is-on' : 'acct-ach is-off'}>
                    <svg
                      viewBox="0 0 24 24"
                      width="26"
                      height="26"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      focusable="false"
                    >
                      {a.icon}
                    </svg>
                    <span className="acct-ach-text">
                      <span className="acct-ach-label">{a.label}</span>
                      <span className="acct-ach-state">{on ? 'Unlocked' : 'Locked'}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="card acct-history-card">
            <div className="card-head">
              <h2>Past leagues</h2>
              {history.length ? (
                <span className="caption">
                  {history.length} {history.length === 1 ? 'league' : 'leagues'}
                </span>
              ) : null}
            </div>
            {history.length === 0 ? (
              <p className="empty">Your results show up here after your first league ends.</p>
            ) : (
              <ul className="rows">
                {history.map((e) => {
                  const profit = Number(e.final_value) - Number(e.starting_balance);
                  return (
                    <li key={e.id} className="row">
                      <span className="row-main">
                        <strong className={`acct-place ${placeTone(e.final_rank)}`}>
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
          </CoinsCard>

          <section className="card acct-notifs-card">
            <div className="card-head">
              <h2>Notifications</h2>
              <span className="pill">Placeholder</span>
            </div>
            <ul className="rows">
              {NOTIFS.map((n) => (
                <li key={n.title} className="row">
                  <span className="row-main">
                    <strong>{n.title}</strong>
                    <span className="muted small">{n.sub}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <form action={logout} className="acct-logout">
            <button className="btn ghost block" type="submit">
              <Icon name="logout" size={18} strokeWidth={2} />
              Log out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
