function Bar({ w = '100%', h = 14 }) {
  return (
    <div
      aria-hidden="true"
      style={{ width: w, height: h, borderRadius: 8, background: 'rgba(255,255,255,0.09)' }}
    />
  );
}

function CardSkeleton({ lines = 3 }) {
  return (
    <section className="card" aria-hidden="true">
      <div style={{ display: 'grid', gap: 10 }}>
        <Bar w="45%" h={16} />
        {Array.from({ length: lines }).map((_, i) => (
          <Bar key={i} w={i === lines - 1 ? '70%' : '100%'} />
        ))}
      </div>
    </section>
  );
}

export function HomeSkeleton() {
  return (
    <main aria-busy="true" aria-label="Loading home">
      <section className="hero-card" aria-hidden="true">
        <div style={{ display: 'grid', gap: 10 }}>
          <Bar w="35%" h={16} />
          <Bar w="60%" h={26} />
        </div>
      </section>
      <div className="split home-split">
        <div className="col">
          <CardSkeleton lines={4} />
          <CardSkeleton lines={2} />
        </div>
        <aside className="col" aria-hidden="true">
          <CardSkeleton lines={3} />
        </aside>
      </div>
    </main>
  );
}

export function LeagueSkeleton() {
  return (
    <main aria-busy="true" aria-label="Loading battles">
      <section className="hero-card" aria-hidden="true">
        <div style={{ display: 'grid', gap: 10 }}>
          <Bar w="30%" h={16} />
          <Bar w="55%" h={26} />
        </div>
      </section>
      <CardSkeleton lines={5} />
      <CardSkeleton lines={3} />
    </main>
  );
}

export function TradeSkeleton() {
  return (
    <main className="trade-market" aria-busy="true" aria-label="Loading trade">
      <section className="hero-card" aria-hidden="true">
        <div style={{ display: 'grid', gap: 10 }}>
          <Bar w="35%" h={16} />
          <Bar w="50%" h={26} />
        </div>
      </section>
      <section className="card flush" aria-hidden="true">
        <div style={{ display: 'grid', gap: 10 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Bar key={i} h={44} />
          ))}
        </div>
      </section>
    </main>
  );
}

export function DailySkeleton() {
  return (
    <main aria-busy="true" aria-label="Loading daily">
      <section className="hero-card" aria-hidden="true">
        <div style={{ display: 'grid', gap: 10 }}>
          <Bar w="30%" h={16} />
          <Bar w="55%" h={26} />
        </div>
      </section>
      <div className="grid-2">
        <CardSkeleton lines={3} />
        <CardSkeleton lines={3} />
      </div>
    </main>
  );
}

export function ProgressSkeleton() {
  return (
    <main aria-busy="true" aria-label="Loading progress">
      <section className="hero-card" aria-hidden="true">
        <div style={{ display: 'grid', gap: 10 }}>
          <Bar w="30%" h={16} />
          <Bar w="50%" h={26} />
        </div>
      </section>
      <div className="split">
        <div className="col">
          <CardSkeleton lines={3} />
        </div>
        <div className="col">
          <CardSkeleton lines={4} />
        </div>
      </div>
    </main>
  );
}

export function ProfileSkeleton() {
  return (
    <main className="acct-profile" aria-busy="true" aria-label="Loading profile">
      <section className="hero-card" aria-hidden="true">
        <div style={{ display: 'grid', gap: 10 }}>
          <Bar w="30%" h={16} />
          <Bar w="45%" h={26} />
        </div>
      </section>
      <div className="split">
        <div className="col">
          <CardSkeleton lines={4} />
          <CardSkeleton lines={5} />
        </div>
        <div className="col">
          <CardSkeleton lines={3} />
        </div>
      </div>
    </main>
  );
}
