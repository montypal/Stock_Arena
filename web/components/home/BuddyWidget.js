'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { money, ordinal, pct, signedMoney, tone } from '../../lib/utils/format';

// R3F cannot server-render, so the canvas is browser-only -- the same
// next/dynamic pattern the header uses for its runner.
const Buddy = dynamic(() => import('../three/Buddy'), { ssr: false, loading: () => null });

// The corner companion on Home: a glass box the buddy lives in, and the stats
// panel it opens (contextHistory.md "The Buddy -- Your Companion & Stats Hub").
//
// Everything in the panel is this player's own data, handed down by the server
// component in app/page.js. A player who has not joined this week still gets
// the buddy -- the panel says so instead of showing a portfolio they don't have.
//
// stats - null when there is no entry this week, otherwise:
//   { tier, value, profit, change, cash, invested, start, stocks, place, total,
//     up: [{ symbol, gain }], down: [...], trend: [{ date, value, rank }] }
// A holding that has not moved is in neither list, which is why the stock count
// comes down separately instead of being added up from the two.

// '2026-09-14' -> 'Mon'. The dates are plain ET calendar days from
// entry_snapshots, so they are read as UTC and never shifted by a time zone.
function dayLabel(date) {
  const [y, m, d] = String(date).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  });
}

// Says what the week is doing, not which clip is playing: every character
// maps the same moods onto its own animations.
// The bar is the picture of a day; this is the number behind it, for anyone
// hovering it or reading the panel with a screen reader.
function dayStats(day) {
  const place = day.rank ? ` · ${ordinal(day.rank)}` : '';
  return `${dayLabel(day.date)} · ${money(day.value)}${place}`;
}

function moodLine(name, mood) {
  switch (mood) {
    case 'winning':
      return `${name} is showing off — you're first in the room.`;
    case 'happy':
      return `${name} is celebrating — your week is up.`;
    case 'sad':
      return `${name} is working through it — your week is down.`;
    default:
      return `${name} is warming up.`;
  }
}

export default function BuddyWidget({ name, species, model, clips, mood = 'idle', stats = null }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  const button = useRef(null);
  const panelId = useId();

  // Escape closes and hands focus back to the button. Nothing is trapped: the
  // panel sits straight after the button in the DOM, so Tab walks into it and
  // keeps going out the other side.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      button.current?.focus();
    };
    const onDown = (e) => {
      if (!wrap.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  const trend = stats?.trend ?? [];
  // Scale the trend against the starting balance too, so the first day has
  // something to be taller or shorter than.
  const values = trend.map((d) => d.value);
  const lo = values.length ? Math.min(...values, stats.start) : 0;
  const hi = values.length ? Math.max(...values, stats.start) : 0;
  const span = hi - lo || 1;

  return (
    <div className="buddy-widget" ref={wrap}>
      <button
        type="button"
        ref={button}
        className="glass buddy-launcher"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${name}, your buddy — ${open ? 'hide' : 'show'} your stats`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="buddy-stage" aria-hidden="true">
          <Buddy model={model} clips={clips} mood={mood} />
        </span>
        <span className={`buddy-tag num ${stats ? tone(stats.change) : 'flat'}`} aria-hidden="true">
          {stats ? pct(stats.change) : 'Stats'}
        </span>
      </button>

      {open ? (
        <section className="card buddy-panel" id={panelId} role="dialog" aria-label={`${name}'s stats`}>
          <div className="card-head">
            <h2>
              {name} <span className="caption">{species}</span>
            </h2>
            <button type="button" className="btn ghost small" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          {/* The head stays put and the stats scroll under it, so Close is
              always reachable and the glass rim never scrolls away. */}
          <div className="buddy-scroll">
            <p className="caption">{moodLine(name, mood)}</p>

            {!stats ? (
              <>
                <p className="empty">
                  You haven&apos;t joined a league this week, so there&apos;s nothing to show yet.
                </p>
                <Link href="/league" className="btn primary block">
                  Join a league
                </Link>
              </>
            ) : (
              <>
                <div className="buddy-headline">
                  <p className="big-number">{money(stats.value)}</p>
                  <p className={`delta ${tone(stats.profit)}`}>
                    {signedMoney(stats.profit)} <span>({pct(stats.change)})</span>
                  </p>
                  <p className="caption">
                    {stats.tier}
                    {stats.place ? ` · ${ordinal(stats.place)} of ${stats.total}` : ''}
                  </p>
                </div>

                <dl className="stats">
                  <div>
                    <dt>Cash</dt>
                    <dd>{money(stats.cash)}</dd>
                  </div>
                  <div>
                    <dt>Invested</dt>
                    <dd>{money(stats.invested)}</dd>
                  </div>
                  <div>
                    <dt>Stocks</dt>
                    <dd>{stats.stocks}</dd>
                  </div>
                </dl>

                <div className="buddy-movers">
                  <div>
                    <p className="eyebrow">Up</p>
                    {stats.up.length === 0 ? (
                      <p className="empty-text">Nothing up right now.</p>
                    ) : (
                      <ul className="buddy-ticks">
                        {stats.up.map((h) => (
                          <li key={h.symbol}>
                            <span>{h.symbol}</span>
                            <span className="num up">{signedMoney(h.gain)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <p className="eyebrow">Down</p>
                    {stats.down.length === 0 ? (
                      <p className="empty-text">Nothing down right now.</p>
                    ) : (
                      <ul className="buddy-ticks">
                        {stats.down.map((h) => (
                          <li key={h.symbol}>
                            <span>{h.symbol}</span>
                            <span className="num down">{signedMoney(h.gain)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div>
                  <p className="eyebrow">Day by day</p>
                  {trend.length === 0 ? (
                    <p className="empty-text">
                      Your first daily snapshot is taken at the end of the league&apos;s first day.
                    </p>
                  ) : (
                    <ul className="buddy-trend">
                      {trend.map((day, i) => {
                        const before = i === 0 ? stats.start : trend[i - 1].value;
                        const height = 16 + Math.round(((day.value - lo) / span) * 84);
                        return (
                          <li
                            key={day.date}
                            className="buddy-trend-day"
                            title={dayStats(day)}
                            aria-label={dayStats(day)}
                          >
                            <span className="buddy-trend-track">
                              <span
                                className={`buddy-trend-bar ${tone(day.value - before)}`}
                                style={{ height: `${height}%` }}
                              />
                            </span>
                            <span className="buddy-trend-label">{dayLabel(day.date)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
