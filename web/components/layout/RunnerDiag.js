'use client';

import { useEffect, useState } from 'react';

export const STAGES = [
  'header-mounted',
  'chunk-loaded',
  'runner-mounted',
  'canvas-created',
  'texture-applied',
  'fitted-ready',
];

// Actionable next step per failure code. Shown under each reported error so a
// viewer (or a pasted bug report) points at the exact fix, not just a symptom.
export const GUIDANCE = {
  fbx: 'Check the Vercel Root Directory is "web" and web/public/models/running.fbx is deployed, then hard-refresh.',
  texture:
    'Check web/public/models/textures/packed/Image_0.png is deployed next to the extensionless Image_0 copy, then hard-refresh.',
  webgl:
    'This browser reports no WebGL (disabled GPU, blocklist, or headless without SwiftShader). The poster fallback stays; enable hardware acceleration and reload.',
  animation:
    'The FBX parsed but carries no playable clip. Re-export from Mixamo with the run animation baked in — do not swap in the unrigged Copilot3D file.',
  framing:
    'The rig posed an empty bounding box, so auto-fit refused to guess. The FBX may be corrupt; check the F12 console for the bounds log.',
  model:
    'three.js threw while loading the model (chunk, parse, or GPU failure). Check the F12 console and the network tab for the failing URL.',
  timeout:
    'Work down the stage checklist: the first stage without a filled dot is where the load stalled, then follow that row\'s guidance.',
};

function store() {
  if (typeof window === 'undefined') return null;
  if (!window.__SA_DIAG) window.__SA_DIAG = { stages: {}, errors: [], log: [] };
  return window.__SA_DIAG;
}

// Shared diagnostic bus. Header + HeaderRunner report here; the panel renders
// from here. Every stage write also mirrors to window.__SA_RUNNER so consoles
// and tests can read the latest stage without React.
export function report(kind, code, msg) {
  const text = `[Runner] ${code}: ${msg}`;
  if (kind === 'error') console.error(text);
  else console.log(text);
  if (typeof window === 'undefined') return;
  const s = store();
  if (kind === 'stage') {
    s.stages[code] = true;
    window.__SA_RUNNER = code;
  }
  if (kind === 'error' && !s.errors.some((e) => e.code === code)) {
    s.errors.push({ code, msg });
  }
  s.log.push({ t: Date.now(), kind, code, msg });
  window.dispatchEvent(new CustomEvent('sa-runner-diag'));
}

export function snapshot() {
  const s = store();
  return s ? { stages: { ...s.stages }, errors: [...s.errors] } : { stages: {}, errors: [] };
}

function errSignature(errors) {
  return errors.map((e) => e.code).join(',');
}

export default function RunnerAlert() {
  const [snap, setSnap] = useState(() => snapshot());
  const [dismissed, setDismissed] = useState(false);
  const [forced, setForced] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      setForced(new URLSearchParams(window.location.search).has('runnerDebug'));
    } catch {
      setForced(false);
    }
    // header-mounted is reported by header.js (the stage owner); the bus
    // dedupes by code, so this panel only subscribes here.
    const onEvt = () => {
      setSnap((prev) => {
        const next = snapshot();
        // A new error code re-opens the panel even after dismissal so a later
        // failure is never silently swallowed.
        if (errSignature(next.errors) !== errSignature(prev.errors)) setDismissed(false);
        return next;
      });
    };
    window.addEventListener('sa-runner-diag', onEvt);
    const timer = window.setTimeout(() => {
      const s = store();
      if (s && !s.stages['fitted-ready'] && !s.errors.some((e) => e.code === 'timeout')) {
        report('error', 'timeout', 'bull not visibly fitted after 12s — see stage checklist');
      }
    }, 12000);
    return () => {
      window.removeEventListener('sa-runner-diag', onEvt);
      window.clearTimeout(timer);
    };
  }, []);

  const ready = Boolean(snap.stages['fitted-ready']);
  const blocked = snap.errors.length > 0;
  const status = ready && !blocked ? 'running' : blocked ? 'blocked' : 'loading';
  // Debugging tool, not player-facing: it only appears with ?runnerDebug=1.
  // Players get the poster fallback if the bull can't load, never a panel of
  // stage codes over the page.
  const visible = forced && !dismissed;
  if (!visible) return null;

  const copyDiag = async () => {
    const payload = {
      runner: typeof window !== 'undefined' ? window.__SA_RUNNER || null : null,
      stages: snap.stages,
      errors: snap.errors,
      href: typeof window !== 'undefined' ? window.location.href : null,
      ua: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="runner-alert-wrap" aria-label="3D runner diagnostics">
      <div
        className={`runner-alert runner-alert--${status}`}
        role={blocked ? 'alert' : 'status'}
        aria-live="polite"
      >
        <div className="runner-alert-head">
          <span className={`runner-dot runner-dot--${status}`} aria-hidden="true" />
          <strong className="runner-alert-title">
            {status === 'running'
              ? '3D bull: running'
              : status === 'blocked'
                ? '3D bull: blocked'
                : '3D bull: loading…'}
          </strong>
          <span className="runner-alert-sub">
            {status === 'running'
              ? 'All stages complete.'
              : status === 'blocked'
                ? `${snap.errors.length} issue${snap.errors.length === 1 ? '' : 's'} need attention.`
                : 'Loading the Mixamo run…'}
          </span>
          <span className="runner-alert-actions">
            <button type="button" className="btn outline small" onClick={copyDiag}>
              {copied ? 'Copied' : 'Copy report'}
            </button>
            <button
              type="button"
              className="runner-alert-x"
              aria-label="Dismiss runner diagnostics"
              onClick={() => setDismissed(true)}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path
                  d="M1.5 1.5l9 9M10.5 1.5l-9 9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </span>
        </div>
        <ol className="runner-alert-stages">
          {STAGES.map((s) => (
            <li key={s} className={snap.stages[s] ? 'done' : 'todo'}>
              <span
                className={`runner-dot runner-dot--${snap.stages[s] ? 'ok' : 'idle'}`}
                aria-hidden="true"
              />
              <code>{s}</code>
            </li>
          ))}
        </ol>
        {blocked ? (
          <ul className="runner-alert-errors">
            {snap.errors.map((e) => (
              <li key={e.code}>
                <code className="runner-alert-code">{e.code}</code>
                <span className="runner-alert-msg">{e.msg}</span>
                {GUIDANCE[e.code] ? (
                  <span className="runner-alert-fix">{GUIDANCE[e.code]}</span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="runner-alert-hint">
          Model <code>/models/running.fbx</code> + texture{' '}
          <code>/models/textures/packed/Image_0.png</code>. Add <code>?runnerDebug=1</code> to
          keep this panel pinned open.
        </p>
      </div>
    </section>
  );
}
