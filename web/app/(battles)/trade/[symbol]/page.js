import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '../../../../lib/db/auth';
import { POSITION_CAP, currentEntry, marketOpen, orders, stock, tradeLimits } from '../../../../lib/trading/game';
import { money, pct, shareCount, timeET } from '../../../../lib/utils/format';
import { cancel, trade } from '../../../../lib/actions';
import AutoRefresh from '../../../../components/layout/refresh';
import Icon from '../../../../components/layout/icons';
import { Flash } from '../../../../components/layout/ui';
import DollarField from '../../../../components/trade/DollarField';
import { changeTone, dayChange } from '../../../../components/trade/change';

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
  const change = dayChange(s);
  const canTrade = entry?.trading_open && s.price != null;
  const holding = Boolean(limits && limits.shares > 0);
  const canSell = canTrade && holding;
  const maxSell = holding ? Math.floor(limits.positionValue * 100) / 100 : 0;
  const capPct = Math.round(POSITION_CAP * 100);
  const back = `/trade/${symbol}`;

  return (
    <main className="trade-detail">
      <AutoRefresh seconds={30} />
      <Link href="/trade" className="btn small outline trade-back">
        <Icon name="back" size={16} strokeWidth={2.2} />
        All stocks
      </Link>

      <div className="split">
        <div className="col">
          <header className="hero-card trade-quote">
            <div className="trade-quote-id">
              <p className="eyebrow">{s.symbol}</p>
              <h1>{s.name}</h1>
            </div>
            <div className="trade-quote-price">
              <p className="big-number">{s.price != null ? money(s.price) : '—'}</p>
              {change != null ? (
                <p className={`delta ${changeTone(change)}`}>
                  {pct(change)} <span>today</span>
                </p>
              ) : null}
              {s.updated_at ? <p className="caption">Updated {timeET(s.updated_at)} ET</p> : null}
            </div>
          </header>

          <Flash sp={sp} />

          {holding ? (
            <section className="card trade-position">
              <div className="card-head">
                <h2>Your position</h2>
              </div>
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
        </div>

        <div className={`col trade-actions${canSell ? ' trade-actions-sell' : ''}`}>
          {!entry ? (
            <p className="flash trade-note">
              <Link href="/league">Join a league</Link> to trade {symbol}.
            </p>
          ) : !entry.trading_open ? (
            <p className="flash trade-note">
              Trading is closed for this league. <Link href="/league">Join the next one</Link> on
              the Battles tab.
            </p>
          ) : s.price == null ? (
            <p className="flash trade-note">
              {symbol} doesn&apos;t have a price yet. Check back after the next update.
            </p>
          ) : null}

          {canTrade ? (
            <section className="card trade-buy">
              <div className="card-head">
                <h2>Buy</h2>
              </div>
              <form action={trade} className="stack">
                <input type="hidden" name="symbol" value={symbol} />
                <input type="hidden" name="side" value="buy" />
                <DollarField
                  max={limits.maxBuy >= 1 ? limits.maxBuy : undefined}
                  disabled={limits.maxBuy < 1}
                  hint={`Up to ${money(limits.maxBuy)}. ${
                    limits.capRoom < limits.available
                      ? `No stock can be more than ${capPct}% of your portfolio.`
                      : "That's your available cash."
                  }`}
                />
                <button className="btn primary block" type="submit" disabled={limits.maxBuy < 1}>
                  Place buy order
                </button>
              </form>
            </section>
          ) : null}

          {canSell ? (
            <section className="card trade-sell">
              <div className="card-head">
                <h2>Sell</h2>
              </div>
              <form action={trade} className="stack">
                <input type="hidden" name="symbol" value={symbol} />
                <input type="hidden" name="side" value="sell" />
                <DollarField max={maxSell} hint={`Up to ${money(maxSell)}. To sell every share, use Sell all.`} />
                <button className="btn outline block" type="submit">
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
            <section className="card trade-pending">
              <div className="card-head">
                <h2>Pending orders</h2>
                <span className="pill">{pendingHere.length}</span>
              </div>
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
        </div>
      </div>

      <p className="fineprint">
        Orders fill at the next price update after you place them, not the price shown here, so
        nobody can trade on a stale quote.{' '}
        {marketOpen()
          ? 'That usually takes under a minute.'
          : 'While the market is closed, orders fill at the open.'}
      </p>
    </main>
  );
}
