import Link from 'next/link';
import { requireUser } from '../../../lib/db/auth';
import { TIERS, entriesToShow, tierInfo } from '../../../lib/trading/game';
import { boardTotals, weeklyBoard } from '../../../lib/rewards/catalog';
import { entryAchievements } from '../../../lib/rewards/read';
import { first, money, weekRange } from '../../../lib/utils/format';
import { PageHead, ProgressBar } from '../../../components/layout/ui';
import Icon from '../../../components/layout/icons';
import AchievementCard from '../../../components/rewards/AchievementCard';

// Awards are the same share of starting cash in every league, so a player who
// hasn't joined yet sees the board priced in the smallest one.
const PREVIEW_TIER = TIERS[0].tier;

export default async function DailyPage({ searchParams }) {
  const sp = await searchParams;
  const user = await requireUser();
  // entriesToShow keeps last week's board reachable after Sunday settles it,
  // so a player can still see what they earned. `current` is false in that
  // case, and every bit of "this week" copy below has to follow it.
  const { week: ws, entries, current } = await entriesToShow(user.id);

  // Same tier selection as /trade and /league: ?tier= when the player is
  // actually in it, otherwise their first entry of the week.
  const wanted = Number(String(first(sp?.tier) ?? '').trim()) || null;
  const picked = wanted ? entries.find((e) => Number(e.tier) === wanted) : null;
  const entry = picked ?? entries[0] ?? null;

  const earned = entry ? await entryAchievements(entry.id) : [];
  const tier = entry ? Number(entry.tier) : PREVIEW_TIER;
  const label = tierInfo(tier)?.label ?? '';
  const board = weeklyBoard(earned, tier);
  const totals = boardTotals(board, 'cash');

  return (
    <main>
      <PageHead
        eyebrow={current ? 'This week' : 'Last week'}
        live={Boolean(entry?.trading_open)}
        title="Achievement"
        accent="board"
        sub={
          entry
            ? `${label} · ${weekRange(entry.week_start)}. ${
                current
                  ? 'Every one of these pays league cash into this entry.'
                  : 'This league has finished — these are the ones it paid.'
              }`
            : 'The ten achievements every player in a league can earn this week.'
        }
      />

      {entries.length > 1 ? (
        <nav
          className="card acct-tierpick"
          aria-label={current ? 'Your leagues this week' : 'Your leagues last week'}
        >
          <p className="eyebrow">Board for</p>
          <div className="acct-tierbar">
            {entries.map((e) => {
              const on = Number(e.tier) === tier;
              return (
                <Link
                  key={e.tier}
                  href={`/daily?tier=${e.tier}`}
                  className={on ? 'pill blue' : 'pill'}
                  aria-current={on ? 'page' : undefined}
                >
                  {tierInfo(e.tier)?.short}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}

      {entry ? (
        <section className="hero-card acct-board-sum rim-accent">
          <p className="eyebrow">{current ? 'Earned this week' : 'Earned last week'}</p>
          <p className="big-number">{money(totals.value)}</p>
          <p className="caption">League cash, paid straight into your {label} balance</p>
          <div className="acct-board-progress">
            <ProgressBar
              value={totals.of ? totals.count / totals.of : 0}
              label={`${totals.count} of ${totals.of} achievements earned`}
            />
            <p className="caption">
              {totals.count} of {totals.of} done
            </p>
          </div>
        </section>
      ) : (
        <section className="card">
          <div className="card-head">
            <h2>Preview</h2>
            <span className="pill">Not in a league</span>
          </div>
          <p className="muted small">
            The awards below are 1K-league amounts. Every award is the same share of your
            starting cash, so the 10K league pays ten times these and the 100K a hundred times.
          </p>
          <Link href="/league" className="btn primary block">
            <Icon name="battles" size={20} strokeWidth={2.2} />
            Join a league
          </Link>
        </section>
      )}

      <section className="acct-board-sec" aria-labelledby="daily-board-title">
        <header className="acct-board-head">
          <p className="eyebrow">
            {!entry ? '1K-league awards' : current ? 'Earn these' : 'How it finished'}
          </p>
          <h2 id="daily-board-title">{current ? "This week's ten" : "Last week's ten"}</h2>
          <p className="acct-board-sub">
            Everyone in the league can earn all ten, and they reset when the week does. The money
            lands in your trading cash — coins are a separate currency and live on Progress. Buy
            at least one stock first: nothing here pays a player who never traded.
          </p>
        </header>
        <ul className="acct-board">
          {board.map((a) => (
            <AchievementCard key={a.slug} ach={a} currency="cash" />
          ))}
        </ul>
      </section>
    </main>
  );
}
