const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function money(n) {
  return usd.format(Number(n) || 0);
}

export function signedMoney(n) {
  const v = Number(n) || 0;
  const sign = v > 0.004 ? '+' : v < -0.004 ? '−' : '';
  return sign + usd.format(Math.abs(v));
}

export function pct(n) {
  const v = Number(n) || 0;
  const sign = v > 0.0004 ? '+' : v < -0.0004 ? '−' : '';
  return `${sign}${Math.abs(v * 100).toFixed(2)}%`;
}

export function shareCount(n) {
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 4 });
}

export function tone(n) {
  const v = Number(n) || 0;
  if (v > 0.004) return 'up';
  if (v < -0.004) return 'down';
  return 'flat';
}

export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// '2026-09-14' -> 'Sep 14'
export function weekLabel(ws) {
  const [y, m, d] = String(ws).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function timeET(date) {
  return new Date(date).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function first(v) {
  return Array.isArray(v) ? v[0] : v;
}

// '2026-09-14' -> 'Sep 14 – Sep 20' (a league's Monday through Sunday)
export function weekRange(ws) {
  const [y, m, d] = String(ws).split('-').map(Number);
  const opts = { month: 'short', day: 'numeric', timeZone: 'UTC' };
  const start = new Date(Date.UTC(y, m - 1, d));
  const end = new Date(Date.UTC(y, m - 1, d + 6));
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`;
}

// Time left until a date, e.g. '2d 4h', '3h 12m', '8m'.
export function timeUntil(date, now = new Date()) {
  let mins = Math.max(0, Math.round((new Date(date) - now) / 60000));
  const days = Math.floor(mins / 1440);
  mins -= days * 1440;
  const hours = Math.floor(mins / 60);
  mins -= hours * 60;
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

// How far through an interval we are, clamped to 0..1.
export function progress(start, end, now = new Date()) {
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (!(b > a)) return 0;
  return Math.min(1, Math.max(0, (now.getTime() - a) / (b - a)));
}
