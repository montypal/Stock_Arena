import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '../../../lib/auth';
import { POSITION_CAP, currentEntry, marketOpen, orders, stock, tradeLimits } from '../../../lib/game';
import { money, pct, shareCount, timeET, tone } from '../../../lib/format';
import { cancel, trade } from '../../actions';
import AutoRefresh from '../../refresh';
import { Flash } from '../../ui';

export default async function StockPage({ params, searchParams }) {
  const [{ symbol: raw }, sp] = await Promise.all([params, searchParams]);
  const user = await requireUser();
  const symbol = decodeURIComponent(raw).toUpperCase();

  const s = await stock(symbol);
  if (!s) notFound();

  const entry = await currentEntry(user.id);
  const [limits, pending] = entry
    ? await Promise.all([tradeLimits(entry, symbol), orders(entry.id, { pending: true })])
    : [null, []];
  const pendingHere = pending.filter((o) => o.symbol === symbol);
  const change = s.price != null && s.prev_close ? s.price / s.prev_close - 1 : null;
  const canTrade = entry?.trading_open && s.price != null;
  const back = `/trade/${symbol}`;

  return (
    <main>
      <AutoRefresh seconds={30} />
      <Link href="/trade" className="backlink">
        ← All stocks
      </Link>

      <header className="stock-head">
        <p className="eyebrow">{s.symbol}</p>
        <h1>{s.name}</h1>
        <p className="big-number">{s.price != null ? money(s.price) : '—'}</p>
        {change != null ? (
          <p className={`delta ${tone(change)}`}>
            {pct(change)} <span>today</span>
          </p>
        ) : null}
        {s.updated_at ? <p className="muted small">Updated {timeET(s.updated_at)} ET</p> : null}
      </header>

      <Flash sp={sp} />

      {limits && limits.shares > 0 ? (
        <section className="card">
          <h2>Your position</h2>
          <dl className="stats">
            <div>
              <dt>Shares</dt>
              <dd>{shareCount(limits.shares)}</dd>
            </div>
            <div>
              <dt>Value</dt>
              <dd>{money(limits.positionValue)}</dd>
            </div>
            <div>
              <dt>Of portfolio</dt>
              <dd>{pct(limits.positionValue / limits.portfolio).replace('+', '')}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      {!entry ? (
        <p className="flash">
          <Link href="/league">Join a league</Link> to trade {symbol}.
        </p>
      ) : !entry.trading_open ? (
        <p className="flash">Trading is closed for this league.</p>
      ) : s.price == null ? (
        <p className="flash">{symbol} doesn&apos;t have a price yet. Check back after the next update.</p>
      ) : null}

      {canTrade ? (
        <section className="card">
          <h2>Buy</h2>
          <form action={trade} className="stack">
            <input type="hidden" name="symbol" value={symbol} />
            <input type="hidden" name="side" value="buy" />
            <label className="field">
              <span>Amount in dollars</span>
              <input
                type="number"
                name="amount"
                inputMode="decimal"
                min="1"
                max={limits.maxBuy >= 1 ? limits.maxBuy : undefined}
                step="0.01"
                placeholder="0.00"
                required
                disabled={limits.maxBuy < 1}
              />
              <small>
                You can buy up to {money(limits.maxBuy)}.{' '}
                {limits.capRoom < limits.available
                  ? `No stock can be more than ${POSITION_CAP * 100}% of your portfolio.`
                  : `That's your available cash.`}
              </small>
            </label>
            <button className="btn primary block" type="submit" disabled={limits.maxBuy < 1}>
              Place buy order
            </button>
          </form>
        </section>
      ) : null}

      {canTrade && limits.shares > 0 ? (
        <section className="card">
          <h2>Sell</h2>
          <form action={trade} className="stack">
            <input type="hidden" name="symbol" value={symbol} />
            <input type="hidden" name="side" value="sell" />
            <label className="field">
              <span>Amount in dollars</span>
              <input
                type="number"
                name="amount"
                inputMode="decimal"
                min="1"
                max={Math.floor(limits.positionValue * 100) / 100}
                step="0.01"
                placeholder="0.00"
                required
              />
            </label>
            <button className="btn block" type="submit">
              Place sell order
            </button>
          </form>
          <form action={trade}>
            <input type="hidden" name="symbol" value={symbol} />
            <input type="hidden" name="side" value="sell" />
            <input type="hidden" name="all" value="1" />
            <button className="btn ghost block" type="submit">
              Sell all {symbol}
            </button>
          </form>
        </section>
      ) : null}

      {pendingHere.length > 0 ? (
        <section className="card">
          <h2>Pending</h2>
          <ul className="rows">
            {pendingHere.map((o) => (
              <li key={o.id} className="row">
                <span className="row-main">
                  <strong>{o.side === 'buy' ? 'Buy' : 'Sell'}</strong>
                  <span className="muted small">
                    {o.sell_all ? 'All shares' : money(o.amount)} · placed {timeET(o.placed_at)}
                  </span>
                </span>
                <form action={cancel}>
                  <input type="hidden" name="order_id" value={o.id} />
                  <input type="hidden" name="back" value={back} />
                  <button className="btn small ghost" type="submit">
                    Cancel
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="fineprint">
        Orders fill at the next price update after you place them, not the price shown here, so
        nobody can trade on a stale quote.{' '}
        {marketOpen() ? 'That usually takes under a minute.' : 'While the market is closed, orders fill at the open.'}
      </p>
    </main>
  );
}
