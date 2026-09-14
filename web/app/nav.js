'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  {
    href: '/league',
    label: 'League',
    icon: (
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" />
    ),
  },
  {
    href: '/trade',
    label: 'Trade',
    icon: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0" />,
  },
];

export default function NavBar() {
  const path = usePathname() ?? '';
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((t) => {
        const active = path === t.href || path.startsWith(`${t.href}/`);
        return (
          <Link key={t.href} href={t.href} className={active ? 'tab active' : 'tab'} aria-current={active ? 'page' : undefined}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {t.icon}
            </svg>
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
