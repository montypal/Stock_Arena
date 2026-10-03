import Link from 'next/link';
import { Suspense } from 'react';
import { currentUser } from '../lib/db/auth';
import {
  TIERS,
  careerStats,
  entriesToShow,
  holdings,
  leaderboard,
  marketOpen,
  summarize,
  tierInfo,
} from '../lib/trading/game';
import { buddy, buddyState, mood } from '../lib/rewards/buddies';
import { entrySnapshots } from '../lib/rewards/read';
import { first } from '../lib/utils/format';
import AutoRefresh from '../components/layout/refresh';
import { Flash, PageHead, StatTile } from '../components/layout/ui';
import StandingCard from '../components/battle/StandingCard';
import Landing from '../components/home/Landing';
import BuddyWidget from '../components/home/BuddyWidget';
import FindBattleCard from '../components/home/FindBattleCard';
import HoldingsCard from '../components/home/HoldingsCard';
import PortfolioSummary from '../components/home/PortfolioSummary';
import RoomSnapshot from '../components/home/RoomSnapshot';

// Home. Signed out: the landing page. Signed in: this week's league at a
// glance -- standing, stocks, portfolio summary, career record, and the room.
// The shell (header + join card) paints first; standings, holdings, portfolio,
// career stats and the room snapshot stream in via Suspense.
export default async function Home({ searchParams }) {
  const sp = await searchParams;
  const user = await currentUser();
  const open = marketOpen();

  if (!user) return <Landing open={open} />;

  // Shows last week's league after Sunday settles it, so the result, rank and
  // coins are still on screen instead of an empty Home.
  const { week, entries } = await entriesToShow(user.id);

  if (entries.length === 0) {
    return (
      <main className="home-dash">
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
            <FindBattleCard week={week} entry={null} />
          </div>
          <aside className="col" aria-label="Your record and room">
            <Suspense fallback={<section className="card" aria-label="Loading stats" aria-busy="true" />}>
              <CareerStats userId={user.id} />
            </Suspense>
          </aside>
        </div>
        {/* No entry this week: the buddy is still here, just idle. */}
        <Suspense fallback={null}>
          <HomeBuddy userId={user.id} />
        </Suspense>
      </main>
    );
  }

  const rawTier = String(first(sp?.tier) ?? '').trim();
  const selectedTier = Number(rawTier) || null;
  let selectedEntry = selectedTier ? entries.find((e) => Number(e.tier) === selectedTier) : null;
  if (!selectedEntry) selectedEntry = entries[0];

  const joinedTiers = new Set(entries.map((e) => Number(e.tier)));
  const hasMoreToJoin = joinedTiers.size < TIERS.length;
  const showSwitcher = entries.length > 1;

  return (
    <main className="home-dash">
      <AutoRefresh seconds={30} />
      <PageHead
        eyebrow={open ? 'Market open' : 'Market closed'}
        live={open}
        title="Hi,"
        accent={user.display_name}
      />
      <Flash sp={sp} />
      {showSwitcher ? (
        <div className="card home-tier-switcher" style={{ marginBottom: 16 }}>
          <p className="eyebrow" style={{ marginBottom: 8 }}>
            Your leagues this week
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {entries.map((e) => {
              const isSelected = Number(e.tier) === Number(selectedEntry.tier);
              return (
                <Link
                  key={e.tier}
                  href={`/?tier=${e.tier}`}
                  className={isSelected ? 'pill blue' : 'pill'}
                  aria-current={isSelected ? 'page' : undefined}
                >
                  {e.tier === 1000 ? '1K' : e.tier === 10000 ? '10K' : '100K'}
                </Link>
              );
            })}
            {hasMoreToJoin
              ? TIERS.filter((t) => !joinedTiers.has(t.tier)).map((t) => (
                  <Link key={`join-${t.tier}`} href="/league" className="pill">
                    + {t.short}
                  </Link>
                ))
              : null}
          </div>
        </div>
      ) : null}
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
        <HomeDetail entry={selectedEntry} userId={user.id} week={week} showJoin={hasMoreToJoin} />
      </Suspense>
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

async function HomeDetail({ entry, userId, week, showJoin }) {
  const [career, rows, board] = await Promise.all([
    careerStats(userId),
    holdings(entry.id),
    leaderboard(entry.room_id),
  ]);
  const summary = summarize(entry, rows);
  const place = board.findIndex((r) => r.entry_id === entry.id) + 1;
  return (
    <>
      <div className="split home-split">
        <div className="col">
          <StandingCard entry={entry} summary={summary} place={place} total={board.length} />
          {showJoin ? <FindBattleCard week={week} entry={entry} /> : null}
          <HoldingsCard rows={rows} tradingOpen={entry.trading_open} tier={entry.tier} />
          <PortfolioSummary entry={entry} rows={rows} summary={summary} />
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
      {/* Its own boundary: the buddy's snapshots must not hold up the cards. */}
      <Suspense fallback={null}>
        <HomeBuddy
          userId={userId}
          entry={entry}
          summary={summary}
          rows={rows}
          place={place}
          total={board.length}
        />
      </Suspense>
    </>
  );
}

// The corner buddy and the real numbers its stats panel shows. `entry` is null
// for a player who has not joined this week -- the widget says so rather than
// inventing a portfolio.
async function HomeBuddy({ userId, entry = null, summary = null, rows = [], place = 0, total = 0 }) {
  const [{ active }, snapshots] = await Promise.all([
    buddyState(userId),
    entry ? entrySnapshots(entry.id) : Promise.resolve([]),
  ]);
  const character = buddy(active);
  if (!character) return null;

  // Same thresholds as format.tone(), so a holding the panel calls flat is the
  // one the rest of the app draws flat.
  const moved = rows.map((r) => ({
    symbol: r.symbol,
    gain: (Number(r.value) || 0) - (Number(r.cost_basis) || 0),
  }));
  const stats = entry
    ? {
        tier: tierInfo(entry.tier)?.label ?? 'League',
        value: summary.value,
        profit: summary.profit,
        change: summary.change,
        cash: summary.cash,
        invested: summary.invested,
        start: Number(entry.starting_balance),
        stocks: rows.length,
        place,
        total,
        up: moved.filter((h) => h.gain > 0.004).sort((a, b) => b.gain - a.gain),
        down: moved.filter((h) => h.gain < -0.004).sort((a, b) => a.gain - b.gain),
        trend: snapshots.map((s) => ({
          date: s.snapshot_date,
          value: Number(s.value),
          rank: Number(s.rank),
        })),
      }
    : null;

  return (
    <BuddyWidget
      name={character.name}
      species={character.species}
      model={character.model}
      clips={character.clips}
      mood={entry ? mood({ change: summary.change, place }) : 'idle'}
      stats={stats}
    />
  );
}
