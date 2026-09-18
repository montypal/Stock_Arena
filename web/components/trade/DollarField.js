// Dollar amount input for the buy and sell forms. Always submits as `amount`
// (the field name the trade server action reads).
export default function DollarField({ label = 'Amount in dollars', max, disabled = false, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      <span className="trade-money">
        <span className="trade-money-sign" aria-hidden="true">
          $
        </span>
        <input
          type="number"
          name="amount"
          inputMode="decimal"
          min="1"
          max={max}
          step="0.01"
          placeholder="0.00"
          required
          disabled={disabled}
        />
      </span>
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}
