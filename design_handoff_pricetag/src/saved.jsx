/* global React */
// src/saved.jsx — Pinterest-style masonry of saved homes

const { useState: useStateSv } = React;

function SavedScreen({ saved, listings, onPlay, onHome, accent }) {
  const [filter, setFilter] = useStateSv("all");
  const [sort, setSort] = useStateSv("recent");

  const items = listings.map(l => {
    const s = saved.find(x => x.listingId === l.id);
    return s ? { listing: l, ...s } : null;
  }).filter(Boolean);

  const filtered = items.filter(it => {
    const p = it.listing.price;
    if (filter === "u500") return p < 500_000;
    if (filter === "500-1m") return p >= 500_000 && p < 1_000_000;
    if (filter === "1-3m") return p >= 1_000_000 && p < 3_000_000;
    if (filter === "o3m") return p >= 3_000_000;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "closest") return a.pctOff - b.pctOff;
    if (sort === "worst") return b.pctOff - a.pctOff;
    return 0; // recent: keep order
  });

  // Varied heights for masonry feel
  const heights = [340, 280, 380, 300, 340, 360, 280, 320, 380, 300];

  return (
    <div style={{
      position: "relative", width: "100%", height: "100%",
      background: "var(--paper)", overflow: "auto",
    }}>
      <div style={{ padding: "32px 56px 56px", maxWidth: 1320, margin: "0 auto" }}>

        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <Wordmark size={20}/>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" style={{ fontSize: 14 }} onClick={onHome}>Home</button>
            <button className="btn btn-secondary" style={{ padding: "10px 18px", fontSize: 13 }} onClick={onPlay}>Play</button>
          </div>
        </header>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Your archive</div>
            <h1 className="display" style={{ margin: 0, fontSize: 64, letterSpacing: "-0.025em" }}>
              Homes you'd<br/>actually live in.
            </h1>
            <p style={{ color: "var(--ink-mute)", fontSize: 15, marginTop: 14, maxWidth: 480 }}>
              <span className="tnum">{items.length}</span> saved · pinned during play.
              Filter by price, sort by how badly you guessed.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 0", borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)",
          marginBottom: 28, flexWrap: "wrap", gap: 16,
        }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              { k: "all", label: "All" },
              { k: "u500", label: "Under $500K" },
              { k: "500-1m", label: "$500K – $1M" },
              { k: "1-3m", label: "$1M – $3M" },
              { k: "o3m", label: "Over $3M" },
            ].map(f => (
              <Chip key={f.k} active={filter === f.k} onClick={() => setFilter(f.k)}>{f.label}</Chip>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span className="caption" style={{ color: "var(--ink-mute)" }}>SORT</span>
            {[
              { k: "recent", label: "Recent" },
              { k: "closest", label: "Closest guess" },
              { k: "worst", label: "Worst guess" },
            ].map(s => (
              <Chip key={s.k} active={sort === s.k} onClick={() => setSort(s.k)}>{s.label}</Chip>
            ))}
          </div>
        </div>

        {/* Masonry */}
        <div style={{ columnCount: 3, columnGap: 18 }}>
          {sorted.map((it, i) => {
            const tier = window.reactionFor(it.pctOff);
            return (
              <div key={it.listing.id} style={{
                breakInside: "avoid", marginBottom: 18,
                background: "#fff", borderRadius: 16, overflow: "hidden",
                boxShadow: "0 1px 0 var(--rule), 0 8px 24px -16px rgba(0,0,0,0.18)",
                transition: "transform 280ms var(--ease)",
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "none"}>
                <div style={{
                  height: heights[i % heights.length],
                  backgroundImage: `url(${it.listing.photos[0]})`,
                  backgroundColor: it.listing.bandColor,
                  backgroundSize: "cover", backgroundPosition: "center",
                  position: "relative",
                }}>
                  <div style={{
                    position: "absolute", top: 12, left: 12,
                    padding: "5px 10px", borderRadius: 999,
                    background: tier.color, color: "#fff",
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                  }}>
                    {Math.round(it.accuracy)}% · {tier.label.toUpperCase()}
                  </div>
                  <button className="btn-icon btn" style={{
                    position: "absolute", top: 10, right: 10,
                    width: 36, height: 36, color: accent,
                  }}>
                    <Icon.Heart filled size={16}/>
                  </button>
                </div>
                <div style={{ padding: "14px 16px 16px" }}>
                  <div className="tnum display" style={{
                    fontSize: 24, lineHeight: 1, color: "var(--ink)",
                    letterSpacing: "-0.02em", marginBottom: 4,
                  }}>
                    {window.fmtShortPrice(it.listing.price)}
                  </div>
                  <div style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 500 }}>
                    {it.listing.neighborhood}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>
                    {it.listing.city}, {it.listing.state} · {it.listing.beds === 0 ? "studio" : `${it.listing.beds}bd`} · {it.listing.sqft.toLocaleString()} sqft
                  </div>
                  <div style={{
                    marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--rule)",
                    display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-mute)",
                  }}>
                    <span>You guessed <span className="tnum" style={{ color: "var(--ink)", fontWeight: 600 }}>{window.fmtShortPrice(it.guess)}</span></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {sorted.length === 0 && (
          <EmptyState onPlay={onPlay} accent={accent}/>
        )}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 13px", borderRadius: 999, fontSize: 12, fontWeight: 600,
      background: active ? "var(--ink)" : "transparent",
      color: active ? "var(--paper)" : "var(--ink-mute)",
      boxShadow: active ? "none" : "inset 0 0 0 1px var(--rule)",
      letterSpacing: "0.02em",
      transition: "all 200ms var(--ease)",
    }}>{children}</button>
  );
}

function EmptyState({ onPlay, accent }) {
  return (
    <div style={{
      padding: "80px 40px", textAlign: "center",
      background: "var(--cream)", borderRadius: 18,
    }}>
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ margin: "0 auto 18px" }}>
        <path d="M30 90 L30 50 L60 28 L90 50 L90 90 Z" stroke="var(--ink)" strokeWidth="1.5" fill="var(--paper)"/>
        <rect x="50" y="62" width="20" height="28" stroke="var(--ink)" strokeWidth="1.5" fill="none"/>
        <circle cx="55" cy="76" r="1" fill="var(--ink-mute)"/>
        <path d="M40 74 L40 64 L48 64 L48 74 Z" stroke="var(--ink-mute)" strokeWidth="1"/>
        <path d="M72 74 L72 64 L80 64 L80 74 Z" stroke="var(--ink-mute)" strokeWidth="1"/>
      </svg>
      <h3 className="display" style={{ fontSize: 28, margin: "0 0 8px" }}>Nothing saved yet.</h3>
      <p style={{ color: "var(--ink-mute)", margin: "0 0 22px" }}>
        Tap the heart on any home you'd actually live in.
      </p>
      <button className="btn btn-primary" onClick={onPlay} style={{ background: accent }}>
        Start playing <Icon.Arrow size={18}/>
      </button>
    </div>
  );
}

window.SavedScreen = SavedScreen;
