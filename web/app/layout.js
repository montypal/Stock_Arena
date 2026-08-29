import './globals.css';

export const metadata = {
  title: 'StockArena',
  description: 'Weekly stock-picking competition with fake money and real prices.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
