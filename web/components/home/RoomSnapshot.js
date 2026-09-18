import Link from 'next/link';
import { tierInfo } from '../../lib/trading/game';
import { signedMoney, tone } from '../../lib/utils/format';

const TOP = 5;

// The top of the player's room, straight from leaderboard(). Only real
// players who joined the room appear; a room with just the player in it is
// shown as exactly that. If the player is outside the top five, their own
// row is kept visible underneath.
//
// entry    - the player's current entry
// board    - leaderboard(entry.room_id)
// canStillFill - whether other players can still join this room (its week
//                is the one open for joining right now)
export default function RoomSnapshot({ entry, board, canStillFill }) {
  const info = tierInfo(entry.tier);
  const settled = entry.league_status === 'settled';
  const meIndex = board.findIndex((r) => r.entry_id === entry.id);
  const count = board.length;

  const placeOf = (r, i) => (settled && r.final_rank ? r.final_rank : i + 1);

  let alone = null;
  if (count < 2) {
    if (settled) alone = 'You were the only player in this room.';
    else if (canStillFill) alone = "You're the first one here. Your room fills up as more players join this league.";
    else alone = 'Nobody else joined this room this week.';
  }

  return (
    <section className="card" aria-labelledby="home-room-title">
      <div className="card-head">
        <div className="home-room-title">
          <h2 id="home-room-title">Your room</h2>
          <p className="caption">
            {info?.label ?? 'League'} · Room {entry.room_number} · {count} {count === 1 ? 'player' : 'players'}
          </p>
        </div>
        <Link href="/league" className="btn small outline">
          Full leaderboard
        </Link>
      </div>

      <ol className="board">
        {board.slice(0, TOP).map((r, i) => (
          <BoardRow key={r.entry_id} row={r} place={placeOf(r, i)} me={r.entry_id === entry.id} />
        ))}
        {meIndex >= TOP ? (
          <BoardRow row={board[meIndex]} place={placeOf(board[meIndex], meIndex)} me gap />
        ) : null}
      </ol>

      {alone ? <p className="empty">{alone}</p> : null}
    </section>
  );
}

function BoardRow({ row, place, me, gap = false }) {
  const profit = Number(row.value) - Number(row.starting_balance);
  const classes = [me ? 'me' : '', gap ? 'home-board-gap' : ''].filter(Boolean).join(' ');
  return (
    <li className={classes || undefined}>
      <span className={place <= 3 ? `place p${place}` : 'place'}>{place}</span>
      <span className="who home-who">
        <span className="home-who-name">{row.display_name}</span>
        {me ? <span className="you">you</span> : null}
      </span>
      <span className={`num ${tone(profit)}`}>{signedMoney(profit)}</span>
    </li>
  );
}
