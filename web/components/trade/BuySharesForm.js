'use client';

import { useState } from 'react';
import SubmitButton from '../layout/SubmitButton';
import { money } from '../../lib/utils/format';

// The buy widget: - N + stepper, live total cost, and the order button.
// Everything reacts to the count: the cost updates per tap, and the +
// button and the buy button gray out the moment you can't afford more.
export default function BuySharesForm({ symbol, price, available, maxShares }) {
  const [n, setN] = useState(1);
  const cost = n * price;
  const canAffordMore = maxShares != null ? n < maxShares : cost < available;
  const canBuy = n >= 1 && cost <= available + 0.005;

  return (
    <>
      <label className="field">
        <span>Shares</span>
        <span className="trade-stepper">
          <button
            type="button"
            className="stepper-btn"
            aria-label="One fewer share"
            disabled={n <= 1}
            onClick={() => setN((v) => Math.max(1, v - 1))}
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
            disabled={!canAffordMore}
            onClick={() => setN((v) => (maxShares != null ? Math.min(maxShares, v + 1) : v + 1))}
          >
            +
          </button>
        </span>
        <small>
          {n === 1
            ? `1 share ≈ ${money(Math.round(cost * 100) / 100)}.`
            : `${n} shares ≈ ${money(Math.round(cost * 100) / 100)}.`}
        </small>
      </label>
      <SubmitButton
        className="btn primary block"
        pendingLabel="Placing order…"
        disabled={!canBuy}
      >
        {n >= 1 ? `Buy ${n} for ≈ ${money(Math.round(cost * 100) / 100)}` : 'Place buy order'}
      </SubmitButton>
    </>
  );
}
