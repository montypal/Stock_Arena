// Reads the price cache the Railway worker writes to. Proves the full chain:
// worker -> Postgres -> web. Renders fine with no database attached yet.

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

  return (
    <div className={`status ${tone}`}>
      <span className="dot" />
      <div>
        <strong>{label}</strong>
        {message ? <div className="msg">{message}</div> : null}
      </div>
    </div>
  );
}

export default async function Page() {
  const { state, rows, message } = await getPrices();

  return (
    <main>
      <header>
        <p className="eyebrow">StockArena · Infrastructure</p>
        <h1>Price cache</h1>
        <p className="lede">
          The worker on Railway polls quotes and writes them here. This page reads
          the database directly — it never calls the data vendor.
        </p>
      </header>

      <Status state={state} count={rows.length} message={message} />

      {rows.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th className="num">Price</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.symbol}>
                <td className="sym">{r.symbol}</td>
                <td className="num">
                  {Number(r.price).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="when">
                  {new Date(r.updated_at).toLocaleTimeString('en-US', {
                    timeZone: 'America/New_York',
                  })}{' '}
                  ET
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <footer>
        Next step: finalize the gameplay plan in <code>docs/</code>, then model
        leagues, entries, and positions.
      </footer>
    </main>
  );
}
