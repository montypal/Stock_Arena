import Icon from '../layout/icons';
import { money, pct, signedMoney, tone } from '../../lib/utils/format';

// Full ranking for the player's room, with per-player stats.
//
// board - rows from leaderboard(entry.room_id), already ordered by value
// entry - the player's entry from currentEntry()
//
// Only the rows leaderboard() returns are shown: real players who joined
// this room. A room with one player is shown as it is, never padded out.
//
// Phones get two-line rows:  rank · name · value
//                                   P/L (return)      stocks · coins
// From 768px the stat groups flatten into grid columns under a header row.
export default function LeagueBoard({ board, entry }) {
  const settled = entry.league_status === 'settled';
  const count = board.length;

  return (
    <section
      className={`card battle-board-card${settled ? ' is-final' : ''}`}
      aria-labelledby="battle-board-title"
    >
      <div className="battle-board-top">
        <span className="battle-tile" aria-hidden="true">
          <Icon name="bars" size={22} strokeWidth={2.2} />
        </span>
        <div className="battle-board-title">
          <h2 id="battle-board-title">Leaderboard</h2>
          <p className="sub">
            Room {entry.room_number} · {count} {count === 1 ? 'player' : 'players'}
          </p>
        </div>
        {settled ? <span className="pill gold">Final</span> : null}
      </div>

      {count > 0 ? (
        <div className="battle-table">
          <div className="battle-board-head" aria-hidden="true">
            <span>#</span>
            <span>Player</span>
            <span>Value</span>
            <span>P/L</span>
            <span>Return</span>
            <span>Stocks</span>
            {settled ? <span>Coins</span> : null}
          </div>
          <ol className="board battle-board">
            {board.map((r, i) => {
              const rank = settled && r.final_rank ? Number(r.final_rank) : i + 1;
              const start = Number(r.starting_balance);
              const value = Number(r.value);
              const profit = value - start;
              const change = start ? profit / start : 0;
              const held = Number(r.stocks ?? 0);
              const coins = Number(r.coins_awarded ?? 0);
              const me = r.entry_id === entry.id;
              const t = tone(profit);
              return (
                <li
                  key={r.entry_id}
                  className={me ? 'me' : undefined}
                  aria-current={me ? 'true' : undefined}
                >
                  <span className={`place${rank <= 3 ? ` p${rank}` : ''}`}>
                    <span className="battle-sr">Rank </span>
                    {rank}
                  </span>
                  <span className="who battle-who">
                    <span className="battle-name">{r.display_name}</span>
                    {me ? <span className="you">You</span> : null}
                  </span>
                  <span className="battle-value num">
                    <span className="battle-sr">Portfolio value </span>
                    {money(value)}
                  </span>
                  <span className="battle-stats">
                    <span className="battle-pl">
                      <span className={`battle-cell num ${t}`}>
                        <span className="battle-sr">Profit </span>
                        {signedMoney(profit)}
                      </span>
                      <span className={`battle-cell num ${t}`}>
                        <span className="battle-sr">Return </span>
                        <span className="battle-m" aria-hidden="true">
                          (
                        </span>
                        {pct(change)}
                        <span className="battle-m" aria-hidden="true">
                          )
                        </span>
                      </span>
                    </span>
                    <span className="battle-extra">
                      <span className="battle-cell num">
                        <span className="battle-sr">Stocks held </span>
                        {held}
                        <span className="battle-m battle-unit" aria-hidden="true">
                          {held === 1 ? ' stock' : ' stocks'}
                        </span>
                      </span>
                      {settled ? (
                        <span className="battle-cell num gold">
                          <span className="battle-sr">Coins won </span>
                          {coins.toLocaleString('en-US')}
                          <span className="battle-m battle-unit" aria-hidden="true">
                            {' coins'}
                          </span>
                        </span>
                      ) : null}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      ) : null}

      {count <= 1 ? (
        <p className="empty battle-board-note">
          {settled
            ? 'You were the only player in this room.'
            : "You're the first one here — the room fills up as more players join this league."}
        </p>
      ) : null}
    </section>
  );
}
