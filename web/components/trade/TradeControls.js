'use client';

import { useState } from 'react';
import SubmitButton from '../layout/SubmitButton';
import { money, shareCount } from '../../lib/utils/format';

// Whole shares only, so the count is a plain integer everywhere here.
const cents = (n) => Math.round(n * 100) / 100;

// One share count drives the whole ticket: the player sets it once and every
// button says what it will actually do. Max jumps to the most they can
// afford; Sell all ignores the count. The `trade` server action comes in as a
// prop so all three forms can share this one count.
export default function TradeControls({ action, symbol, price, cash, maxShares, held, entryId, tier }) {
  const affordable = Math.max(0, Math.floor(Number(maxShares) || 0));
  // `held` is the exact position, which can be a fraction on a position left
  // by the old dollar-based orders. `sellable` is what the whole-share
  // partial sell can offer; the sweep below uses `held` itself, so a holding
  // under one share still has a way out.
  const owned = Math.max(0, Number(held) || 0);
  const sellable = Math.floor(owned);
  const ceiling = Math.max(affordable, sellable, 1);
  const [n, setN] = useState(1);
  const cost = cents(n * price);
  const canBuy = n >= 1 && n <= affordable;
  const canSell = sellable > 0 && n >= 1 && n <= sellable;
  const canSweep = owned > 0;

  // Only explain the count when a button is off, so there is nothing to read
  // in the normal case.
  const hint = canBuy
    ? null
    : affordable < 1
      ? `One share costs more than the ${money(cash)} you have left.`
      : `${money(cash)} left — enough for ${affordable} ${affordable === 1 ? 'share' : 'shares'}.`;

  const fields = (
    <>
      <input type="hidden" name="symbol" value={symbol} />
      {entryId ? <input type="hidden" name="entry_id" value={entryId} /> : null}
      {tier ? <input type="hidden" name="tier" value={tier} /> : null}
    </>
  );

  return (
    <div className="trade-controls">
      {/* Not a <label>: a label forwards its clicks to the first labelable
          descendant, and <button> is labelable, so tapping the number or the
          word "Shares" pressed the minus button. */}
      <div className="field">
        <span id="trade-shares-label">Shares</span>
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
          <output className="stepper-value" aria-live="polite" aria-labelledby="trade-shares-label">
            {n}
          </output>
          <button
            type="button"
            className="stepper-btn"
            aria-label="One more share"
            disabled={n >= ceiling}
            onClick={() => setN((v) => Math.min(ceiling, v + 1))}
          >
            +
          </button>
          <button
            type="button"
            className="btn small outline trade-max"
            disabled={affordable < 1 || n === affordable}
            onClick={() => setN(affordable)}
          >
            Max
          </button>
        </span>
        {hint ? <small>{hint}</small> : null}
      </div>

      <form action={action}>
        {fields}
        <input type="hidden" name="side" value="buy" />
        <input type="hidden" name="shares" value={n} />
        <SubmitButton className="btn primary block trade-go" pendingLabel="Buying…" disabled={!canBuy}>
          Buy {n} for {money(cost)}
        </SubmitButton>
      </form>

      {canSweep ? (
        <div className="trade-sell-row">
          {sellable > 0 ? (
            <form action={action}>
              {fields}
              <input type="hidden" name="side" value="sell" />
              <input type="hidden" name="shares" value={n} />
              <SubmitButton className="btn outline block" pendingLabel="Selling…" disabled={!canSell}>
                Sell {n} for {money(cost)}
              </SubmitButton>
            </form>
          ) : null}
          <form action={action}>
            {fields}
            <input type="hidden" name="side" value="sell" />
            <input type="hidden" name="all" value="1" />
            <SubmitButton className="btn ghost block" pendingLabel="Selling…">
              Sell all {shareCount(owned)}
            </SubmitButton>
          </form>
        </div>
      ) : null}
    </div>
  );
}
