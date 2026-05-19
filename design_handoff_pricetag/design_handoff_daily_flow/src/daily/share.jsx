/* global React */
// src/daily/share.jsx — Share card modal

function DailyShare() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "rgba(26,26,26,0.62)", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backdropFilter: "blur(20px)" }}/>

      {/* Background hint of reveal */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${window.TODAY.listing.photos[0]})`,
        backgroundSize: "cover", backgroundPosition: "center",
        opacity: 0.18, filter: "blur(12px)",
      }}/>

      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{
          width: 540, background: "var(--paper)", borderRadius: 22,
          padding: "30px 30px 26px",
          boxShadow: "0 40px 80px -20px rgba(0,0,0,0.55)",
          position: "relative",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>Share your daily</div>
              <div style={{ fontFamily: "var(--display)", fontStyle: "italic", fontSize: 22 }}>
                Pricetag #{window.TODAY.number}
              </div>
            </div>
            <button className="btn btn-icon"><window.Icon.X size={16}/></button>
          </div>

          {/* The card itself */}
          <div style={{
            padding: "26px 26px",
            background: "linear-gradient(140deg, #15110d 0%, #1a1a1a 100%)",
            borderRadius: 16, color: "var(--paper)",
            position: "relative", overflow: "hidden",
            boxShadow: "inset 0 0 0 1px rgba(255,214,107,0.18)",
          }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,214,107,0.25), transparent 60%)" }}/>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, position: "relative" }}>
              <window.Wordmark size={15}/>
              <div className="caption" style={{ color: "var(--spot)", fontSize: 10, letterSpacing: "0.18em" }}>
                DAILY · #{window.TODAY.number}
              </div>
            </div>

            <div className="display" style={{ fontSize: 38, lineHeight: 1, marginBottom: 6 }}>
              I guessed <span style={{ color: "var(--spot)" }}>92%</span> right.
            </div>
            <div style={{ fontSize: 13, color: "rgba(247,244,238,0.65)", marginBottom: 20 }}>
              {window.TODAY.date} · ranked <b style={{ color: "var(--paper)" }} className="tnum">#412</b> of 38K
            </div>

            {/* Bars representing guess vs actual */}
            <div style={{ display: "grid", gap: 8, marginBottom: 18 }}>
              <ShareBar label="MY GUESS" w="72%" v="$2.30M" color="rgba(247,244,238,0.18)"/>
              <ShareBar label="ACTUAL" w="78%" v="$2.49M" color="var(--accent)"/>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "rgba(247,244,238,0.55)", paddingTop: 14, borderTop: "1px solid rgba(247,244,238,0.12)" }}>
              <span>🔥 13-day streak</span>
              <span style={{ fontFamily: "var(--mono)" }}>guesstheprice.ai/d/142</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 18 }}>
            <button className="btn" style={{ background: "var(--ink)", color: "var(--paper)", padding: "14px 12px", fontSize: 13, borderRadius: 11 }}>
              Copy text
            </button>
            <button className="btn btn-secondary" style={{ padding: "14px 12px", fontSize: 13, borderRadius: 11 }}>
              Save image
            </button>
            <button className="btn btn-secondary" style={{ padding: "14px 12px", fontSize: 13, borderRadius: 11 }}>
              Share link
            </button>
          </div>

          {/* Text preview */}
          <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: "var(--cream)", fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--ink-mute)", lineHeight: 1.6 }}>
            Pricetag #142 — 92%<br/>
            🟧🟧🟧🟧🟧🟧🟧⬜⬜⬜ guess $2.30M<br/>
            🟩🟩🟩🟩🟩🟩🟩🟩⬛⬛ actual $2.49M<br/>
            🔥13 · guesstheprice.ai
          </div>
        </div>
      </div>
    </div>
  );
}

function ShareBar({ label, w, v, color }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(247,244,238,0.6)", marginBottom: 4 }}>
        <span>{label}</span>
        <span className="tnum" style={{ color: "var(--paper)" }}>{v}</span>
      </div>
      <div style={{ height: 16, background: "rgba(247,244,238,0.08)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: w, height: "100%", background: color, borderRadius: 4 }}/>
      </div>
    </div>
  );
}

window.DailyShare = DailyShare;
