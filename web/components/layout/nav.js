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
  // Optimistic tab feedback: light the tapped tab + start the lens sliding
  // at tap time, before the next route's server roundtrip finishes. Cleared
  // as soon as usePathname reports the real route.
  const [pending, setPending] = useState(null);
  const display = pending ?? index;
  const [moving, setMoving] = useState(false);
  const last = useRef(display);

  useEffect(() => {
    // Real route arrived: drop the optimistic index.
    setPending(null);
  }, [path]);

  useEffect(() => {
    if (last.current === display) return undefined;
    last.current = display;
    setMoving(true);
    const t = setTimeout(() => setMoving(false), 260);
    return () => clearTimeout(t);
  }, [display]);

  return (
    <nav
      className="tabbar"
      aria-label="Main"
      data-moving={moving ? 'true' : 'false'}
      data-has-active={display >= 0 ? 'true' : 'false'}
      style={{ '--i': Math.max(display, 0) }}
    >
      <div className="tabbar-track">
        <span className="tab-glass" aria-hidden="true" />
        {TABS.map((t, i) => {
          const active = i === display;
          return (
            <Link
              key={t.href}
              href={t.href}
              onClick={() => setPending(i)}
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
