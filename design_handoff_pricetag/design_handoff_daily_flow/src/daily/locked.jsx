/* global React */
// src/daily/locked.jsx — "You've already played today" state (dark stage)

function DailyLocked() {
  const listing = window.TODAY.listing;
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", color: "var(--paper)" }}>
      <div className="stage-bg-soft"/>
      <div className="spotlight-l"/>
      <div className="spotlight-r"/>
      <div className="grain" style={{ position: "absolute", inset: 0, opacity: 0.3 }}/>

      <header style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 4, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "26px 36px" }}>
        <div style={{ filter: "invert(1) hue-rotate(180deg)" }}><window.Wordmark size={18}/></div>
        <button className="btn btn-icon" style={{ background: "rgba(247,244,238,0.08)", color: "var(--paper)", boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.2)" }}>
          <window.Icon.X size={16}/>
        </button>
      </header>

      <div style={{ position: "absolute", inset: 0, padding: "100px 80px 60px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 70, alignItems: "center", zIndex: 3 }}>

        {/* LEFT — message */}
        <div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 22,
            padding: "6px 12px", borderRadius: 999,
            background: "rgba(46,111,74,0.22)", color: "var(--emerald)",
            boxShadow: "inset 0 0 0 1px rgba(46,111,74,0.4)",
            fontSize: 12, fontWeight: 700, letterSpacing: "0.08em",
          }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4 10-10"/></svg>
            DONE FOR TODAY
          </div>
          <h1 className="display" style={{ margin: 0, fontSize: 88, lineHeight: 0.95, letterSpacing: "-0.03em", color: "var(--paper)" }}>
            See you<br/>
            <span style={{ color: "var(--spot)", fontStyle: "italic" }}>tomorrow.</span>
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.55, color: "rgba(247,244,238,0.7)", maxWidth: "40ch", margin: "22px 0 28px" }}>
            You played today's house. The next one drops at midnight Eastern — same time as the rest of the world.
          </p>

          {/* Big countdown */}
          <div style={{
            padding: "22px 24px", borderRadius: 16,
            background: "rgba(247,244,238,0.06)", color: "var(--paper)",
            boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.15)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div className="eyebrow" style={{ color: "rgba(247,244,238,0.55)", marginBottom: 6 }}>NEXT HOUSE IN</div>
              <window.NextDailyCountdown size={40} color="var(--spot)"/>
            </div>
            <button className="btn" style={{
              background: "rgba(247,244,238,0.1)", color: "var(--paper)",
              padding: "12px 16px", fontSize: 12, borderRadius: 10,
              boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.25)",
            }}>
              Notify me
            </button>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 22 }}>
            <button className="btn btn-primary" style={{
              background: "var(--accent)", color: "#fff",
              padding: "16px 22px", fontSize: 14, borderRadius: 12,
            }}>
              Play practice rounds
            </button>
            <button className="btn" style={{
              padding: "16px 22px", fontSize: 14, borderRadius: 12,
              background: "rgba(247,244,238,0.08)", color: "var(--paper)",
              boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.2)",
            }}>
              See your stats
            </button>
          </div>
        </div>

        {/* RIGHT — today's locked card */}
        <div>
          <div className="eyebrow" style={{ marginBottom: 14, color: "rgba(247,244,238,0.55)" }}>Today's result · #{window.TODAY.number}</div>
          <div style={{
            position: "relative", aspectRatio: "4/3", borderRadius: 16, overflow: "hidden",
            backgroundImage: `url(${listing.photos[0]})`, backgroundSize: "cover", backgroundPosition: "center",
            boxShadow: "0 24px 60px -20px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(247,244,238,0.1)",
            marginBottom: 16,
          }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.75) 100%)" }}/>
            <div style={{
              position: "absolute", top: 18, right: 18,
              padding: "6px 12px", borderRadius: 999,
              background: "var(--paper)", color: "var(--ink)",
              fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
              PLAYED
            </div>
            <div style={{ position: "absolute", bottom: 18, left: 20, right: 20, color: "var(--paper)" }}>
              <div className="display" style={{ fontSize: 24, fontStyle: "italic", marginBottom: 4 }}>{listing.address}</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>{listing.city}, {listing.state}</div>
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { l: "YOUR GUESS", v: "$2.3M" },
              { l: "ACTUAL", v: "$2.49M", accent: true },
              { l: "ACCURACY", v: "92%" },
            ].map((s, i) => (
              <div key={i} style={{
                padding: 14, borderRadius: 12,
                background: "rgba(247,244,238,0.06)",
                boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.1)",
              }}>
                <div className="eyebrow" style={{ fontSize: 9, marginBottom: 4, color: "rgba(247,244,238,0.55)" }}>{s.l}</div>
                <div className="display tnum" style={{ fontSize: 22, fontStyle: "italic", color: s.accent ? "var(--spot)" : "var(--paper)" }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.DailyLocked = DailyLocked;
