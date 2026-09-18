// Reads the price cache the Railway worker writes to. Proves the full chain:
// worker -> Postgres -> web. Renders fine with no database attached yet.
// Reachable signed in or signed out.

import { PageHead } from '../../../components/layout/ui';

export const dynamic = 'force-dynamic';

async function getPrices() {
  if (!process.env.DATABASE_URL) return { state: 'no-db', rows: [] };

  try {
    const { Client } = await import('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();
    const res = await client.query(
      'SELECT symbol, price, updated_at FROM latest_price ORDER BY symbol'
    );
    await client.end();
    return { state: 'ok', rows: res.rows };
  } catch (err) {
    return { state: 'error', rows: [], message: err.message };
  }
}

function Status({ state, count, message }) {
  const label = {
    'no-db': 'No database attached yet',
    error: 'Database unreachable',
    ok: count > 0 ? `${count} symbols cached` : 'Connected, no prices written yet',
  }[state];

  const tone = state === 'ok' && count > 0 ? 'ok' : state === 'error' ? 'bad' : 'wait';
  // Glass has no border: the state shows as a tinted rim on the card.
  const rim = { ok: 'rim-ok', bad: 'rim-bad', wait: 'rim-gold' }[tone];

  return (
    <section className={`card acct-status is-${tone} ${rim}`} role="status">
      <p className="eyebrow">Price cache status</p>
      <div className="acct-status-line">
        <span className="acct-status-dot" aria-hidden="true" />
        <div className="acct-status-text">
          <strong>{label}</strong>
          {message ? <p className="acct-status-msg">{message}</p> : null}
        </div>
      </div>
    </section>
  );
}

export default async function Page() {
  const { state, rows, message } = await getPrices();

  return (
    <main>
      <PageHead
        eyebrow="StockArena · Infrastructure"
        title="Price"
        accent="cache"
        sub="The worker on Railway polls quotes and writes them here. This page reads the database directly — it never calls the data vendor."
      />

      <Status state={state} count={rows.length} message={message} />

      {rows.length > 0 && (
        <section className="card acct-prices-card">
          <div className="card-head">
            <h2>Cached prices</h2>
          </div>
          <ul className="acct-list acct-prices">
            {rows.map((r) => (
              <li key={r.symbol} className="row">
                <span className="row-main">
                  <strong>{r.symbol}</strong>
                </span>
                <span className="row-side">
                  <span className="num">
                    {Number(r.price).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className="sub">
                    {new Date(r.updated_at).toLocaleTimeString('en-US', {
                      timeZone: 'America/New_York',
                    })}{' '}
                    ET
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="fineprint">
        Read-only: every visit re-reads the latest cached price per symbol. Times are US Eastern.
      </p>
    </main>
  );
}
