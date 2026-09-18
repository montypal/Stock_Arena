import Link from 'next/link';
import { Suspense } from 'react';
import { requireUser } from '../../../lib/db/auth';
import { currentEntry, marketOpen, stocks } from '../../../lib/trading/game';
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
  const entry = await currentEntry(user.id);
  const open = marketOpen();

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
          {q && list.length > 0 ? (
            <p className="caption trade-count">
              {list.length} {list.length === 1 ? 'result' : 'results'} for “{q}” ·{' '}
              <Link href="/trade">Clear search</Link>
            </p>
          ) : null}
        </div>
      </div>

      <Flash sp={sp} />

      {!entry ? (
        <p className="flash trade-note">
          <Link href="/league">Join a league</Link> to start trading.
        </p>
      ) : !entry.trading_open ? (
        <p className="flash trade-note">
          Trading is closed for this league. <Link href="/league">Join the next one</Link> on the
          Battles tab.
        </p>
      ) : null}

      <Suspense key={`${q}:${sort}`} fallback={<section className="card flush" aria-label="Loading stocks" aria-busy="true" />}>
        <StockResults q={q} sort={sort} />
      </Suspense>

      <p className="fineprint">
        Change is versus the previous close. Prices update about once a minute while the market is
        open.
      </p>
    </main>
  );
}

async function StockResults({ q, sort }) {
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
        <StockList stocks={list} />
      )}
    </section>
  );
}
