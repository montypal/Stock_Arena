import { requireUser } from '../../../lib/db/auth';
import { PageHead } from '../../../components/layout/ui';

const NEWS = [
  {
    tag: 'Markets',
    title: 'Futures point to a flat open as traders await jobs data',
    source: 'Arena Wire',
    time: 'Today · 8:12 AM ET',
    blurb: 'Index futures hovered near unchanged. League portfolios with heavy tech exposure start the day near the top of the board.',
  },
  {
    tag: 'Movers',
    title: 'Mega-cap tech mixed: chips up, cloud down',
    source: 'Arena Wire',
    time: 'Today · 7:40 AM ET',
    blurb: 'Semiconductor names caught an early bid while software lagged. Diversified baskets are holding rank best so far.',
  },
  {
    tag: 'Strategy',
    title: 'Reminder: no single stock can top 20% of your portfolio',
    source: 'League Desk',
    time: 'Today · 7:00 AM ET',
    blurb: 'Plan on at least five positions. Leaders this week are spread across four or more tickers.',
  },
  {
    tag: 'Schedule',
    title: 'Market hours: orders fill within a minute when open',
    source: 'League Desk',
    time: 'Yesterday · 4:05 PM ET',
    blurb: 'Orders placed while closed queue for the open. Pending orders can be cancelled from Battles.',
  },
];

export default async function DailyPage() {
  await requireUser();
  return (
    <main>
      <PageHead eyebrow="Daily" title="Today in the Arena">
        <p className="muted small">A static placeholder feed. Real news integration comes later.</p>
      </PageHead>
      {NEWS.map((n) => (
        <article key={n.title} className="card">
          <div className="card-head">
            <span className="pill live">{n.tag}</span>
            <span className="muted small">{n.time}</span>
          </div>
          <h2>{n.title}</h2>
          <p className="muted small">
            {n.source} · {n.blurb}
          </p>
        </article>
      ))}
      <p className="fineprint">Placeholder content only — not real market news.</p>
    </main>
  );
}
