import Link from 'next/link';
import { money, shareCount, signedMoney, tone } from '../../lib/utils/format';

// The stocks in the player's current league, each linking to its trade
// screen, with market value and gain against what the player paid.
//
// rows        - holdings(entry.id)
// tradingOpen - entry.trading_open
// tier        - entry.tier, carried into every /trade link. Without it the
//               trade screen falls back to the player's first open entry, so
//               tapping a 100K holding could put them in the 1K league.
export default function HoldingsCard({ rows, tradingOpen, tier }) {
  const empty = rows.length === 0;
  const qs = tier ? `?tier=${tier}` : '';

  return (
    <section className="card" aria-labelledby="home-holdings-title">
      <div className="card-head">
        <h2 id="home-holdings-title">Your stocks</h2>
        {tradingOpen ? (
          <Link href={`/trade${qs}`} className="btn small outline">
            Trade
          </Link>
        ) : null}
      </div>

      {empty ? (
        <>
          <p className="empty">
            {tradingOpen ? 'Nothing yet. Pick any stocks you like — buy as much as you can afford.' : 'No stocks held.'}
          </p>
          {tradingOpen ? (
            <Link href={`/trade${qs}`} className="btn primary block">
              Buy your first stock
            </Link>
          ) : null}
        </>
      ) : (
        <ul className="rows home-list">
          {rows.map((r) => {
            const gain = Number(r.value) - Number(r.cost_basis);
            return (
              <li key={r.symbol}>
                <Link href={`/trade/${r.symbol}${qs}`} className="row">
                  <span className="row-main">
                    <strong>{r.symbol}</strong>
                    <span className="sub">
                      {shareCount(r.shares)} {Number(r.shares) === 1 ? 'share' : 'shares'}
                      {r.name ? ` · ${r.name}` : ''}
                    </span>
                  </span>
                  <span className="row-side">
                    <span className="num">{money(r.value)}</span>
                    <span className={`num small ${tone(gain)}`}>{signedMoney(gain)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
