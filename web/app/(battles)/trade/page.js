import Link from 'next/link';
import { Suspense } from 'react';
import { requireUser } from '../../../lib/db/auth';
import { entriesForWeek, holdings, joinableWeek, marketOpen, stocks, summarize } from '../../../lib/trading/game';
import { first } from '../../../lib/utils/format';
import AutoRefresh from '../../../components/layout/refresh';
import { Flash, PageHead } from '../../../components/layout/ui';
import SearchForm from '../../../components/trade/SearchForm';
import SortSelect from '../../../components/trade/SortSelect';
import StockList from '../../../components/trade/StockList';
import TierPicker from '../../../components/trade/TierPicker';
import WalletStrip from '../../../components/trade/WalletStrip';

export default async function TradePage({ searchParams }) {
  const sp = await searchParams;
  const user = await requireUser();
  const q = String(first(sp?.q) ?? '').trim();
  const sort = String(first(sp?.sort) ?? '').trim() || 'trending';
  const open = marketOpen();
  const ws = await joinableWeek();
  const entries = await entriesForWeek(user.id, ws);
  const rawTier = String(first(sp?.tier) ?? '').trim();
  const wanted = Number(rawTier) || null;
  const selectedTier = wanted && entries.some((e) => Number(e.tier) === wanted) ? wanted : entries[0]?.tier ?? null;
  const entry = entries.find((e) => Number(e.tier) === Number(selectedTier)) ?? null;

  // The player's own money and stocks in the selected league. One query feeds
  // both the wallet strip and the "you own N" badges in the list below.
  const rows = entry ? await holdings(entry.id) : [];
  const summary = entry ? summarize(entry, rows) : null;
  const owned = Object.fromEntries(rows.map((r) => [r.symbol, Number(r.shares)]));

  const extra = [q ? `q=${encodeURIComponent(q)}` : '', sort !== 'trending' ? `sort=${encodeURIComponent(sort)}` : '']
    .filter(Boolean)
    .join('&');

  return (
    <main className="trade-market">
      <AutoRefresh seconds={60} />
      <div className="trade-top">
        <PageHead
          eyebrow={open ? 'Live prices' : 'Prices paused'}
          live={open}
          title="Trade"
          sub="Buy and sell at real prices. Orders go through right away."
        />
        <div className="trade-toolbar">
          <SearchForm q={q} tier={selectedTier} sort={sort} />
          <SortSelect q={q} sort={sort} tier={selectedTier} />
        </div>
      </div>
      <Flash sp={sp} />
      {entries.length > 1 ? (
        <TierPicker entries={entries} tier={selectedTier} path="/trade" extra={extra} />
      ) : null}
      {entry && summary ? <WalletStrip entry={entry} rows={rows} summary={summary} /> : null}
      {!entry ? (
        <p className="flash trade-note">
          <Link href="/league">Join a league</Link> to start trading.
        </p>
      ) : !entry.trading_open ? (
        <p className="flash trade-note">
          {entry.not_started
            ? 'This league opens Monday at 7:00 AM ET. You can look around until then.'
            : 'Trading is closed for this league.'}{' '}
          <Link href="/league">See the Battles tab</Link>.
        </p>
      ) : null}
      <Suspense key={`${q}:${sort}:${selectedTier ?? ''}`} fallback={<section className="card flush" aria-label="Loading stocks" aria-busy="true" />}>
        <StockResults q={q} sort={sort} tier={selectedTier} owned={owned} />
      </Suspense>
      <p className="fineprint">
        Change is versus the previous close. Prices update about once a minute while the market is open; the league itself
        stays open from Monday 7:00 AM to Sunday 7:00 PM ET.
      </p>
    </main>
  );
}

async function StockResults({ q, sort, tier, owned }) {
  const list = await stocks(q, sort);
  return (
    <section className="card flush trade-board" aria-label="Stocks">
      {list.length === 0 ? (
        <p className="empty trade-empty">
          {q ? (
            <>
              No stocks match “{q}”.{' '}
              <Link href={tier ? `/trade?tier=${tier}` : '/trade'}>Show all stocks</Link>
            </>
          ) : (
            'No stocks are listed right now.'
          )}
        </p>
      ) : (
        <StockList stocks={list} tier={tier} owned={owned} />
      )}
    </section>
  );
}
