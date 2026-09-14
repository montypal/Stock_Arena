import Link from 'next/link';
import { requireUser } from '../../lib/auth';
import { currentEntry, marketOpen, stocks } from '../../lib/game';
import { first, money, pct, tone } from '../../lib/format';
import AutoRefresh from '../refresh';
import { Flash, PageHead } from '../ui';

export default async function TradePage({ searchParams }) {
  const sp = await searchParams;
  const user = await requireUser();
  const q = first(sp?.q) ?? '';
  const [entry, list] = await Promise.all([currentEntry(user.id), stocks(q)]);
  const open = marketOpen();

  return (
    <main>
      <AutoRefresh seconds={60} />
      <PageHead eyebrow={open ? 'Market open' : 'Market closed'} title="Trade" />
      <Flash sp={sp} />

      {!entry ? (
        <p className="flash">
          <Link href="/league">Join a league</Link> to start trading.
        </p>
      ) : !entry.trading_open ? (
        <p className="flash">Trading is closed for this league. Next week opens on the League tab.</p>
      ) : null}

      <form className="search" role="search">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name or symbol"
          aria-label="Search stocks"
          autoComplete="off"
        />
      </form>

      <section className="card flush">
        {list.length === 0 ? (
          <p className="empty">No stocks match “{q}”.</p>
        ) : (
          <ul className="rows">
            {list.map((s) => {
              const change = s.price != null && s.prev_close ? s.price / s.prev_close - 1 : null;
              return (
                <li key={s.symbol}>
                  <Link href={`/trade/${s.symbol}`} className="row">
                    <span className="row-main">
                      <strong>{s.symbol}</strong>
                      <span className="muted small">{s.name}</span>
                    </span>
                    <span className="row-side">
                      <span className="num">{s.price != null ? money(s.price) : '—'}</span>
                      {change != null ? (
                        <span className={`num small ${tone(change)}`}>{pct(change)}</span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <p className="fineprint">Change is versus the previous close. Prices update about once a minute while the market is open.</p>
    </main>
  );
}
