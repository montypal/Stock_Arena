import { money, pct, signedMoney } from '../../lib/utils/format';

export default function PortfolioSummary({ entry, rows, summary }) {
  const totalGain = summary.profit;
  const totalPct = summary.change;
  const cash = summary.cash;
  const stocks = rows;

  return (
    <section className="card portfolio-summary">
      <header className="card-head">
        <h2>Your portfolio</h2>
      </header>

      <div className="portfolio-stats">
        <div className="ps-stat">
          <span className="ps-label">Money left to spend</span>
          <span className="ps-value">{money(cash)}</span>
        </div>
        <div className="ps-stat">
          <span className="ps-label">Total $ up</span>
          <span className={`ps-value ${totalGain >= 0 ? 'up' : 'down'}`}>
            {signedMoney(totalGain)}
          </span>
        </div>
        <div className="ps-stat">
          <span className="ps-label">Total % up</span>
          <span className={`ps-value ${totalPct >= 0 ? 'up' : 'down'}`}>
            {pct(totalPct)}
          </span>
        </div>
      </div>

      <footer className="portfolio-holdings">
        <p className="eyebrow" style={{ marginBottom: 8 }}>
          Stocks you have bought
        </p>
        {stocks.length === 0 ? (
          <p className="empty-text">You haven&apos;t bought any stocks yet.</p>
        ) : (
          <ul className="holdings-list">
            {stocks.map((r) => (
              <li key={r.symbol} className="holding-row">
                <span className="holding-symbol">{r.symbol}</span>
                <span className="holding-shares">{r.shares} shares</span>
                <span className="holding-cost">{money(Number(r.cost_basis) || 0)}</span>
                <span className={`holding-gain ${totalGain >= 0 ? 'up' : 'down'}`}>
                  {signedMoney((Number(r.value) || 0) - (Number(r.cost_basis) || 0))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </footer>
    </section>
  );
}