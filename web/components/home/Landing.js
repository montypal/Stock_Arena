import Icon from '../layout/icons';
import DeviceEntry from '../auth/DeviceEntry';
import { TIERS } from '../../lib/trading/game';

// Signed-out home: what StockArena is, one way in, and the three steps of a
// league week. There is no login or sign-up page while testing: the way in is
// the device sign-in (DeviceEntry, anchored at #join), where a real person
// picks the player name everyone else sees. "Drop in" here and in the header
// jump to it.
//
// The hero text sits straight on the moving background (home.css gives it a
// brighter colour and a dark halo so it stays readable); the status pill is
// its own small piece of glass.
//
// open - whether the US market is open right now (marketOpen())
export default function Landing({ open }) {
  const stakes = TIERS.map((t) => `$${t.short}`);
  const stakesText = `${stakes.slice(0, -1).join(', ')} or ${stakes[stakes.length - 1]}`;

  const steps = [
    { icon: 'target', title: 'Pick a league', body: `Start with ${stakesText} in play money.` },
    { icon: 'chart', title: 'Trade real stocks', body: 'Buy and sell at live market prices.' },
    {
      icon: 'trophy',
      title: 'Top your room',
      body: 'The best portfolio when the week ends earns coins.',
    },
  ];

  return (
    <main className="home-landing">
      <section className="home-hero" aria-labelledby="home-hero-title">
        <p className={open ? 'pill live glass rim-accent home-status' : 'pill glass home-status'}>
          {open ? <span className="live-dot" aria-hidden="true" /> : null}
          {open ? 'Market open' : 'Market closed'}
        </p>

        <h1 id="home-hero-title" className="home-title">
          <span className="home-title-lead">Pick stocks.</span> <span>Beat your</span>{' '}
          <span>friends.</span> <span>Win.</span>
        </h1>

        <p className="home-lede">
          Fantasy sports, but for stocks. Build a portfolio, compete in weekly battles, climb the
          leaderboard.
        </p>

        <a href="#join" className="btn primary xl home-drop">
          <Icon name="zap" size={20} strokeWidth={2.2} />
          Drop in
        </a>
        <p className="home-note">No password needed while we&apos;re testing.</p>
      </section>

      <div className="home-join">
        <DeviceEntry />
      </div>

      <section className="home-how" aria-labelledby="home-how-title">
        <h2 id="home-how-title" className="eyebrow">
          How it works
        </h2>
        <ol className="home-steps">
          {steps.map((s, i) => (
            <li key={s.title} className="card home-step">
              <div className="home-step-top">
                <span className="home-step-icon">
                  <Icon name={s.icon} size={22} strokeWidth={2} />
                </span>
                <span className="caption">Step {i + 1}</span>
              </div>
              <h3>{s.title}</h3>
              <p className="muted small">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <p className="fineprint home-fineprint">
        No real money or real shares, ever. StockArena is a game, not investment advice.
      </p>
    </main>
  );
}
