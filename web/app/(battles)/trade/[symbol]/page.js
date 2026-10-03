import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '../../../../lib/db/auth';
import { entriesForWeek, holdings, joinableWeek, marketOpen, stock, tierInfo, tradeLimits } from '../../../../lib/trading/game';
import { first, money, pct, shareCount, timeET, tone } from '../../../../lib/utils/format';
import { trade } from '../../../../lib/actions';
import AutoRefresh from '../../../../components/layout/refresh';
import Icon from '../../../../components/layout/icons';
import { Flash } from '../../../../components/layout/ui';
import TierPicker from '../../../../components/trade/TierPicker';
import TradeControls from '../../../../components/trade/TradeControls';
import { changeTone, dayChange } from '../../../../components/trade/change';

export default async function StockPage({ params, searchParams }) {
  const [{ symbol: raw }, sp] = await Promise.all([params, searchParams]);
  const user = await requireUser();
  // Next already decodes route params, so decoding again threw URIError on
  // anything containing a stray percent (/trade/%25) and 500'd the page.
  // Sanitising to the ticker alphabet instead turns junk into a clean 404.
  const symbol = String(raw).toUpperCase().replace(/[^A-Z.]/g, '');

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

  const [limits, rows] = entry
    ? await Promise.all([tradeLimits(entry, symbol), holdings(entry.id)])
    : [null, []];
  // holdings() carries the cost basis tradeLimits() doesn't, which is what
  // turns the position into an up/down number.
  const pos = rows.find((r) => r.symbol === symbol) ?? null;
  const gain = pos ? (Number(pos.value) || 0) - (Number(pos.cost_basis) || 0) : 0;
  const held = limits ? limits.shares : 0;
  const change = dayChange(s);
  const info = entry ? tierInfo(entry.tier) : null;
  const canTrade = Boolean(entry?.trading_open) && s.price != null;

  return (
    <main className="trade-detail">
      <AutoRefresh seconds={30} />
      <Link href={entry ? `/trade?tier=${entry.tier}` : '/trade'} className="btn small outline trade-back">
        <Icon name="back" size={16} strokeWidth={2.2} />
        All stocks
      </Link>

      {entries.length > 1 ? (
        <TierPicker entries={entries} tier={entry?.tier} path={`/trade/${symbol}`} />
      ) : null}

      <Flash sp={sp} />

      {/* One ticket: the price, the money, the position, and the buttons. */}
      <section className="hero-card trade-ticket">
        <div className="trade-ticket-id">
          <p className="eyebrow">{s.symbol}</p>
          <h1>{s.name}</h1>
        </div>

        <div className="trade-ticket-numbers">
          <div className="trade-ticket-cell">
            <span className="trade-ticket-label">Price</span>
            <p className="big-number">{s.price != null ? money(s.price) : '—'}</p>
            {change != null ? (
              <p className={`delta ${changeTone(change)}`}>
                {pct(change)} <span>today</span>
              </p>
            ) : null}
            {s.updated_at ? <p className="caption">Updated {timeET(s.updated_at)} ET</p> : null}
          </div>
          {entry ? (
            <div className="trade-ticket-cell">
              <span className="trade-ticket-label">Your cash to spend</span>
              <p className="big-number">{money(limits.available)}</p>
              <p className="caption">{info ? `${info.short} league money` : 'League money'}</p>
            </div>
          ) : null}
        </div>

        {held > 0 ? (
          <p className="trade-ticket-own">
            You own <strong>{shareCount(held)}</strong> {held === 1 ? 'share' : 'shares'}, worth{' '}
            <strong>{money(limits.positionValue)}</strong>,{' '}
            <span className={tone(gain)}>
              {gain < 0 ? 'down' : 'up'} {money(Math.abs(gain))}
            </span>{' '}
            since you bought.
          </p>
        ) : null}

        {canTrade ? (
          <TradeControls
            action={trade}
            symbol={symbol}
            price={Number(s.price)}
            cash={limits.available}
            maxShares={limits.maxShares}
            held={held}
            entryId={String(entry.id)}
            tier={String(entry.tier)}
          />
        ) : (
          <p className="trade-note trade-ticket-note">
            {!entry ? (
              <>
                <Link href="/league">Join a league</Link> to buy {symbol}.
              </>
            ) : !entry.trading_open ? (
              entry.not_started ? (
                <>This league opens Monday at 7:00 AM ET. Come back then to buy {symbol}.</>
              ) : (
                <>
                  Trading is closed for this league. <Link href="/league">Join the next one</Link>.
                </>
              )
            ) : (
              <>{symbol} has no price yet, so it can&apos;t be traded until the next price update.</>
            )}
          </p>
        )}
      </section>

      {s.description || s.industry ? (
        <section className="card trade-about">
          <div className="card-head">
            <h2>About {s.symbol}</h2>
            {s.industry ? <span className="pill">{s.industry}</span> : null}
          </div>
          {s.description ? <p className="small muted trade-desc">{s.description}</p> : null}
        </section>
      ) : null}

      <p className="fineprint">
        Whole shares only. Buys and sells go through right away at the live price, so a tick between page loads moves
        your total with it. Trading stays open all week — Monday 7:00 AM to Sunday 7:00 PM ET.
        {!marketOpen() ? ' The market is closed right now, so the price holds at its last update.' : ''}
      </p>
    </main>
  );
}
