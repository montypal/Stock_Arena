'use server';

import { redirect } from 'next/navigation';
import { one } from './db';
import {
  createDeviceUser,
  currentUser,
  endSession,
  hashPassword,
  startSession,
  userForDevice,
  validDeviceId,
  verifyPassword,
} from './db/auth';
import { GameError, cancelOrder, joinLeague, marketOpen, placeOrder, tierInfo } from './trading/game';
import { buddy, setActiveBuddy, unlockBuddy } from './rewards/buddies';

// Every action redirects back with a message in the query string. redirect()
// works by throwing, so it's always called outside try/catch blocks.

function to(path, key, message) {
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}${key}=${encodeURIComponent(message)}`;
}

async function userOrLogin() {
  const user = await currentUser();
  if (!user) redirect('/');
  return user;
}

function playerMessage(err) {
  if (err instanceof GameError) return err.message;
  throw err;
}

// ---------------------------------------------------------- device identity
// TEMPORARY while the login page is removed for testing (9/17/26): players are
// recognised by a device id kept in their browser's localStorage. See
// lib/db/auth.js and components/auth/DeviceEntry.js.

const PLAYER_NAME = /^[A-Za-z0-9_]{3,20}$/;

// Called by DeviceEntry on page load. Signs this device's player back in, or
// returns { ok: false } for a device the game hasn't seen.
export async function resumeDevice(deviceId) {
  let user = null;
  try {
    user = await userForDevice(String(deviceId ?? ''));
  } catch (err) {
    if (err.code === '42703') return { ok: false }; // column not migrated yet
    throw err;
  }
  if (!user) return { ok: false };
  await startSession(user.id);
  return { ok: true };
}

// First visit on a device: the player picks the name everyone will see.
// Used with useActionState, so errors come back as { error }.
export async function enterWithDevice(prevState, formData) {
  const deviceId = String(formData.get('device') ?? '');
  const name = String(formData.get('name') ?? '').trim();

  if (!validDeviceId(deviceId)) {
    return { error: "This browser couldn't save a device ID. Reload the page and try again." };
  }

  let userId = null;
  let error = null;
  try {
    const existing = await userForDevice(deviceId);
    if (existing) {
      userId = existing.id;
    } else if (!PLAYER_NAME.test(name)) {
      error = 'Player names are 3–20 letters, numbers, or underscores.';
    } else {
      userId = (await createDeviceUser(deviceId, name)).id;
    }
  } catch (err) {
    if (err.code === '23505') error = 'That name is taken. Pick another.';
    else if (err.code === '42703') error = 'The game is finishing an update. Try again in a minute.';
    else throw err;
  }
  if (error) return { error };

  await startSession(userId);
  redirect('/');
}

// Signs this browser out; DeviceEntry then clears the stored device id, so
// the next visit starts a new player.
export async function forgetDevice() {
  await endSession();
  return { ok: true };
}

// ---------------------------------------------------------------- accounts
// Password sign-up/login are kept for when the login page comes back; nothing
// calls them while it is removed.

export async function signup(formData) {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
    redirect(to('/', 'error', 'Usernames are 3–20 letters, numbers, or underscores.'));
  }
  if (password.length < 8) {
    redirect(to('/', 'error', 'Passwords need at least 8 characters.'));
  }

  const hash = await hashPassword(password);
  let user = null;
  let taken = false;
  try {
    user = await one(
      `INSERT INTO users (username, display_name, password_hash)
       VALUES ($1, $2, $3) RETURNING id`,
      [username.toLowerCase(), username, hash]
    );
  } catch (err) {
    if (err.code !== '23505') throw err;
    taken = true;
  }
  if (taken) redirect(to('/', 'error', 'That username is taken.'));

  await startSession(user.id);
  redirect('/league');
}

export async function login(formData) {
  const username = String(formData.get('username') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  const user = await one('SELECT id, password_hash FROM users WHERE username = $1', [username]);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    redirect(to('/', 'error', 'Wrong username or password.'));
  }

  await startSession(user.id);
  redirect('/league');
}

export async function logout() {
  await endSession();
  redirect('/');
}

// ----------------------------------------------------------------- leagues

export async function join(formData) {
  const user = await userOrLogin();
  const tier = Number(formData.get('tier'));

  let error = null;
  try {
    await joinLeague(user.id, tier);
  } catch (err) {
    error = playerMessage(err);
  }
  if (error) redirect(to('/league', 'error', error));

  redirect(to('/league', 'ok', `You're in the ${tierInfo(tier).label}. Time to pick some stocks.`));
}

// ----------------------------------------------------------------- trading

export async function trade(formData) {
  const user = await userOrLogin();
  const symbol = String(formData.get('symbol') ?? '').toUpperCase().replace(/[^A-Z.]/g, '');
  const side = String(formData.get('side') ?? '');
  const sellAll = formData.get('all') === '1';
  const shares = Number(formData.get('shares'));
  const entryIdRaw = String(formData.get('entry_id') ?? '').trim();
  const entryId = entryIdRaw ? Number(entryIdRaw) : undefined;
  const tierRaw = String(formData.get('tier') ?? '').trim();
  const tier = tierRaw ? Number(tierRaw) : null;
  const back = tier ? `/trade/${symbol}?tier=${tier}` : `/trade/${symbol}`;

  if (side !== 'buy' && side !== 'sell') {
    redirect(to(back, 'error', 'Bad order side.'));
    return;
  }

  let error = null;
  try {
    await placeOrder(user.id, { symbol, side, shares, sellAll, entryId });
  } catch (err) {
    error = playerMessage(err);
  }
  if (error) {
    redirect(to(back, 'error', error));
    return;
  }

  // "Sell all" posts no share count of its own -- placeOrder reads the held
  // amount off the position -- so interpolating `shares` here used to confirm
  // "Sold NaN AAPL". Say what actually happened instead.
  const did = sellAll
    ? `Sold all your ${symbol}`
    : `${side === 'buy' ? 'Bought' : 'Sold'} ${shares} ${symbol}`;
  redirect(to(back, 'ok', `Order executed — ${did}.`));
}

export async function cancel(formData) {
  const user = await userOrLogin();
  const orderId = Number(formData.get('order_id'));
  const raw = String(formData.get('back') ?? '/league');
  const back = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/league';

  let error = null;
  try {
    await cancelOrder(user.id, orderId);
  } catch (err) {
    error = playerMessage(err);
  }
  if (error) redirect(to(back, 'error', error));

  redirect(to(back, 'ok', 'Order cancelled.'));
}

// ----------------------------------------------------------------- buddies
// Buddies cost coins, never league cash. The buddy table and users.active_buddy
// come from worker/schema.sql, which the worker applies when it starts, so
// Vercel can be live first: 42P01 undefined_table, 42703 undefined_column.

function buddyMessage(err) {
  if (err.code === '42P01' || err.code === '42703') {
    return 'Buddies are finishing an update. Try again in a minute.';
  }
  return playerMessage(err);
}

export async function pickBuddy(formData) {
  const user = await userOrLogin();
  const slug = String(formData.get('slug') ?? '');

  let error = null;
  try {
    await setActiveBuddy(user.id, slug);
  } catch (err) {
    error = buddyMessage(err);
  }
  if (error) redirect(to('/profile', 'error', error));

  redirect(to('/profile', 'ok', `${buddy(slug)?.name ?? 'Your buddy'} is out with you now.`));
}

export async function buyBuddy(formData) {
  const user = await userOrLogin();
  const slug = String(formData.get('slug') ?? '');

  let error = null;
  let already = false;
  try {
    const result = await unlockBuddy(user.id, slug);
    already = Boolean(result?.already);
  } catch (err) {
    error = buddyMessage(err);
  }
  if (error) redirect(to('/profile', 'error', error));

  const name = buddy(slug)?.name ?? 'Your buddy';
  redirect(
    to('/profile', 'ok', already ? `${name} is already yours, and out with you now.` : `${name} unlocked.`)
  );
}
