'use client';

import { useEffect } from 'react';

// Liquid-glass controls catch light where the pointer is. One document-level
// listener writes the pointer position into --mx / --my on whichever button
// or tab is under it; the CSS draws the highlight from those.
const TARGETS = '.btn, .tab, .pill-link';

export default function PointerGlow() {
  useEffect(() => {
    const track = (e) => {
      const el = e.target instanceof Element ? e.target.closest(TARGETS) : null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      el.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
    };
    document.addEventListener('pointermove', track, { passive: true });
    document.addEventListener('pointerdown', track, { passive: true });
    return () => {
      document.removeEventListener('pointermove', track);
      document.removeEventListener('pointerdown', track);
    };
  }, []);
  return null;
}
