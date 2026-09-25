'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import Icon from './icons';

const HeaderRunner = dynamic(() => import('./HeaderRunner'), { ssr: false, loading: () => null });

// Top bar on every screen: logo + wordmark, and on the right either the
// player's coin balance (signed in) or a Drop in button that jumps to the
// device sign-in on the landing page (signed out; no login page while testing).
export default function AppHeader({ coins }) {
  const path = usePathname() ?? '';
  const signedIn = coins !== null && coins !== undefined;

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link href="/" className="brand" aria-label="StockArena home">
          <span className="brand-tile">
            <img src="/logo-mark.png" alt="" width={36} height={36} />
          </span>
          <span className="brand-name">
            STOCK<span>ARENA</span>
          </span>
        </Link>
        <HeaderRunner />

        {signedIn ? (
          <Link href="/progress" className="coin-chip" aria-label={`${Number(coins).toLocaleString()} coins`}>
            <Icon name="coin" size={18} strokeWidth={2} />
            {Number(coins).toLocaleString()}
          </Link>
        ) : path === '/' ? (
          <a href="#join" className="btn outline small">
            <Icon name="zap" size={16} strokeWidth={2.2} />
            Drop in
          </a>
        ) : null}
      </div>
    </header>
  );
}
