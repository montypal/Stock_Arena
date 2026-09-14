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
