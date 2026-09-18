import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { randomBytes, scrypt as scryptCb, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { query, one } from './index';

const scrypt = promisify(scryptCb);

const COOKIE = 'sa_session';
const SESSION_DAYS = 30;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, saltB64, keyB64] = String(stored).split('$');
  if (scheme !== 'scrypt' || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, 'base64');
  const key = await scrypt(password, Buffer.from(saltB64, 'base64'), expected.length);
  return timingSafeEqual(key, expected);
}

// Only a hash of the session token is stored, so a leaked sessions table
// can't be used to log in as anyone.
function digest(token) {
  return createHash('sha256').update(token).digest('hex');
}

export async function startSession(userId) {
  const token = randomBytes(32).toString('base64url');
  await query(
    `INSERT INTO sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, now() + make_interval(days => $3))`,
    [digest(token), userId, SESSION_DAYS]
  );
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await query('DELETE FROM sessions WHERE token_hash = $1', [digest(token)]);
  store.delete(COOKIE);
}

export async function currentUser() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  return one(
    `SELECT u.id, u.username, u.display_name, u.coins
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [digest(token)]
  );
}

// Signed-out visitors go to the landing page, which signs this device in.
export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect('/');
  return user;
}

// ------------------------------------------------------------ device identity
// TEMPORARY, for testing while the login page is removed (9/17/26). Each
// browser keeps a random device id in localStorage (components/auth/
// DeviceEntry.js). The server stores only a sha256 of it, so the users table
// alone can't be used to sign in as anyone. Every device account is a real
// person who chose their own player name (contextHistory rule 17).

const DEVICE_ID = /^[A-Za-z0-9-]{32,64}$/;

export function validDeviceId(id) {
  return typeof id === 'string' && DEVICE_ID.test(id);
}

export async function userForDevice(deviceId) {
  if (!validDeviceId(deviceId)) return null;
  return one('SELECT id, display_name FROM users WHERE device_hash = $1', [digest(deviceId)]);
}

// password_hash 'device' can never pass verifyPassword, so device accounts
// can't be reached through the (currently removed) password login.
export async function createDeviceUser(deviceId, name) {
  return one(
    `INSERT INTO users (username, display_name, password_hash, device_hash)
     VALUES ($1, $2, 'device', $3)
     RETURNING id`,
    [name.toLowerCase(), name, digest(deviceId)]
  );
}
