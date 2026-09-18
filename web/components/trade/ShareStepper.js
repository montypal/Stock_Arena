'use client';

import { useState } from 'react';

// A - N + share stepper bound to a form field named "shares".
//
// min          - lowest selectable count (0 = "buy nothing yet", the default)
// max          - highest selectable count (max affordable / cap room, or held)
// defaultValue - starting count, 0 unless the caller says otherwise
//
// The visible number is local state; a hidden input carries the value into
// the server-action form so what the player sees is what gets submitted.
export default function ShareStepper({ min = 0, max, defaultValue = 0, label = 'Shares', hint }) {
  const [n, setN] = useState(defaultValue);
  const clamp = (v) => Math.max(min, max != null ? Math.min(max, v) : v);

  return (
    <label className="field">
      <span>{label}</span>
      <span className="trade-stepper">
        <button
          type="button"
          className="stepper-btn"
          aria-label="One fewer share"
          disabled={n <= min}
          onClick={() => setN((v) => clamp(v - 1))}
        >
          −
        </button>
        <input type="hidden" name="shares" value={n} />
        <span className="stepper-value" aria-live="polite">
          {n}
        </span>
        <button
          type="button"
          className="stepper-btn"
          aria-label="One more share"
          disabled={max != null && n >= max}
          onClick={() => setN((v) => clamp(v + 1))}
        >
          +
        </button>
      </span>
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}
