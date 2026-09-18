import Link from 'next/link';
import { Suspense } from 'react';
import { requireUser } from '../../../lib/db/auth';
import {
  currentEntry,
  holdings,
  joinableWeek,
  leaderboard,
  summarize,
  weekHasStarted,
} from '../../../lib/trading/game';
import { ordinal, weekRange } from '../../../lib/utils/format';
import AutoRefresh from '../../../components/layout/refresh';
import Icon from '../../../components/layout/icons';
import { Flash, PageHead } from '../../../components/layout/ui';
import StandingCard from '../../../components/battle/StandingCard';
import TierCards from '../../../components/battle/TierCards';
import LeagueBoard from '../../../components/battle/LeagueBoard';

// Battles tab. Without a league entry it's the place to pick and join one.
// With an entry it shows that league: the player's standing and the full
// room leaderboard. Once the next week opens for joining (after Friday's
// close), the join cards return below the league.
export default async function LeaguePage({ searchParams }) {
  const sp = await searchParams;
  const user = await requireUser();
  const [entry, ws] = await Promise.all([currentEntry(user.id), joinableWeek()]);

  if (!entry) {
    const live = await weekHasStarted(ws);
    return (
      <main>
        <BattlesHead />
        <Flash sp={sp} />
        <TierCards week={ws} live={live} />
      </main>
    );
  }

  const canJoinNext = entry.week_start < ws;

  return (
    <main>
      <AutoRefresh seconds={30} />
      <BattlesHead />
      <Flash sp={sp} />

      <Suspense
        fallback={
          <div className="battle-league" aria-busy="true" aria-label="Loading league">
            <div className="battle-aside">
              <section className="hero-card" aria-hidden="true" />
            </div>
            <section className="card" aria-hidden="true" />
          </div>
        }
      >
        <LeagueDetail entry={entry} ws={ws} canJoinNext={canJoinNext} />
      </Suspense>
    </main>
  );
}

async function LeagueDetail({ entry, ws, canJoinNext }) {
  const [rows, board, nextLive] = await Promise.all([
    holdings(entry.id),
    leaderboard(entry.room_id),
    canJoinNext ? weekHasStarted(ws) : false,
  ]);
  const summary = summarize(entry, rows);
  const settled = entry.league_status === 'settled';
  const place = board.findIndex((r) => r.entry_id === entry.id) + 1;
  const finalRank = Number(entry.final_rank) || place;
  const coins = Number(entry.coins_awarded ?? 0).toLocaleString('en-US');

  return (
    <>
      <div className="battle-league">
        <div className="battle-aside">
          <StandingCard entry={entry} summary={summary} place={place} total={board.length} />

          {settled ? (
            <p className="glass rim-gold battle-final" role="status">
              <Icon name="trophy" size={22} strokeWidth={2} />
              <span>
                {finalRank
                  ? `This league is final. You finished ${ordinal(finalRank)} and earned ${coins} coins.`
                  : 'This league is final.'}
              </span>
            </p>
          ) : null}

          {entry.trading_open ? (
            <Link href="/trade" className="btn primary block">
              <Icon name="chart" size={20} strokeWidth={2.2} />
              Trade
            </Link>
          ) : null}
        </div>

        <LeagueBoard board={board} entry={entry} canStillFill={!canJoinNext} />
      </div>

      {canJoinNext ? (
        <section className="battle-next" aria-labelledby="battle-next-title">
          <header className="battle-section-head">
            <p className="eyebrow">{nextLive ? 'This week' : 'Next week'}</p>
            <h2 id="battle-next-title">Join a league</h2>
            <p className="battle-section-sub">Leagues for {weekRange(ws)} are open.</p>
          </header>
          <TierCards week={ws} live={nextLive} level={3} />
        </section>
      ) : null}
    </>
  );
}

function BattlesHead() {
  return (
    <PageHead
      eyebrow="Weekly"
      title="Battles"
      sub="New matchups every Monday. Same starting cash for everyone. Best portfolio wins."
    />
  );
}
