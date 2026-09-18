'use client';

import { useRouter } from 'next/navigation';

// Sort control for /trade. Client-side only because changing the sort is
// a navigation (router.push with ?q=&sort=); the list itself stays
// server-rendered from the database.
const OPTIONS = [
  { value: 'trending', label: 'Trending' },
  { value: 'symbol', label: 'A–Z' },
  { value: 'symbol-desc', label: 'Z–A' },
  { value: 'price-asc', label: 'Price ↑' },
  { value: 'price-desc', label: 'Price ↓' },
];

export default function SortSelect({ q, sort }) {
  const router = useRouter();

  return (
    <label className="sort-control">
      <span className="sort-label">Sort</span>
      <select
        className="trade-sort glass"
        value={sort}
        aria-label="Sort stocks"
        onChange={(e) => {
          const next = new URLSearchParams();
          if (q) next.set('q', q);
          next.set('sort', e.target.value);
          router.push(`/trade?${next.toString()}`);
        }}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
