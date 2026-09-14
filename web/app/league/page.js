import Link from 'next/link';
import { requireUser } from '../../lib/auth';
import {
  TIERS,
  currentEntry,
  holdings,
  joinableWeek,
  leaderboard,
  marketOpen,
  orders,
  summarize,
  tierInfo,
} from '../../lib/game';
import { money, ordinal, pct, shareCount, signedMoney, timeET, tone, weekLabel } from '../../lib/format';
import { cancel, join } from '../actions';
import AutoRefresh from '../refresh';
import { Flash } from '../ui';

export default async function LeaguePage({ searchParams }) {
  const sp = await searchParams;
  const user = await requireUser();
  const [entry, ws] = await Promise.all([currentEntry(user.id), joinableWeek()]);

  if (!entry) {
    return (
      <main>
        <Flash sp={sp} />
        <JoinPicker week={ws} first />
      </main>
    );
  }

  const [rows, pending, board] = await Promise.all([
    holdings(entry.id),
    orders(entry.id, { pending: true }),
    leaderboard(entry.room_id),
  ]);
  const s = summarize(entry, rows);
  const info = tierInfo(entry.tier);
  const settled = entry.league_status === 'settled';
  const myRank = board.findIndex((r) => r.entry_id === entry.id) + 1;
  const canJoinNext = entry.week_start < ws;

  return (
    <main>
      <AutoRefresh seconds={30} />
      <Flash sp={sp} />

      {canJoinNext ? <JoinPicker week={ws} /> : null}

      <section className="hero-card">
        <div className="hero-top">
          <div>
            <p className="eyebrow">
              {info.label} · Room {entry.room_number}
            </p>
            <p className="muted small">Week of {weekLabel(entry.week_start)}</p>
          </div>
          <LeagueStatus entry={entry} />
        </div>

        <p className="big-number">{money(s.value)}</p>
        <p className={`delta ${tone(s.profit)}`}>
          {signedMoney(s.profit)} <span>({pct(s.change)})</span>
        </p>

        <dl className="stats">
          <div>
            <dt>{settled ? 'Final place' : 'Place'}</dt>
            <dd>
              {myRank ? ordinal(settled && entry.final_rank ? entry.final_rank : myRank) : '—'}
              <span className="muted"> of {board.length}</span>
            </dd>
          </div>
          <div>
            <dt>Cash</dt>
            <dd>{money(s.cash)}</dd>
          </div>
          <div>
            <dt>{settled ? 'Coins won' : 'Invested'}</dt>
            <dd>{settled ? (entry.coins_awarded ?? 0).toLocaleString() : money(s.invested)}</dd>
          </div>
        </dl>
      </section>

      {settled ? (
        <p className="flash ok">
          This league is final. You finished {ordinal(entry.final_rank)} and earned{' '}
          {(entry.coins_awarded ?? 0).toLocaleString()} coins.
        </p>
      ) : null}

      <section className="card">
        <div className="card-head">
          <h2>Holdings</h2>
          {entry.trading_open ? (
            <Link href="/trade" className="btn small">
              Trade
            </Link>
          ) : null}
        </div>
        {rows.length === 0 ? (
          <p className="empty">
            {entry.trading_open
              ? 'Nothing yet. Tap Trade to buy your first stock. No single stock can be more than 20% of your portfolio, so plan on at least five.'
              : 'No stocks held.'}
          </p>
        ) : (
          <ul className="rows">
            {rows.map((r) => {
              const gain = Number(r.value) - Number(r.cost_basis);
              return (
                <li key={r.symbol}>
                  <Link href={`/trade/${r.symbol}`} className="row">
                    <span className="row-main">
                      <strong>{r.symbol}</strong>
                      <span className="muted small">{shareCount(r.shares)} shares</span>
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

      {pending.length > 0 ? (
        <section className="card">
          <div className="card-head">
            <h2>Pending orders</h2>
            <span className="muted small">{marketOpen() ? 'Fill within a minute' : 'Fill at the open'}</span>
          </div>
          <ul className="rows">
            {pending.map((o) => (
              <li key={o.id} className="row">
                <span className="row-main">
                  <strong>
                    {o.side === 'buy' ? 'Buy' : 'Sell'} {o.symbol}
                  </strong>
                  <span className="muted small">
                    {o.sell_all ? 'All shares' : money(o.amount)} · placed {timeET(o.placed_at)}
                  </span>
                </span>
                <form action={cancel}>
                  <input type="hidden" name="order_id" value={o.id} />
                  <input type="hidden" name="back" value="/league" />
                  <button className="btn small ghost" type="submit">
                    Cancel
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="card">
        <div className="card-head">
          <h2>Leaderboard</h2>
          <span className="muted small">
            Room {entry.room_number} · {board.length} {board.length === 1 ? 'player' : 'players'}
          </span>
        </div>
        <ol className="board">
          {board.map((r, i) => {
            const profit = Number(r.value) - Number(r.starting_balance);
            const me = r.entry_id === entry.id;
            return (
              <li key={r.entry_id} className={me ? 'me' : undefined}>
                <span className="place">{i + 1}</span>
                <span className="who">
                  {r.display_name}
                  {me ? <span className="you">you</span> : null}
                </span>
                <span className={`num ${tone(profit)}`}>{signedMoney(profit)}</span>
              </li>
            );
          })}
        </ol>
        {board.length < 2 ? (
          <p className="empty">You're the first one here. Your room fills up as more players join this league.</p>
        ) : null}
      </section>
    </main>
  );
}

function LeagueStatus({ entry }) {
  if (entry.league_status === 'settled') return <span className="pill">Final</span>;
  if (entry.not_started) return <span className="pill">Starts Monday</span>;
  if (entry.trading_open) {
    return marketOpen() ? <span className="pill live">Market open</span> : <span className="pill">Market closed</span>;
  }
  return <span className="pill">Trading closed</span>;
}

function JoinPicker({ week, first }) {
  return (
    <section className="card join">
      <div className="card-head">
        <h2>{first ? 'Pick your league' : 'Next week is open'}</h2>
        <span className="muted small">Week of {weekLabel(week)}</span>
      </div>
      {first ? (
        <p className="muted">
          Everyone in a league starts with the same play money. Buy and sell real stocks at live
          prices; whoever's portfolio is worth the most when the week ends wins.
        </p>
      ) : null}
      <div className="tiers">
        {TIERS.map((t) => (
          <form key={t.tier} action={join} className="tier">
            <input type="hidden" name="tier" value={t.tier} />
            <span className="tier-name">{t.short}</span>
            <span className="tier-balance">{money(t.tier).replace('.00', '')} to start</span>
            <span className="tier-coins">{t.multiplier}× coins</span>
            <button className="btn primary block" type="submit">
              Join
            </button>
          </form>
        ))}
      </div>
    </section>
  );
}
