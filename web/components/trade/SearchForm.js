import Icon from '../layout/icons';

// Plain GET search: pressing Enter reloads /trade?q=… (no JavaScript).
export default function SearchForm({ q }) {
  return (
    <form className="trade-search" role="search" action="/trade">
      <label className="trade-search-field">
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
