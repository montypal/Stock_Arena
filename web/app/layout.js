import { Orbitron, Space_Grotesk } from 'next/font/google';
import './globals.css';
import '../styles/screens/home.css';
import '../styles/screens/battles.css';
import '../styles/screens/trade.css';
import '../styles/screens/account.css';
import AppHeader from '../components/layout/header';
import NavBar from '../components/layout/nav';
import PointerGlow from '../components/layout/PointerGlow';
import { currentUser } from '../lib/db/auth';

// Every page depends on who's logged in and on live prices.
export const dynamic = 'force-dynamic';

const display = Orbitron({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Space_Grotesk({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

export const metadata = {
  title: 'StockArena',
  description: 'Weekly stock-picking leagues with fake money and real prices.',
  appleWebApp: { capable: true, title: 'StockArena', statusBarStyle: 'black-translucent' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#020805',
};

export default async function RootLayout({ children }) {
  const user = await currentUser();
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className={user ? 'signed-in' : undefined}>
        <AppHeader coins={user ? user.coins : null} />
        <div className="app">{children}</div>
        {user ? <NavBar /> : null}
        <PointerGlow />
      </body>
    </html>
  );
}
