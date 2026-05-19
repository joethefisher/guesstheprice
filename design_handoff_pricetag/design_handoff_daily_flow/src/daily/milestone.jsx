/* global React */
// src/daily/milestone.jsx — Streak celebration moment

function DailyMilestone() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <div className="stage-bg"/>
      <div className="spotlight"/>
      <div className="grain" style={{ position: "absolute", inset: 0, opacity: 0.35 }}/>

      {/* Bulbs */}
      <div style={{ position: "absolute", top: 24, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 4 }}>
        <div className="bulbs">{Array.from({ length: 26 }).map((_, i) => <span key={i}/>)}</div>
      </div>

      {/* Confetti */}
      <window.Confetti fire={true} count={120}/>

      <div style={{ position: "absolute", inset: 0, zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 80px", textAlign: "center", color: "var(--paper)" }}>

        {/* Medal */}
        <div style={{ position: "relative", marginBottom: 28 }}>
          <div className="medal-shine" style={{
            width: 168, height: 168, borderRadius: "50%",
            display: "grid", placeItems: "center",
            position: "relative",
          }}>
            <div style={{
              width: 134, height: 134, borderRadius: "50%",
              background: "linear-gradient(160deg, #C8A348 0%, #8C7022 100%)",
              boxShadow: "inset 0 -8px 18px rgba(0,0,0,0.3), inset 0 6px 14px rgba(255,255,255,0.4)",
              display: "grid", placeItems: "center",
              color: "#2a1d05",
            }}>
              <div className="display tnum" style={{ fontSize: 78, lineHeight: 1, fontWeight: 600, letterSpacing: "-0.04em" }}>30</div>
            </div>
            {/* Bulb halo around the medal */}
            <div style={{ position: "absolute", bottom: -26, left: "50%", transform: "translateX(-50%)" }}>
              <div className="bulbs">
                {Array.from({ length: 7 }).map((_, i) => <span key={i}/>)}
              </div>
            </div>
          </div>
        </div>

        <div className="eyebrow" style={{ color: "var(--spot)", letterSpacing: "0.3em", marginBottom: 14 }}>
          MILESTONE UNLOCKED
        </div>

        <h1 className="display" style={{ margin: 0, fontSize: 96, lineHeight: 0.95, letterSpacing: "-0.03em", maxWidth: "14ch" }}>
          Thirty days,<br/>
          <span style={{ color: "var(--spot)" }}>thirty houses.</span>
        </h1>

        <p style={{ fontSize: 17, lineHeight: 1.55, color: "rgba(247,244,238,0.75)", maxWidth: "44ch", margin: "24px 0 28px" }}>
          You've played every day for a month straight. Only <b style={{ color: "var(--paper)" }} className="tnum">4.2%</b> of players make it this far.
        </p>

        {/* Stat strip */}
        <div style={{
          display: "flex", gap: 0, marginBottom: 32,
          background: "rgba(247,244,238,0.06)", borderRadius: 999, overflow: "hidden",
          boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.12)",
        }}>
          {[
            { l: "BEST GUESS", v: "99%", s: "Apr 17" },
            { l: "AVG ACCURACY", v: "78%" },
            { l: "TOTAL POINTS", v: "2,341" },
            { l: "DAYS LEFT TIL #50", v: "20" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "16px 28px", borderRight: i < 3 ? "1px solid rgba(247,244,238,0.12)" : "none" }}>
              <div className="eyebrow" style={{ color: "rgba(247,244,238,0.55)", fontSize: 9, marginBottom: 4 }}>{s.l}</div>
              <div className="tnum" style={{ fontFamily: "var(--display)", fontStyle: "italic", fontSize: 22, color: "var(--paper)" }}>{s.v}</div>
              {s.s && <div style={{ fontSize: 10, color: "rgba(247,244,238,0.5)" }}>{s.s}</div>}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-primary" style={{
            background: "var(--accent)", padding: "18px 28px", fontSize: 15, borderRadius: 14,
          }}>
            Share the streak →
          </button>
          <button className="btn" style={{
            background: "rgba(247,244,238,0.08)", color: "var(--paper)",
            padding: "18px 22px", fontSize: 14, borderRadius: 14,
            boxShadow: "inset 0 0 0 1.5px rgba(247,244,238,0.4)",
          }}>
            Keep going
          </button>
        </div>
      </div>
    </div>
  );
}

window.DailyMilestone = DailyMilestone;
