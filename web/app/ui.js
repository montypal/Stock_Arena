import { first } from '../lib/format';

export function Flash({ sp }) {
  const error = first(sp?.error);
  const ok = first(sp?.ok);
  if (error) return <p className="flash bad" role="alert">{error}</p>;
  if (ok) return <p className="flash ok" role="status">{ok}</p>;
  return null;
}

export function PageHead({ eyebrow, title, children }) {
  return (
    <header className="pagehead">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      {children}
    </header>
  );
}
