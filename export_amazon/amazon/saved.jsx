/* global React */
// amazon/saved.jsx — masonry of saved products

const { useState: useStateSv } = React;

function SavedScreen({ saved, products, onPlay, onHome, accent }) {
  const [filter, setFilter] = useStateSv("all");
  const [sort, setSort] = useStateSv("recent");

  const items = products.map(p => {
    const s = saved.find(x => x.productId === p.id);
    return s ? { product: p, ...s } : null;
  }).filter(Boolean);

  const filtered = items.filter(it => {
    const p = it.product.price;
    if (filter === "u50") return p < 50;
    if (filter === "50-150") return p >= 50 && p < 150;
    if (filter === "150-500") return p >= 150 && p < 500;
    if (filter === "o500") return p >= 500;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "closest") return a.pctOff - b.pctOff;
    if (sort === "worst") return b.pctOff - a.pctOff;
    return 0;
  });

  const heights = [300, 250, 320, 270, 300, 320, 250, 290, 320, 270];

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
            <div className="eyebrow" style={{ marginBottom: 10 }}>Your wishlist</div>
            <h1 className="display" style={{ margin: 0, fontSize: 60, letterSpacing: "-0.025em" }}>
              Stuff you'd<br/>actually buy.
            </h1>
            <p style={{ color: "var(--ink-mute)", fontSize: 15, marginTop: 14, maxWidth: 500 }}>
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
              { k: "u50", label: "Under $50" },
              { k: "50-150", label: "$50 – $150" },
              { k: "150-500", label: "$150 – $500" },
              { k: "o500", label: "Over $500" },
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
              <div key={it.product.id} style={{
                breakInside: "avoid", marginBottom: 18,
                background: "#fff", borderRadius: 16, overflow: "hidden",
                boxShadow: "0 1px 0 var(--rule), 0 8px 24px -16px rgba(0,0,0,0.18)",
                transition: "transform 280ms var(--ease)",
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "none"}>
                <div style={{
                  height: heights[i % heights.length],
                  background: `radial-gradient(120% 100% at 50% 10%, #fff 0%, ${it.product.bandColor}22 80%)`,
                  position: "relative",
                }}>
                  <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage: `url(${it.product.photos[0]})`,
                    backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center",
                    filter: "drop-shadow(0 14px 22px rgba(0,0,0,0.16))",
                  }}/>
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
                    letterSpacing: "-0.02em", marginBottom: 6,
                  }}>
                    {window.fmtPrice(it.product.price)}
                  </div>
                  <div style={{
                    fontSize: 13.5, color: "var(--ink)", fontWeight: 500, lineHeight: 1.3,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {it.product.title}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
                    <Stars value={it.product.rating} size={12}/>
                    <span className="tnum" style={{ fontSize: 11, color: "var(--ink-mute)" }}>
                      {it.product.rating.toFixed(1)} · {(it.product.reviews/1000).toFixed(0)}K
                    </span>
                  </div>
                  <div style={{
                    marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--rule)",
                    display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-mute)",
                  }}>
                    <span>You guessed <span className="tnum" style={{ color: "var(--ink)", fontWeight: 600 }}>{window.fmtPrice(it.guess)}</span></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {sorted.length === 0 && <EmptyState onPlay={onPlay} accent={accent}/>}
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
      letterSpacing: "0.02em", transition: "all 200ms var(--ease)",
    }}>{children}</button>
  );
}

function EmptyState({ onPlay, accent }) {
  return (
    <div style={{ padding: "80px 40px", textAlign: "center", background: "var(--cream)", borderRadius: 18 }}>
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ margin: "0 auto 18px" }}>
        <path d="M34 44 L86 44 L80 92 L40 92 Z" stroke="var(--ink)" strokeWidth="1.5" fill="var(--paper)"/>
        <path d="M48 50 L48 38 A12 12 0 0 1 72 38 L72 50" stroke="var(--ink)" strokeWidth="1.5" fill="none"/>
      </svg>
      <h3 className="display" style={{ fontSize: 28, margin: "0 0 8px" }}>Nothing saved yet.</h3>
      <p style={{ color: "var(--ink-mute)", margin: "0 0 22px" }}>
        Tap the heart on any product you'd actually buy.
      </p>
      <button className="btn btn-primary" onClick={onPlay} style={{ background: accent }}>
        Start playing <Icon.Arrow size={18}/>
      </button>
    </div>
  );
}

window.SavedScreen = SavedScreen;
