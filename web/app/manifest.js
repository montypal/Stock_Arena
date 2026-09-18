export default function manifest() {
  return {
    name: 'StockArena',
    short_name: 'StockArena',
    description: 'Weekly stock-picking leagues with fake money and real prices.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#020805',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
