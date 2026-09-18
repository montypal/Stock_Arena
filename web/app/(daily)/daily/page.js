import { requireUser } from '../../../lib/db/auth';
import { PageHead } from '../../../components/layout/ui';

const NEWS = [
  {
    tag: 'Markets',
    title: 'Futures point to a flat open as traders await jobs data',
    source: 'Arena Wire',
    time: 'Today · 8:12 AM ET',
    blurb: 'Index futures hovered near unchanged ahead of the jobs report.',
  },
  {
    tag: 'Movers',
    title: 'Mega-cap tech mixed: chips up, cloud down',
    source: 'Arena Wire',
    time: 'Today · 7:40 AM ET',
    blurb: 'Semiconductor names caught an early bid while software lagged.',
  },
  {
    tag: 'Strategy',
    title: 'Reminder: no single stock can top 20% of your portfolio',
    source: 'League Desk',
    time: 'Today · 7:00 AM ET',
    blurb: 'Plan on at least five positions if you want all of your cash invested.',
  },
  {
    tag: 'Schedule',
    title: 'Market hours: orders fill within a minute when open',
    source: 'League Desk',
    time: 'Yesterday · 4:05 PM ET',
    blurb: 'Orders placed while closed queue for the open. Pending orders can be cancelled from Home.',
  },
];

export default async function DailyPage() {
  await requireUser();
  return (
    <main>
      <PageHead
        eyebrow="Daily"
        title="Today in the"
        accent="Arena"
        sub="A static placeholder feed. Real news integration comes later."
      />
      <div className="grid-2 acct-news">
        {NEWS.map((n) => (
          <article key={n.title} className="card acct-article">
            <div className="card-head">
              <span className="pill live">{n.tag}</span>
              <span className="caption">{n.time}</span>
            </div>
            <h2 className="acct-article-title">{n.title}</h2>
            <p className="acct-article-body">
              <span className="acct-article-source">{n.source}</span>
              <span className="muted small">{n.blurb}</span>
            </p>
          </article>
        ))}
      </div>
      <p className="fineprint">Placeholder content only — not real market news.</p>
    </main>
  );
}
