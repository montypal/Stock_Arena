import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '../../../../lib/db/auth';
import { entriesForWeek, holdings, joinableWeek, leaderboard, marketOpen, stock, summarize, tradeLimits } from '../../../../lib/trading/game';
import { first } from '../../../../lib/utils/format';
import { money, pct, shareCount, timeET } from '../../../../lib/utils/format';
import { cancel, trade } from '../../../../lib/actions';
import AutoRefresh from '../../../../components/layout/refresh';
import Icon from '../../../../components/layout/icons';
import SubmitButton from '../../../../components/layout/SubmitButton';
import { Flash } from '../../../../components/ui';
import PortfolioSummary from '../../../../components/home/PortfolioSummary';
import ShareStepper from '../../../../components/trade/ShareStepper';
import BuySharesForm from '../../../../components/trade/BuySharesForm';
import { changeTone, dayChange } from '../../../../components/trade/change';

export default async function StockPage({ params, searchParams }) {
  const [{ symbol: raw }, sp] = await Promise.all([params, searchParams]);
  const user = await requireUser();
  const symbol = decodeURIComponent(raw).toUpperCase();

  const s = await stock(symbol);
  if (!s) notFound();

  const ws = await joinableWeek();
  const entries = await entriesForWeek(user.id, ws);
  let entry = null;
  if (entries.length > 0) {
    const rawTier = String(first(sp?.tier) ?? '').trim();
    const wanted = Number(rawTier) || null;
    entry = wanted ? entries.find((e) => Number(e.tier) === wanted) : null;
    if (!entry) entry = entries.find((e) => e.trading_open) || entries[0];
  }
  const showPicker = entries.length > 1;

  const [limits, rows] = entry
    ? await Promise.all([tradeLimits(entry, symbol), holdings(entry.id)])
    : [null, []];
  const summary = summarize(entry, rows);
  const board = await leaderboard(entry?.room_id ?? 0);
  const place = entry ? board.findIndex((r) => r.entry_id === entry.id) + 1 : 0;
  const change = dayChange(s);
  const canTrade = entry?.trading_open && s.price != null;
  const holding = Boolean(limits && limits.shares > 0);
  const canSell = canTrade && holding;
  const back = `/trade/${symbol}${entry ? `?tier=${entry.tier}` : ''}`;

  return (
    <main className="trade-detail">
      <AutoRefresh seconds={30} />
      <Link href="/trade" className="btn small outline trade-back">
        <Icon name="back" size={16} strokeWidth={2.2} />
        All stocks
      </Link>

      {showPicker ? (
        <div className="card" style={{ marginBottom: 12 }}>
          <p className="eyebrow" style={{ marginBottom: 8 }}>
            Trading in
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {entries.map((e) => {
              const isSelected = Number(e.tier) === Number(entry.tier);
              return (
                <Link
                  key={e.tier}
                  href={`/trade/${symbol}?tier=${e.tier}`}
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
              {s.description ? <p className="caption trade-desc">{s.description}</p> : null}
              {s.industry && <p className="caption trade-industry">{s.industry}</p>}
            </div>
          </header>

          <Flash sp={sp} />

          {holding ? (
            <section className="card trade-position">
              <div className="card-head">
                <h2>Your position</h2>
                {entry ? <span className="pill">{entry.tier === 1000 ? '1K' : entry.tier === 10000 ? '10K' : '100K'}</span> : null}
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

        <aside className="col">
          <PortfolioSummary entry={entry} rows={rows} summary={summary} />
          {canTrade ? (
            <section className="card trade-buy">
              <div className="card-head">
                <h2>Buy</h2>
              </div>
              <form action={trade} className="stack">
                <input type="hidden" name="symbol" value={symbol} />
                <input type="hidden" name="side" value="buy" />
                {entry ? <input type="hidden" name="entry_id" value={String(entry.id)} /> : null}
                {entry ? <input type="hidden" name="tier" value={String(entry.tier)} /> : null}
                <BuySharesForm symbol={symbol} price={Number(s.price)} available={limits.available} maxShares={limits.maxShares} />
                <SubmitButton className="btn primary block" pendingLabel="Placing order…">
                  Buy {symbol}
                </SubmitButton>
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
                {entry ? <input type="hidden" name="entry_id" value={String(entry.id)} /> : null}
                {entry ? <input type="hidden" name="tier" value={String(entry.tier)} /> : null}
                <ShareStepper min={0} max={limits.shares} defaultValue={limits.shares} hint={`You own ${limits.shares} shares. Use Sell all to sell everything.`} />
                <SubmitButton className="btn outline block" pendingLabel="Placing order…">
                  Place sell order
                </SubmitButton>
              </form>
              <form action={trade}>
                <input type="hidden" name="symbol" value={symbol} />
                <input type="hidden" name="side" value="sell" />
                <input type="hidden" name="all" value="1" />
                {entry ? <input type="hidden" name="entry_id" value={String(entry.id)} /> : null}
                {entry ? <input type="hidden" name="tier" value={String(entry.tier)} /> : null}
                <SubmitButton className="btn ghost block" pendingLabel="Selling…">
                  Sell all {symbol}
                </SubmitButton>
              </form>
            </section>
          ) : null}

          {/* No pending orders — orders execute immediately now. */}
        </aside>
      </div>

      <p className="fineprint">
        Orders execute immediately at the price shown, not queued for later — what you see is what you get.
        {!marketOpen() ? ' The market is closed right now, so trading is disabled.' : ''}
      </p>
    </main>
  );
}