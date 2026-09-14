import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '../lib/auth';

export default async function Home() {
  if (await currentUser()) redirect('/league');

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
        <Link href="/signup" className="btn primary block">
          Create an account
        </Link>
        <Link href="/login" className="btn ghost block">
          I already have one
        </Link>
      </div>

      <p className="fineprint">
        No real money or real shares, ever. StockArena is a game, not investment advice.
      </p>
    </main>
  );
}
