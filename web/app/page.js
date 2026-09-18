import { currentUser } from '../lib/db/auth';
import {
  careerStats,
  currentEntry,
  holdings,
  joinableWeek,
  leaderboard,
  marketOpen,
  orders,
  summarize,
} from '../lib/trading/game';
import AutoRefresh from '../components/layout/refresh';
import { Flash, PageHead, StatTile } from '../components/layout/ui';
import StandingCard from '../components/battle/StandingCard';
import Landing from '../components/home/Landing';
import FindBattleCard from '../components/home/FindBattleCard';
import HoldingsCard from '../components/home/HoldingsCard';
import PendingOrdersCard from '../components/home/PendingOrdersCard';
import RoomSnapshot from '../components/home/RoomSnapshot';

// Home. Signed out: the landing page. Signed in: this week's league at a
// glance -- standing, stocks, pending orders, career record, and the room.
export default async function Home({ searchParams }) {
  const sp = await searchParams;
  const user = await currentUser();
  const open = marketOpen();

  if (!user) return <Landing open={open} />;

  const [entry, week, career] = await Promise.all([
    currentEntry(user.id),
    joinableWeek(),
    careerStats(user.id),
  ]);

  const [rows, pending, board] = entry
    ? await Promise.all([
        holdings(entry.id),
        orders(entry.id, { pending: true }),
        leaderboard(entry.room_id),
      ])
    : [[], [], []];

  const summary = entry ? summarize(entry, rows) : null;
  const place = entry ? board.findIndex((r) => r.entry_id === entry.id) + 1 : 0;
  const canJoin = !entry || entry.week_start < week;

  return (
    <main>
      <AutoRefresh seconds={30} />
      <PageHead
        eyebrow={open ? 'Market open' : 'Market closed'}
        live={open}
        title="Hi,"
        accent={user.display_name}
      />
      <Flash sp={sp} />

      <div className="split home-split">
        <div className="col">
          {entry ? <StandingCard entry={entry} summary={summary} place={place} total={board.length} /> : null}
          {canJoin ? <FindBattleCard week={week} entry={entry} /> : null}
          {entry ? <HoldingsCard rows={rows} tradingOpen={entry.trading_open} /> : null}
          {pending.length > 0 ? <PendingOrdersCard orders={pending} /> : null}
        </div>

        <aside className="col" aria-label="Your record and room">
          <div className="grid-3 home-stats">
            <StatTile icon="chart" tone="green" value={career.wins} label="Won" />
            <StatTile icon="flame" tone="flame" value={career.streak} label="Streak" />
            <StatTile icon="trophy" tone="gold" value={`${Math.round(career.winRate * 100)}%`} label="Win rate" />
          </div>
          {entry ? <RoomSnapshot entry={entry} board={board} canStillFill={entry.week_start === week} /> : null}
        </aside>
      </div>
    </main>
  );
}
