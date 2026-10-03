import Link from 'next/link';
import { Suspense } from 'react';
import { requireUser } from '../../../lib/db/auth';
import {
  TIERS,
  entriesToShow,
  holdings,
  leaderboard,
  summarize,
  weekHasStarted,
} from '../../../lib/trading/game';
import { entryAchievementCash } from '../../../lib/rewards/read';
import { first } from '../../../lib/utils/format';
import { ordinal, weekRange } from '../../../lib/utils/format';
import AutoRefresh from '../../../components/layout/refresh';
import PortfolioSummary from '../../../components/home/PortfolioSummary';
import { Flash, PageHead } from '../../../components/layout/ui';
import StandingCard from '../../../components/battle/StandingCard';
import TierCards from '../../../components/battle/TierCards';
import LeagueBoard from '../../../components/battle/LeagueBoard';
import Icon from '../../../components/layout/icons';

export default async function LeaguePage({ searchParams }) {
  const sp = await searchParams;
  const user = await requireUser();
  // `current` is false when the only entries left to show are last week's,
  // because this week's leagues have not been joined yet.
  const { week: ws, entries, current } = await entriesToShow(user.id);
  const live = await weekHasStarted(ws);

  if (entries.length === 0) {
    return (
      <main>
        <BattlesHead />
        <Flash sp={sp} />
        <TierCards week={ws} live={live} />
      </main>
    );
  }

  const rawTier = String(first(sp?.tier) ?? '').trim();
  const selectedTier = Number(rawTier) || null;
  let selectedEntry = selectedTier ? entries.find((e) => Number(e.tier) === selectedTier) : null;
  if (!selectedEntry) selectedEntry = entries[0];

  // Last week's entries are history, so every tier is still open to join.
  const joinedTiers = new Set(current ? entries.map((e) => Number(e.tier)) : []);
  const remaining = TIERS.filter((t) => !joinedTiers.has(t.tier));
  const showSwitcher = entries.length > 1;

  return (
    <main>
      <AutoRefresh seconds={30} />
      <BattlesHead />
      <Flash sp={sp} />
      {showSwitcher ? (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="eyebrow" style={{ marginBottom: 8 }}>
            Your leagues this week
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {entries.map((e) => {
              const isSelected = Number(e.tier) === Number(selectedEntry.tier);
              return (
                <Link
                  key={e.tier}
                  href={`/league?tier=${e.tier}`}
                  className={isSelected ? 'pill blue' : 'pill'}
                  aria-current={isSelected ? 'page' : undefined}
                >
                  {e.tier === 1000 ? '1K' : e.tier === 10000 ? '10K' : '100K'}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
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
        <LeagueDetail entry={selectedEntry} remaining={remaining} ws={ws} live={live} />
      </Suspense>
    </main>
  );
}

async function LeagueDetail({ entry, remaining, ws, live }) {
  const [rows, board, achievementCash] = await Promise.all([
    holdings(entry.id),
    leaderboard(entry.room_id),
    entryAchievementCash(entry.id),
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
          <PortfolioSummary
            entry={entry}
            rows={rows}
            summary={summary}
            achievementCash={achievementCash}
          />
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
            <Link href={`/trade?tier=${entry.tier}`} className="btn primary block">
              <Icon name="chart" size={20} strokeWidth={2.2} />
              Trade
            </Link>
          ) : null}
          <Link href={`/daily?tier=${entry.tier}`} className="btn outline block">
            <Icon name="trophy" size={20} strokeWidth={2.2} />
            This week&apos;s achievements
          </Link>
        </div>
        <LeagueBoard board={board} entry={entry} canStillFill={true} />
      </div>
      {remaining.length > 0 ? (
        <section className="battle-next" aria-labelledby="battle-next-title">
          <header className="battle-section-head">
            <p className="eyebrow">This week</p>
            <h2 id="battle-next-title">Join another league</h2>
            <p className="battle-section-sub">You can be in all three — only the ones below are left for {weekRange(ws)}.</p>
          </header>
          <TierCards week={ws} live={live} level={3} tiers={remaining} />
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
