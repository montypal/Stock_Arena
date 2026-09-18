import SubmitButton from '../layout/SubmitButton';
import { cancel } from '../../lib/actions';
import { marketOpen } from '../../lib/trading/game';
import { money, timeET } from '../../lib/utils/format';

// Orders waiting for the worker to fill them, each with a Cancel button.
// Cancelling redirects back to Home with an ?ok= or ?error= message; while the
// action runs the button shows a spinner and can't be pressed twice.
//
// orders - orders(entry.id, { pending: true })
export default function PendingOrdersCard({ orders }) {
  return (
    <section className="card" aria-labelledby="home-pending-title">
      <div className="card-head">
        <h2 id="home-pending-title">Pending orders</h2>
        <span className="muted small">{marketOpen() ? 'Fill within a minute' : 'Fill at the open'}</span>
      </div>
      <ul className="rows home-list">
        {orders.map((o) => {
          const verb = o.side === 'buy' ? 'Buy' : 'Sell';
          return (
            <li key={o.id} className="row">
              <span className="row-main">
                <strong>
                  {verb} {o.symbol}
                </strong>
                <span className="sub">
                  {o.sell_all ? 'All shares' : money(o.amount)} · placed {timeET(o.placed_at)}
                </span>
              </span>
              <form action={cancel}>
                <input type="hidden" name="order_id" value={o.id} />
                <input type="hidden" name="back" value="/" />
                <SubmitButton
                  className="btn small ghost"
                  pendingLabel="Cancelling…"
                  aria-label={`Cancel ${verb.toLowerCase()} ${o.symbol} order`}
                >
                  Cancel
                </SubmitButton>
              </form>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
