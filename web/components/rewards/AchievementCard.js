import { signedMoney, timeET } from '../../lib/utils/format';
import Icon from '../layout/icons';
import { achIcon, achRule } from './achievements';

// One achievement on a board. Earned has to read as done at a glance on a
// phone, so the glass rim and a wash of the same colour carry the state:
// green where the award is league cash, gold where it is coins.
//
// An achievement with `waiting` set is blocked on a feature that does not
// exist yet, so it gets no rim, faint text, and an award written as something
// that will pay later -- never as a goal to chase today.
export default function AchievementCard({ ach, currency = 'cash' }) {
  const coins = currency === 'coins';
  const waiting = Boolean(ach.waiting);
  const earned = Boolean(ach.earned) && !waiting;
  const rim = earned ? (coins ? 'rim-gold' : 'rim-ok') : '';
  const state = waiting ? 'is-waiting' : earned ? 'is-earned' : 'is-open';
  const value = coins ? `+${Number(ach.coins).toLocaleString()}` : signedMoney(ach.cash);

  return (
    <li className={`glass acct-award ${state} ${rim}`.trim()}>
      <div className="acct-award-top">
        <span className="acct-award-icon">
          <Icon name={achIcon(ach.slug)} size={22} strokeWidth={2} />
        </span>
        <span className="acct-award-head">
          <strong className="acct-award-name">{ach.name}</strong>
          <span className="acct-award-rule">{achRule(ach)}</span>
        </span>
      </div>
      <div className="acct-award-foot">
        {waiting ? (
          <span className="pill">Waiting</span>
        ) : earned ? (
          <span className={coins ? 'pill gold' : 'pill live'}>Earned</span>
        ) : (
          <span className="pill">Not yet</span>
        )}
        <span className="acct-award-pay">
          <span className="acct-award-value">{value}</span>
          <span className="acct-award-unit">{coins ? 'coins' : 'league cash'}</span>
        </span>
      </div>
      {earned && ach.at ? <p className="caption">Paid {timeET(ach.at)}</p> : null}
      {waiting ? (
        <p className="caption">Waiting on {ach.waiting} — not earnable yet</p>
      ) : null}
    </li>
  );
}
