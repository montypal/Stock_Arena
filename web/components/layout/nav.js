'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Icon from './icons';

const TABS = [
  { href: '/', label: 'Home', icon: 'home', match: ['/'] },
  // Trading happens inside a battle, so /trade keeps the Battles tab lit.
  { href: '/league', label: 'Battles', icon: 'battles', match: ['/league', '/trade'] },
  { href: '/daily', label: 'Daily', icon: 'daily', match: ['/daily'] },
  { href: '/progress', label: 'Progress', icon: 'progress', match: ['/progress'] },
  { href: '/profile', label: 'Profile', icon: 'profile', match: ['/profile'] },
];

function activeIndex(path) {
  return TABS.findIndex((t) =>
    t.match.some((m) => (m === '/' ? path === '/' : path === m || path.startsWith(`${m}/`)))
  );
}

// Bottom tab bar (side rail on desktop). The active tab is marked by a single
// liquid-glass lens that slides to it; while travelling it briefly stretches
// (data-moving), which reads as fluid rather than a hard jump.
export default function NavBar() {
  const path = usePathname() ?? '';
  const index = activeIndex(path);
  const [moving, setMoving] = useState(false);
  const last = useRef(index);

  useEffect(() => {
    if (last.current === index) return undefined;
    last.current = index;
    setMoving(true);
    const t = setTimeout(() => setMoving(false), 260);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <nav
      className="tabbar"
      aria-label="Main"
      data-moving={moving ? 'true' : 'false'}
      data-has-active={index >= 0 ? 'true' : 'false'}
      style={{ '--i': Math.max(index, 0) }}
    >
      <div className="tabbar-track">
        <span className="tab-glass" aria-hidden="true" />
        {TABS.map((t, i) => {
          const active = i === index;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={active ? 'tab active' : 'tab'}
              aria-current={active ? 'page' : undefined}
            >
              <Icon name={t.icon} size={24} strokeWidth={active ? 2.1 : 1.8} />
              <span>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
