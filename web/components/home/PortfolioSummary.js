import { money, pct, shareCount, signedMoney, tone } from '../../lib/utils/format';

// achievementCash is optional: the league cash weekly achievements have paid
// into this entry so far. The spec lists it as part of the portfolio, and it
// is already inside summary.cash, so it is shown as a breakdown line rather
// than added to anything.
export default function PortfolioSummary({ entry, rows, summary, achievementCash = 0 }) {
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
          <span className="ps-label">{totalGain < 0 ? 'Total $ down' : 'Total $ up'}</span>
          <span className={`ps-value ${totalGain >= 0 ? 'up' : 'down'}`}>
            {signedMoney(totalGain)}
          </span>
        </div>
        <div className="ps-stat">
          <span className="ps-label">{totalPct < 0 ? 'Total % down' : 'Total % up'}</span>
          <span className={`ps-value ${totalPct >= 0 ? 'up' : 'down'}`}>
            {pct(totalPct)}
          </span>
        </div>
        {achievementCash > 0 ? (
          <div className="ps-stat">
            <span className="ps-label">From achievements</span>
            <span className="ps-value up">{signedMoney(achievementCash)}</span>
          </div>
        ) : null}
      </div>

      <footer className="portfolio-holdings">
        <p className="eyebrow" style={{ marginBottom: 8 }}>
          Stocks you have bought
        </p>
        {stocks.length === 0 ? (
          <p className="empty-text">You haven&apos;t bought any stocks yet.</p>
        ) : (
          <ul className="holdings-list">
            {stocks.map((r) => {
              // Tone each row by its own gain, not the portfolio's: a losing
              // position used to show green whenever the week was up overall.
              const gain = (Number(r.value) || 0) - (Number(r.cost_basis) || 0);
              return (
                <li key={r.symbol} className="holding-row">
                  <span className="holding-symbol">{r.symbol}</span>
                  <span className="holding-shares">
                    {shareCount(r.shares)} {Number(r.shares) === 1 ? 'share' : 'shares'}
                  </span>
                  {/* Said "$412" next to HoldingsCard's "$438" for the same
                      stock, with nothing to say one was cost and one value. */}
                  <span className="holding-cost">Paid {money(Number(r.cost_basis) || 0)}</span>
                  <span className={`holding-gain ${tone(gain)}`}>{signedMoney(gain)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </footer>
    </section>
  );
}