import Link from 'next/link';
import { money, pct, shareCount, signedMoney, tone } from '../../lib/utils/format';
import { tierInfo } from '../../lib/trading/game';

// The player's money in one league, at the top of /trade: what's left to
// spend, what the portfolio is worth, profit, and every stock they own.
// Each holding links back to its stock page so buying more is one tap.
export default function WalletStrip({ entry, rows, summary }) {
  const info = tierInfo(entry.tier);
  const spent = rows.reduce((sum, r) => sum + (Number(r.cost_basis) || 0), 0);
  // One tone for profit in dollars and in percent so sign and colour agree.
  const t = tone(summary.profit);

  return (
    <section className="card trade-wallet" aria-label="Your money in this league">
      <div className="card-head">
        <h2>Your money</h2>
        {info ? <span className="pill">{info.short} league</span> : null}
      </div>

      <div className="trade-wallet-grid">
        <div className="trade-wallet-cell">
          <span className="trade-wallet-label">Cash to spend</span>
          <span className="trade-wallet-figure">
            <strong className="trade-wallet-value">{money(summary.cash)}</strong>
          </span>
        </div>
        <div className="trade-wallet-cell">
          <span className="trade-wallet-label">Portfolio</span>
          <span className="trade-wallet-figure">
            <strong className="trade-wallet-value">{money(summary.value)}</strong>
          </span>
        </div>
        <div className="trade-wallet-cell">
          <span className="trade-wallet-label">Profit</span>
          <span className="trade-wallet-figure">
            <strong className={`trade-wallet-value ${t}`}>{signedMoney(summary.profit)}</strong>
            <span className={`trade-wallet-sub ${t}`}>{pct(summary.change)}</span>
          </span>
        </div>
        <div className="trade-wallet-cell">
          <span className="trade-wallet-label">Stocks owned</span>
          <span className="trade-wallet-figure">
            <strong className="trade-wallet-value">{rows.length}</strong>
            {rows.length > 0 ? <span className="trade-wallet-sub">{money(spent)} spent</span> : null}
          </span>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="empty trade-mine-empty">You don&apos;t own any stocks yet. Pick one below to make your first buy.</p>
      ) : (
        <ul className="trade-mine">
          {rows.map((r) => {
            const value = Number(r.value) || 0;
            const gain = value - (Number(r.cost_basis) || 0);
            return (
              <li key={r.symbol}>
                <Link href={`/trade/${r.symbol}?tier=${entry.tier}`} className="trade-mine-row">
                  <strong className="trade-mine-sym">{r.symbol}</strong>
                  <span className="trade-mine-shares">{shareCount(r.shares)} shares</span>
                  <span className="trade-mine-value">{money(value)}</span>
                  <span className={`trade-mine-gain ${tone(gain)}`}>{signedMoney(gain)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
