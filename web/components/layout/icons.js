// Outline icons on a 24px grid, drawn in the current text colour. Icons are
// only used to label something (a tab, a stat, a button), never as ornament.
const PATHS = {
  home: 'M4 10.5 12 3.5l8 7M6 9.5V20h4.5v-5.5h3V20H18V9.5',
  battles:
    'M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2',
  daily: 'M5 5h11v13H5zM16 8h3v10H8M8 8.5h5M8 11.5h5M8 14.5h3',
  progress: 'M4 20h16M7.5 20v-5M12 20V6M16.5 20v-9',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0',
  chart: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  trophy:
    'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3',
  flame:
    'M12 22c4 0 7-2.7 7-7 0-3-1.5-5.5-4-8 0 2.5-1.5 4-3 4 0-3-1.5-6-4-8 .5 3-3 6.5-3 12 0 4.3 3 7 7 7Z',
  zap: 'M13 2 4 14h7l-1 8 9-12h-7l1-8Z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2',
  bars: 'M6 20v-5M12 20V8M18 20V4',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3',
  back: 'M19 12H5M12 19l-7-7 7-7',
  chevron: 'M9 6l6 6-6 6',
  coin: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v10M14.5 9.5H11a1.5 1.5 0 0 0 0 3h2a1.5 1.5 0 0 1 0 3H9.5',
  shuffle: 'M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  wallet: 'M3 7a2 2 0 0 1 2-2h13v4M3 7v11a2 2 0 0 0 2 2h15v-5M3 7h17a1 1 0 0 1 1 1v3M21 11h-4a2 2 0 0 0 0 4h4v-4Z',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7.5M22 21a7 7 0 0 0-4.5-6.5',
  pulse: 'M3 12h4l3-8 4 16 3-8h4',
};

export default function Icon({ name, size = 22, strokeWidth = 1.8, className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name] ?? ''} />
    </svg>
  );
}
