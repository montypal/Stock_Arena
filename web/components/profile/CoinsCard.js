import Icon from '../layout/icons';

// The player's coin balance: labelled coin icon, big number, caption.
// Shared by Progress and Profile. Coins are the persistent profile currency
// and never mix with league cash. Extra content (e.g. a stats row) goes in
// children.
export default function CoinsCard({ coins, label = 'Coins', children }) {
  const value = Number(coins ?? 0).toLocaleString();
  return (
    <section className="hero-card acct-coins">
      <p className="eyebrow">{label}</p>
      <p className="big-number acct-coins-value">
        <Icon name="coin" size={34} strokeWidth={2} className="acct-coin-icon" />
        <span>{value}</span>
      </p>
      <p className="caption">Earned by finishing leagues. Coins are for in-game rewards only.</p>
      {children}
    </section>
  );
}
