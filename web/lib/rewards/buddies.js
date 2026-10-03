import { one, query, transaction } from '../db';
import { GameError } from '../trading/game';

// The buddy catalogue.
//
// A buddy is the little 3D character that lives in the corner of Home, does
// idle animations, reacts to how the player's week is going, and opens a stats
// panel when tapped (contextHistory.md "The Buddy -- Your Companion & Stats
// Hub"). Characters live here in code; the database only records what a player
// owns (user_buddies) and which one is out (users.active_buddy).
//
// Adding a character: drop its .glb in web/public/models/, add one entry below
// with the clip names its rig actually ships, and give it a coin price. A
// price of 0 means every player has it.
//
// `clips` maps a mood to a clip name in that model's .glb. Missing moods fall
// back to `idle`, so a rig with one clip still works.

export const BUDDIES = [
  {
    slug: 'bull',
    name: 'Rally',
    species: 'Bull',
    blurb: 'Warms up while you trade, backflips when your week is green, drops into push-ups when it is not.',
    price: 0,
    model: '/models/retargeted_animations.glb',
    // Clips this GLB actually contains: Backflip, Jog, Pushup, Run_Anime, Sprint.
    clips: {
      idle: 'Jog',
      happy: 'Backflip',
      sad: 'Pushup',
      winning: 'Sprint',
    },
  },
];

export function buddy(slug) {
  return BUDDIES.find((b) => b.slug === slug) ?? null;
}

export const DEFAULT_BUDDY = BUDDIES[0];

// Buddies every player has without spending anything.
const FREE = BUDDIES.filter((b) => b.price === 0).map((b) => b.slug);

// Which buddy to show, and which the player owns. Tolerates the tables not
// existing yet (the worker applies schema.sql on start, Vercel may deploy
// first): 42P01 undefined_table, 42703 undefined_column.
export async function buddyState(userId) {
  if (!userId) return { owned: FREE, active: DEFAULT_BUDDY.slug };
  let owned = [...FREE];
  let active = null;
  try {
    const rows = await query('SELECT slug FROM user_buddies WHERE user_id = $1', [userId]);
    for (const r of rows) if (!owned.includes(r.slug)) owned.push(r.slug);
  } catch (err) {
    if (err.code !== '42P01' && err.code !== '42703') throw err;
  }
  try {
    const row = await one('SELECT active_buddy FROM users WHERE id = $1', [userId]);
    active = row?.active_buddy ?? null;
  } catch (err) {
    if (err.code !== '42703') throw err;
  }
  // A buddy that was removed from the catalogue, or was never chosen, falls
  // back to the default rather than rendering nothing.
  if (!active || !buddy(active) || !owned.includes(active)) active = DEFAULT_BUDDY.slug;
  return { owned, active };
}

// Spend coins on a buddy. One transaction, so coins can never leave the
// profile without the buddy arriving, and a double-tap can't buy twice.
export async function unlockBuddy(userId, slug) {
  const b = buddy(slug);
  if (!b) throw new GameError("That buddy isn't in the catalogue.");
  if (!b.model) throw new GameError(`${b.name} isn't ready yet.`);
  if (b.price === 0) {
    await setActiveBuddy(userId, slug);
    return { already: true };
  }

  return transaction(async (c) => {
    const have = await c.query('SELECT 1 FROM user_buddies WHERE user_id = $1 AND slug = $2', [
      userId,
      slug,
    ]);
    if (have.rowCount) {
      await c.query('UPDATE users SET active_buddy = $1 WHERE id = $2', [slug, userId]);
      return { already: true };
    }

    const spent = await c.query(
      'UPDATE users SET coins = coins - $1, active_buddy = $2 WHERE id = $3 AND coins >= $1 RETURNING coins',
      [b.price, slug, userId]
    );
    if (!spent.rowCount) {
      throw new GameError(`${b.name} costs ${b.price.toLocaleString()} coins — you don't have enough yet.`);
    }
    await c.query(
      'INSERT INTO user_buddies (user_id, slug, coins_spent) VALUES ($1, $2, $3)',
      [userId, slug, b.price]
    );
    return { already: false, coins: Number(spent.rows[0].coins) };
  });
}

export async function setActiveBuddy(userId, slug) {
  const b = buddy(slug);
  if (!b) throw new GameError("That buddy isn't in the catalogue.");
  const { owned } = await buddyState(userId);
  if (!owned.includes(slug)) throw new GameError(`You haven't unlocked ${b.name} yet.`);
  await query('UPDATE users SET active_buddy = $1 WHERE id = $2', [slug, userId]);
}

// How the buddy should behave, from the player's week so far.
// Returns one of the moods in a buddy's `clips` map.
export function mood({ change = 0, place = 0 } = {}) {
  if (place === 1) return 'winning';
  if (change > 0.02) return 'happy';
  if (change < -0.01) return 'sad';
  return 'idle';
}
