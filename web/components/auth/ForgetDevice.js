'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '../layout/icons';
import { forgetDevice } from '../../lib/actions';
import { DEVICE_KEY } from './DeviceEntry';

// TEMPORARY stand-in for "Log out" while players are identified by device.
// Signing out also forgets this browser's device id, so the next visit starts
// a new player; this player's record stays in the game.
export default function ForgetDevice() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function forget() {
    setBusy(true);
    try {
      await forgetDevice();
    } finally {
      try {
        window.localStorage.removeItem(DEVICE_KEY);
      } catch {
        // storage blocked: nothing to clear
      }
      router.push('/');
      router.refresh();
    }
  }

  if (!confirming) {
    return (
      <button type="button" className="btn ghost block" onClick={() => setConfirming(true)}>
        <Icon name="logout" size={20} />
        Sign out of this device
      </button>
    );
  }

  return (
    <div className="card forget-device" role="alertdialog" aria-label="Sign out of this device">
      <p>
        Signing out forgets this device. Your next visit here starts a <strong>new player</strong>,
        and this player can&apos;t be reopened from this browser while there&apos;s no login page.
      </p>
      <div className="forget-actions">
        <button type="button" className="btn ghost" onClick={() => setConfirming(false)} disabled={busy}>
          Keep playing
        </button>
        <button type="button" className="btn danger" onClick={forget} disabled={busy} aria-busy={busy ? 'true' : undefined}>
          {busy ? <span className="btn-spinner" aria-hidden="true" /> : null}
          Sign out
        </button>
      </div>
    </div>
  );
}
