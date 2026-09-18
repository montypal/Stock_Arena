'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '../layout/icons';
import SubmitButton from '../layout/SubmitButton';
import { enterWithDevice, resumeDevice } from '../../lib/actions';

// TEMPORARY sign-in while the login page is removed for testing (9/17/26).
// Each browser keeps a random device id in localStorage. A known device is
// signed straight back in; a new one asks the player for the name other
// players will see. Clearing this browser's storage starts a new player.
export const DEVICE_KEY = 'stockarena.device';

function newDeviceId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export default function DeviceEntry() {
  const router = useRouter();
  const [deviceId, setDeviceId] = useState('');
  const [phase, setPhase] = useState('checking'); // checking | new | saved-failed
  const [state, formAction] = useActionState(enterWithDevice, null);

  useEffect(() => {
    let id = null;
    try {
      id = window.localStorage.getItem(DEVICE_KEY);
    } catch {
      id = null;
    }

    if (id) {
      setDeviceId(id);
      resumeDevice(id)
        .then((r) => (r?.ok ? router.refresh() : setPhase('new')))
        .catch(() => setPhase('new'));
      return;
    }

    id = newDeviceId();
    let saved = true;
    try {
      window.localStorage.setItem(DEVICE_KEY, id);
    } catch {
      saved = false;
    }
    setDeviceId(id);
    setPhase(saved ? 'new' : 'saved-failed');
  }, [router]);

  if (phase === 'checking') {
    return (
      <section id="join" className="card device-entry" aria-live="polite">
        <p className="muted">
          <span className="btn-spinner inline" aria-hidden="true" /> Checking this device…
        </p>
      </section>
    );
  }

  return (
    <section id="join" className="card device-entry">
      <div className="card-head">
        <h2>Pick your player name</h2>
      </div>
      <p className="muted small">
        No password while we&apos;re testing: this browser remembers you. Your name is what other
        players see on the leaderboard.
      </p>
      {phase === 'saved-failed' ? (
        <p className="flash bad" role="alert">
          This browser won&apos;t let the game remember you (private browsing or blocked storage), so
          you&apos;ll start as a new player on your next visit.
        </p>
      ) : null}
      <form action={formAction} className="stack">
        <input type="hidden" name="device" value={deviceId} />
        <label className="field">
          <span>Player name</span>
          <input
            name="name"
            autoComplete="nickname"
            autoCapitalize="none"
            spellCheck={false}
            required
            minLength={3}
            maxLength={20}
            pattern="[A-Za-z0-9_]+"
            title="3–20 letters, numbers, or underscores"
          />
          <small>3–20 letters, numbers, or underscores.</small>
        </label>
        {state?.error ? (
          <p className="flash bad" role="alert">
            {state.error}
          </p>
        ) : null}
        <SubmitButton className="btn primary block" pendingLabel="Entering…" disabled={!deviceId}>
          <Icon name="zap" size={20} strokeWidth={2.2} />
          Enter the arena
        </SubmitButton>
      </form>
    </section>
  );
}
