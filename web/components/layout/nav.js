'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  {
    href: '/',
    label: 'Home',
    icon: <path d="M4 10.5 12 3.5l8 7M6 9.5V20h4.5v-5.5h3V20H18V9.5" />,
  },
  {
    href: '/league',
    label: 'Battles',
    icon: (
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" />
    ),
  },
  {
    href: '/daily',
    label: 'Daily',
    icon: <path d="M5 5h11v13H5zM16 8h3v10H8M8 8.5h5M8 11.5h5M8 14.5h3" />,
  },
  {
    href: '/progress',
    label: 'Progress',
    icon: <path d="M4 20h16M7.5 20v-5M12 20V6M16.5 20v-9" />,
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0" />,
  },
];

function isActive(path, href) {
  if (href === '/') return path === '/';
  return path === href || path.startsWith(`${href}/`);
}

export default function NavBar() {
  const path = usePathname() ?? '';
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((t) => {
        const active = isActive(path, t.href);
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
