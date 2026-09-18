'use server';

import { redirect } from 'next/navigation';
import { one } from './db';
import { currentUser, endSession, hashPassword, startSession, verifyPassword } from './db/auth';
import { GameError, cancelOrder, joinLeague, marketOpen, placeOrder, tierInfo } from './trading/game';

// Every action redirects back with a message in the query string. redirect()
// works by throwing, so it's always called outside try/catch blocks.

function to(path, key, message) {
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}${key}=${encodeURIComponent(message)}`;
}

async function userOrLogin() {
  const user = await currentUser();
  if (!user) redirect('/login');
  return user;
}

function playerMessage(err) {
  if (err instanceof GameError) return err.message;
  throw err;
}

// ---------------------------------------------------------------- accounts

export async function signup(formData) {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
    redirect(to('/login', 'error', 'Usernames are 3–20 letters, numbers, or underscores.'));
  }
  if (password.length < 8) {
    redirect(to('/login', 'error', 'Passwords need at least 8 characters.'));
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
  if (taken) redirect(to('/login', 'error', 'That username is taken.'));

  await startSession(user.id);
  redirect('/league');
}

export async function login(formData) {
  const username = String(formData.get('username') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  const user = await one('SELECT id, password_hash FROM users WHERE username = $1', [username]);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    redirect(to('/login', 'error', 'Wrong username or password.'));
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
  const amount = Math.round(Number(formData.get('amount')) * 100) / 100;
  const back = `/trade/${symbol}`;

  let error = null;
  try {
    await placeOrder(user.id, { symbol, side, amount, sellAll });
  } catch (err) {
    error = playerMessage(err);
  }
  if (error) redirect(to(back, 'error', error));

  const when = marketOpen()
    ? 'It fills at the next price update, usually within a minute.'
    : 'The market is closed, so it fills when the market opens.';
  redirect(to(back, 'ok', `Order placed. ${when}`));
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
