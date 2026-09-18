// Day change for a quote row from stocks()/stock(): price vs the previous
// close as a fraction (0.0123 = +1.23%), or null when either is missing.
export function dayChange(s) {
  return s.price != null && s.prev_close ? s.price / s.prev_close - 1 : null;
}

// Colour for a day change. Uses the same cut-off pct() uses for its +/−
// sign, so a change printed as "+0.30%" is always shown green.
export function changeTone(change) {
  if (change == null) return 'flat';
  if (change > 0.0004) return 'up';
  if (change < -0.0004) return 'down';
  return 'flat';
}
