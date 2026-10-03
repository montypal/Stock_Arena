import Link from 'next/link';
import { tierInfo } from '../../lib/trading/game';

// Which league the screen is trading in. Only worth showing when the player
// joined more than one tier this week. `extra` carries the other query the
// screen is already using (search, sort) so switching tier keeps it.
export default function TierPicker({ entries, tier, path, extra = '' }) {
  return (
    <nav className="card trade-tiers" aria-label="Trading in">
      <p className="eyebrow">Trading in</p>
      <div className="trade-tiers-row">
        {entries.map((e) => {
          const info = tierInfo(e.tier);
          const selected = Number(e.tier) === Number(tier);
          return (
            <Link
              key={e.tier}
              href={`${path}?tier=${e.tier}${extra ? `&${extra}` : ''}`}
              className={selected ? 'pill blue' : 'pill'}
              aria-current={selected ? 'page' : undefined}
            >
              {info ? info.short : e.tier}
              {e.trading_open ? '' : ' · closed'}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
