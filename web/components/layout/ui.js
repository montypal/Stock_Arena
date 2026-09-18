import { first } from '../../lib/utils/format';
import Icon from './icons';

// One-shot ?ok= / ?error= message a form redirected back with.
export function Flash({ sp }) {
  const error = first(sp?.error);
  const ok = first(sp?.ok);
  if (error) return <p className="flash bad" role="alert">{error}</p>;
  if (ok) return <p className="flash ok" role="status">{ok}</p>;
  return null;
}

// Screen heading: eyebrow label, big uppercase title with an optional
// green accent word ("HI, AARAV"), and an optional subtitle.
export function PageHead({ eyebrow, live = false, title, accent, sub, children }) {
  return (
    <header className="pagehead">
      {eyebrow ? (
        <p className="eyebrow">
          {live ? <span className="live-dot" aria-hidden="true" /> : null}
          {eyebrow}
        </p>
      ) : null}
      <h1>
        {title}
        {accent ? (
          <>
            {' '}
            <span className="accent">{accent}</span>
          </>
        ) : null}
      </h1>
      {sub ? <p className="sub">{sub}</p> : null}
      {children}
    </header>
  );
}

// Square stat widget: labelled icon, big number, caption.
// tone: 'green' | 'flame' | 'gold'
export function StatTile({ icon, value, label, tone = 'green' }) {
  return (
    <div className="stat-tile">
      <Icon name={icon} size={28} strokeWidth={2} className={`icon-${tone}`} />
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

export function ProgressBar({ value, label }) {
  const pct = Math.round(Math.min(1, Math.max(0, Number(value) || 0)) * 100);
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={label}
    >
      <span className="progress-fill" style={{ width: `${Math.max(pct, 2)}%` }} />
    </div>
  );
}
