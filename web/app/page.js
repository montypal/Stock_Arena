import Link from 'next/link';
import { currentUser } from '../lib/db/auth';
import { currentEntry, holdings, leaderboard, summarize, tierInfo } from '../lib/trading/game';
import { money, ordinal, pct, signedMoney, tone, weekLabel } from '../lib/utils/format';

export default async function Home() {
  const user = await currentUser();
  if (!user) {
    return (
      <main className="landing">
        <p className="eyebrow">Weekly stock leagues</p>
        <h1 className="wordmark">
          Stock<span>Arena</span>
        </h1>
        <p className="lede">
          Real market prices. Fake money. One week to grow your portfolio more than everyone in
          your room.
        </p>

        <ul className="pitch">
          <li>
            <strong>Pick a league.</strong> Start with $1,000, $10,000, or $100,000 in play money.
          </li>
          <li>
            <strong>Trade real stocks.</strong> Apple, NVIDIA, Tesla and more, at live prices.
          </li>
          <li>
            <strong>Climb the leaderboard.</strong> Finish on top when the week ends and earn coins.
          </li>
        </ul>

        <div className="cta">
          <Link href="/login" className="btn primary block">
            Log in
          </Link>
        </div>

        <p className="fineprint">
          No real money or real shares, ever. StockArena is a game, not investment advice.
        </p>
      </main>
    );
  }

  const entry = await currentEntry(user.id);
  if (!entry) {
    return (
      <main>
        <header className="pagehead">
          <p className="eyebrow">Home</p>
          <h1>Welcome, {user.display_name}</h1>
          <p className="muted small">Pick a battle to start trading this week.</p>
        </header>
        <section className="card">
          <h2>No active battle</h2>
          <p className="muted small">Join a league to get your play money and start picking stocks.</p>
          <Link href="/league" className="btn primary block">
            Find a battle
          </Link>
        </section>
        <nav className="quicklinks" aria-label="Quick links">
          <Link href="/league" className="quicklink">
            <strong>Battles</strong>
            <span>Trade &amp; leaderboard</span>
          </Link>
          <Link href="/daily" className="quicklink">
            <strong>Daily</strong>
            <span>Today&apos;s market news</span>
          </Link>
          <Link href="/progress" className="quicklink">
            <strong>Progress</strong>
            <span>Coins &amp; career</span>
          </Link>
        </nav>
      </main>
    );
  }

  const [rows, board] = await Promise.all([holdings(entry.id), leaderboard(entry.room_id)]);
  const s = summarize(entry, rows);
  const info = tierInfo(entry.tier);
  const settled = entry.league_status === 'settled';
  const myRank = board.findIndex((r) => r.entry_id === entry.id) + 1;

  return (
    <main>
      <header className="pagehead">
        <p className="eyebrow">Home · {info.label}</p>
        <h1>Welcome, {user.display_name}</h1>
        <p className="muted small">Week of {weekLabel(entry.week_start)} · Room {entry.room_number}</p>
      </header>

      <section className="hero-card">
        <div className="hero-top">
          <div>
            <p className="eyebrow">Portfolio value</p>
          </div>
          <span className="pill live">Overview</span>
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

      <nav className="quicklinks" aria-label="Quick links">
        <Link href="/league" className="quicklink">
          <strong>Battles</strong>
          <span>Trade &amp; leaderboard</span>
        </Link>
        <Link href="/daily" className="quicklink">
          <strong>Daily</strong>
          <span>Today&apos;s market news</span>
        </Link>
        <Link href="/progress" className="quicklink">
          <strong>Progress</strong>
          <span>Coins &amp; career</span>
        </Link>
      </nav>

      <section className="card">
        <div className="card-head">
          <h2>This battle</h2>
          <Link href="/league" className="btn small">
            Open Battles
          </Link>
        </div>
        <p className="muted small">
          {settled
            ? `Final: ${ordinal(entry.final_rank)} of ${board.length}. Earnings are settled in coins.`
            : myRank
              ? `You are ${ordinal(myRank)} of ${board.length}. Keep trading to take the lead.`
              : 'Your room is filling up as more players join this league.'}
        </p>
      </section>
    </main>
  );
}
