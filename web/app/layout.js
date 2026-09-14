import './globals.css';
import NavBar from '../components/layout/nav';
import { currentUser } from '../lib/db/auth';

// Every page depends on who's logged in and on live prices.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'StockArena',
  description: 'Weekly stock-picking leagues with fake money and real prices.',
  appleWebApp: { capable: true, title: 'StockArena', statusBarStyle: 'default' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1b45e0',
};

export default async function RootLayout({ children }) {
  const user = await currentUser();
  return (
    <html lang="en">
      <body className={user ? 'signed-in' : undefined}>
        <div className="app">{children}</div>
        {user ? <NavBar /> : null}
      </body>
    </html>
  );
}
