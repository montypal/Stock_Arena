import { Suspense } from 'react';
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
// The shell (header + join card) paints first; standings, holdings, orders,
// career stats and the room snapshot stream in via Suspense.
export default async function Home({ searchParams }) {
  const sp = await searchParams;
  const user = await currentUser();
  const open = marketOpen();

  if (!user) return <Landing open={open} />;

  const [entry, week] = await Promise.all([currentEntry(user.id), joinableWeek()]);
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

      {!entry ? (
        <div className="split home-split">
          <div className="col">{canJoin ? <FindBattleCard week={week} entry={entry} /> : null}</div>
          <aside className="col" aria-label="Your record and room">
            <Suspense fallback={<section className="card" aria-label="Loading stats" aria-busy="true" />}>
              <CareerStats userId={user.id} />
            </Suspense>
          </aside>
        </div>
      ) : null}
      {entry ? (
        <Suspense
          fallback={
            <div className="split home-split" aria-busy="true" aria-label="Loading league">
              <div className="col">
                <section className="hero-card" aria-hidden="true" />
                <section className="card" aria-hidden="true" />
              </div>
              <aside className="col" aria-hidden="true">
                <section className="card" aria-hidden="true" />
              </aside>
            </div>
          }
        >
          <HomeDetail entry={entry} userId={user.id} week={week} canJoin={canJoin} />
        </Suspense>
      ) : null}
    </main>
  );
}

async function CareerStats({ userId }) {
  const career = await careerStats(userId);
  return (
    <div className="grid-3 home-stats">
      <StatTile icon="chart" tone="green" value={career.wins} label="Won" />
      <StatTile icon="flame" tone="flame" value={career.streak} label="Streak" />
      <StatTile icon="trophy" tone="gold" value={`${Math.round(career.winRate * 100)}%`} label="Win rate" />
    </div>
  );
}

async function HomeDetail({ entry, userId, week, canJoin }) {
  const [career, rows, pending, board] = await Promise.all([
    careerStats(userId),
    holdings(entry.id),
    orders(entry.id, { pending: true }),
    leaderboard(entry.room_id),
  ]);
  const summary = summarize(entry, rows);
  const place = board.findIndex((r) => r.entry_id === entry.id) + 1;
  return (
    <div className="split home-split">
      <div className="col">
        <StandingCard entry={entry} summary={summary} place={place} total={board.length} />
        {canJoin ? <FindBattleCard week={week} entry={entry} /> : null}
        <HoldingsCard rows={rows} tradingOpen={entry.trading_open} />
        {pending.length > 0 ? <PendingOrdersCard orders={pending} /> : null}
      </div>

      <aside className="col" aria-label="Your record and room">
        <div className="grid-3 home-stats">
          <StatTile icon="chart" tone="green" value={career.wins} label="Won" />
          <StatTile icon="flame" tone="flame" value={career.streak} label="Streak" />
          <StatTile icon="trophy" tone="gold" value={`${Math.round(career.winRate * 100)}%`} label="Win rate" />
        </div>
        <RoomSnapshot entry={entry} board={board} canStillFill={entry.week_start === week} />
      </aside>
    </div>
  );
}
