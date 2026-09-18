import Link from 'next/link';
import { money, pct } from '../../lib/utils/format';
import { changeTone, dayChange } from './change';

// Every stock links to its trade page. The list sits inside one glass
// `.card.flush` (app/(battles)/trade/page.js): divided rows on phones, a grid
// of inner-glass tiles from 768px (styles/screens/trade.css).
export default function StockList({ stocks }) {
  return (
    <ul className="trade-list">
      {stocks.map((s) => {
        const change = dayChange(s);
        return (
          <li key={s.symbol}>
            <Link href={`/trade/${s.symbol}`} className="trade-stock">
              <strong className="trade-stock-sym">{s.symbol}</strong>
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
