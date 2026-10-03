import Link from 'next/link';
import { money, pct, shareCount } from '../../lib/utils/format';
import { changeTone, dayChange } from './change';

// Every stock links to its trade page. The list sits inside one glass
// `.card.flush` (app/(battles)/trade/page.js): divided rows on phones, a grid
// of inner-glass tiles from 768px (styles/screens/trade.css).
// `owned` maps symbol -> shares held in the selected league, so a player can
// spot their own positions without opening anything.
export default function StockList({ stocks, tier, owned = {} }) {
  const tierQs = tier ? `?tier=${tier}` : '';
  return (
    <ul className="trade-list">
      {stocks.map((s) => {
        const change = dayChange(s);
        const shares = Number(owned[s.symbol]) || 0;
        return (
          <li key={s.symbol}>
            <Link href={`/trade/${s.symbol}${tierQs}`} className="trade-stock">
              <span className="trade-stock-id">
                <strong className="trade-stock-sym">{s.symbol}</strong>
                {shares > 0 ? (
                  <span className="pill trade-own">
                    {shareCount(shares)} {shares === 1 ? 'share' : 'shares'}
                  </span>
                ) : null}
              </span>
              <span className="trade-stock-name">{s.name}</span>
              <span className="trade-stock-price">{s.price != null ? money(s.price) : '—'}</span>
              <span className={`pill trade-chg ${changeTone(change)}`}>
                {change != null ? pct(change) : '—'}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
