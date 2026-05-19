/* global React */
// src/daily/play.jsx — Single-guess play screen for daily

const { useState: useStatePD, useEffect: useEffectPD } = React;

function DailyPlay() {
  const [guess, setGuess] = useStatePD(1_500_000);
  const [interacted, setInteracted] = useStatePD(true); // pre-engaged for the mock
  const listing = window.TODAY.listing;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "var(--paper)", overflow: "hidden", display: "flex", flexDirection: "column" }}>

      {/* Top bar */}
      <header style={{
        flex: "0 0 auto", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 28px", zIndex: 5,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <window.Wordmark size={17}/>
          <div style={{ width: 1, height: 18, background: "var(--rule)" }}/>
          <window.DailyBadge/>
          <span style={{ fontSize: 13, color: "var(--ink-mute)" }} className="tnum">
            {window.TODAY.date}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: "rgba(255,92,57,0.1)", color: "var(--accent)", fontSize: 12, fontWeight: 700 }}>
            <window.Icon.Flame size={13}/>
            <span className="tnum">12 day streak</span>
          </span>
          <button className="btn btn-icon"><window.Icon.X size={16}/></button>
        </div>
      </header>

      {/* Main grid */}
      <div style={{
        flex: "1 1 auto", display: "grid",
        gridTemplateColumns: "minmax(0, 1.55fr) minmax(420px, 1fr)",
        padding: "0 28px 28px", minHeight: 0,
      }}>
        {/* Photo */}
        <div style={{
          position: "relative", borderRadius: 18, overflow: "hidden",
          boxShadow: "0 10px 36px -16px rgba(0,0,0,0.35)",
          backgroundImage: `url(${listing.photos[0]})`,
          backgroundSize: "cover", backgroundPosition: "center",
        }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 22%, transparent 60%, rgba(0,0,0,0.45) 100%)" }}/>

          {/* "Single guess" banner — top */}
          <div style={{
            position: "absolute", top: 16, left: 16, zIndex: 3,
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 14px", borderRadius: 999,
            background: "rgba(15,17,13,0.78)", color: "var(--paper)",
            backdropFilter: "blur(10px)",
            boxShadow: "inset 0 0 0 1px rgba(255,214,107,0.4)",
          }}>
            <svg width={12} height={12} viewBox="0 0 16 16" fill="var(--spot)"><path d="M8 0l2 5.5h6L11 9l2 6-5-3.5L3 15l2-6-5-3.5h6z"/></svg>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>ONE GUESS · NO DO-OVERS</span>
          </div>

          {/* Photo counter */}
          <div style={{
            position: "absolute", top: 16, right: 16,
            background: "rgba(26,26,26,0.72)", color: "var(--paper)",
            padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600,
          }} className="tnum">
            1 <span style={{ opacity: 0.55 }}>/</span> {listing.photoCount}
          </div>

          {/* Bottom info */}
          <div style={{
            position: "absolute", bottom: 18, left: 18, right: 18, zIndex: 3,
            display: "flex", alignItems: "flex-end", justifyContent: "space-between",
            color: "var(--paper)",
          }}>
            <div>
              <div className="eyebrow" style={{ color: "rgba(247,244,238,0.7)", marginBottom: 6 }}>
                South Carolina · Historic district
              </div>
              <div className="display" style={{ fontSize: 26, fontStyle: "italic" }}>
                "{listing.nickname}"
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-icon"><window.Icon.Arrow dir="left" size={18}/></button>
              <button className="btn btn-icon"><window.Icon.Arrow size={18}/></button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ padding: "8px 0 0 36px", display: "flex", flexDirection: "column" }}>

          <div style={{ paddingBottom: 18, marginBottom: 18, borderBottom: "1px solid var(--rule)" }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Listed in {listing.city}</div>
            <h2 style={{ fontFamily: "var(--display)", fontStyle: "italic", fontWeight: 500, fontSize: 32, lineHeight: 1.05, margin: "0 0 8px", color: "var(--ink)" }}>
              {listing.neighborhood},<br/>
              <span style={{ color: "var(--ink-mute)" }}>{listing.city}, {listing.state}</span>
            </h2>
            <p style={{ fontSize: 14, color: "var(--ink-mute)", margin: "0 0 14px", lineHeight: 1.5 }}>
              {listing.blurb}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 18px" }}>
              <window.Stat icon={window.Icon.Bed} label="bd" value={listing.beds}/>
              <window.Stat icon={window.Icon.Bath} label="ba" value={listing.baths}/>
              <window.Stat icon={window.Icon.Sqft} label="sqft" value={listing.sqft.toLocaleString()}/>
              <window.Stat icon={window.Icon.Year} label="built" value={listing.year}/>
            </div>
          </div>

          {/* Guess */}
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            Your <span style={{ color: "var(--accent)", fontWeight: 700 }}>only</span> guess
          </div>
          <div className="display tnum" style={{
            fontSize: 76, lineHeight: 1, color: "var(--ink)",
            letterSpacing: "-0.03em",
          }}>
            ${guess.toLocaleString()}
          </div>

          {/* Slider */}
          <div style={{ marginTop: 18 }}>
            <window.PriceSlider value={guess} onChange={(v) => { setGuess(v); setInteracted(true); }}/>
          </div>

          {/* Soft warning */}
          <div style={{
            marginTop: 24, padding: "12px 14px", borderRadius: 10,
            background: "rgba(200,163,72,0.12)", color: "#7a6020",
            fontSize: 12.5, display: "flex", alignItems: "center", gap: 10,
            boxShadow: "inset 0 0 0 1px rgba(200,163,72,0.3)",
          }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l11 19H1L12 2zm0 5l-7 12h14L12 7zm-1 4h2v4h-2zm0 5h2v2h-2z"/></svg>
            <span>Lock it in carefully — there's no second try until tomorrow.</span>
          </div>

          {/* CTA */}
          <div style={{ marginTop: "auto", paddingTop: 22, display: "flex", gap: 10 }}>
            <button className="btn btn-primary" style={{
              flex: 1, background: "var(--accent)", color: "#fff",
              padding: "22px", fontSize: 17, borderRadius: 14,
              boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 14px 32px -10px rgba(255,92,57,0.6)",
            }}>
              Lock in my final answer
              <window.Icon.Arrow size={18}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.DailyPlay = DailyPlay;
