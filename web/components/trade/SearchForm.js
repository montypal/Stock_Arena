import Icon from '../layout/icons';

// Plain GET search: pressing Enter reloads /trade?q=… (no JavaScript).
// The field sits straight on the moving background, so its wrapper is the
// glass container and the input inside it is borderless (focus ring is a
// box-shadow on the wrapper; see styles/screens/trade.css).
export default function SearchForm({ q }) {
  return (
    <form className="trade-search" role="search" action="/trade">
      <label className="trade-search-field glass">
        <Icon name="search" size={20} strokeWidth={2} className="trade-search-icon" />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name or symbol"
          aria-label="Search stocks"
          autoComplete="off"
        />
      </label>
    </form>
  );
}
