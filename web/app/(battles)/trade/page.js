import Link from 'next/link';
import { Suspense } from 'react';
import { requireUser } from '../../../lib/db/auth';
import { entriesForWeek, joinableWeek, marketOpen, stocks } from '../../../lib/trading/game';
import { first } from '../../../lib/utils/format';
import AutoRefresh from '../../../components/layout/refresh';
import { Flash, PageHead } from '../../../components/layout/ui';
import SearchForm from '../../../components/trade/SearchForm';
import SortSelect from '../../../components/trade/SortSelect';
import StockList from '../../../components/trade/StockList';

export default async function TradePage({ searchParams }) {
  const sp = await searchParams;
  const user = await requireUser();
  const q = String(first(sp?.q) ?? '').trim();
  const sort = String(first(sp?.sort) ?? '').trim() || 'trending';
  const open = marketOpen();
  const ws = await joinableWeek();
  const entries = await entriesForWeek(user.id, ws);
  const showPicker = entries.length > 1;
  const rawTier = String(first(sp?.tier) ?? '').trim();
  const wanted = Number(rawTier) || null;
  const selectedTier = wanted && entries.some((e) => Number(e.tier) === wanted) ? wanted : entries[0]?.tier ?? null;

  const hasEntry = entries.length > 0;
  const tradingEntry = entries.find((e) => e.trading_open);

  return (
    <main className="trade-market">
      <AutoRefresh seconds={60} />
      <div className="trade-top">
        <PageHead
          eyebrow={open ? 'Market open' : 'Market closed'}
          live={open}
          title="Trade"
          sub="30 stocks at live prices. Orders fill at the next price update."
        />
        <div className="trade-toolbar">
          <SearchForm q={q} />
          <SortSelect q={q} sort={sort} />
        </div>
      </div>
      <Flash sp={sp} />
      {showPicker ? (
        <div className="card" style={{ marginBottom: 12 }}>
          <p className="eyebrow" style={{ marginBottom: 8 }}>
            Trading in
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {entries.map((e) => {
              const isSelected = Number(e.tier) === Number(selectedTier);
              return (
                <Link
                  key={e.tier}
                  href={`/trade?tier=${e.tier}${q ? `&q=${encodeURIComponent(q)}` : ''}${sort !== 'trending' ? `&sort=${encodeURIComponent(sort)}` : ''}`}
                  className={isSelected ? 'pill blue' : 'pill'}
                  aria-current={isSelected ? 'page' : undefined}
                >
                  {e.tier === 1000 ? '1K' : e.tier === 10000 ? '10K' : '100K'}
                  {e.trading_open ? '' : ' · closed'}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
      {!hasEntry ? (
        <p className="flash trade-note">
          <Link href="/league">Join a league</Link> to start trading.
        </p>
      ) : !tradingEntry && entries.length === 1 ? (
        <p className="flash trade-note">
          Trading is closed for this league. <Link href="/league">Join the next one</Link> on the Battles tab.
        </p>
      ) : null}
      <Suspense key={`${q}:${sort}:${selectedTier ?? ''}`} fallback={<section className="card flush" aria-label="Loading stocks" aria-busy="true" />}>
        <StockResults q={q} sort={sort} tier={selectedTier} />
      </Suspense>
      <p className="fineprint">Change is versus the previous close. Prices update about once a minute while the market is open.</p>
    </main>
  );
}

async function StockResults({ q, sort, tier }) {
  const list = await stocks(q, sort);
  return (
    <section className="card flush trade-board" aria-label="Stocks">
      {list.length === 0 ? (
        <p className="empty trade-empty">
          {q ? (
            <>
              No stocks match “{q}”. <Link href="/trade">Show all stocks</Link>
            </>
          ) : (
            'No stocks are listed right now.'
          )}
        </p>
      ) : (
        <StockList stocks={list} tier={tier} />
      )}
    </section>
  );
}
