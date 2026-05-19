/* global React */
// src/daily/entry.jsx — Home page (existing) with the Daily button context

function DailyEntry() {
  const accent = "var(--accent)";
  const hero = "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=2400&q=85";

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "var(--paper)" }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${hero})`,
        backgroundSize: "cover", backgroundPosition: "center",
        filter: "saturate(0.78) brightness(0.92)",
      }}/>
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, rgba(247,244,238,0.6) 0%, rgba(247,244,238,0.15) 28%, rgba(26,26,26,0.35) 65%, rgba(26,26,26,0.7) 100%)",
      }}/>
      <div className="grain" style={{ position: "absolute", inset: 0, opacity: 1 }}/>

      {/* TOP NAV */}
      <header style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 4,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "26px 36px",
      }}>
        <window.Wordmark size={20}/>
        <nav style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="btn btn-ghost" style={{ color: "var(--ink)", fontSize: 14 }}>Daily</button>
          <button className="btn btn-ghost" style={{ color: "var(--ink)", fontSize: 14 }}>Saved</button>
          <button className="btn btn-ghost" style={{ color: "var(--ink)", fontSize: 14 }}>Stats</button>
          <button className="btn btn-secondary" style={{ padding: "10px 18px", fontSize: 13 }}>Sign in</button>
        </nav>
      </header>

      {/* Headline */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 96, zIndex: 3,
        padding: "0 56px 36px", color: "var(--paper)",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 56, alignItems: "end" }}>
          <div>
            <div className="eyebrow" style={{ color: "rgba(247,244,238,0.75)", marginBottom: 18 }}>
              Real homes · Real prices
            </div>
            <h1 className="display" style={{
              margin: 0, fontSize: "clamp(56px, 7vw, 110px)",
              color: "var(--paper)", textShadow: "0 2px 30px rgba(0,0,0,0.25)",
              maxWidth: "12ch",
            }}>
              Guess the<br/>
              <span style={{ color: "var(--accent)", fontStyle: "italic" }}>price.</span>
            </h1>
          </div>

          <div>
            <p style={{
              fontSize: 16, lineHeight: 1.5, margin: "0 0 20px",
              color: "rgba(247,244,238,0.92)", maxWidth: "32ch",
            }}>
              <span className="tnum">1,247</span> homes. One question.
              How close can you get?
            </p>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button className="btn" onClick={() => {}} style={{
                background: "var(--accent)", color: "#fff",
                padding: "20px 28px", fontSize: 16, borderRadius: 16,
                boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 14px 36px -10px rgba(255,92,57,0.55)",
              }}>
                Play <span style={{ opacity: 0.7, fontWeight: 500 }}>—</span> 10 rounds
                <window.Icon.Arrow size={18}/>
              </button>

              {/* DAILY BUTTON — same height as Play, secondary visual weight */}
              <DailyCTA/>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 4,
        background: "rgba(247,244,238,0.94)",
        backdropFilter: "blur(14px) saturate(150%)",
        borderTop: "1px solid var(--rule)",
        padding: "16px 56px", display: "flex", alignItems: "center",
        justifyContent: "space-between", color: "var(--ink)", fontSize: 13,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className="pulse-dot"/>
          <span className="eyebrow">Today's daily · live now</span>
          <span style={{ color: "var(--ink-mute)" }}>
            <span className="tnum">38,402</span> have played today
          </span>
        </div>
        <div style={{ color: "var(--ink-mute)" }}>
          Resets in <window.NextDailyCountdown size={13} color="var(--ink)"/>
        </div>
      </div>
    </div>
  );
}

// Refined Daily button — same footprint as the secondary on Landing,
// just with a quiet gold dot + #142 label and the streak. No bigger than Play.
function DailyCTA() {
  return (
    <button className="btn" style={{
      position: "relative",
      background: "rgba(247,244,238,0.14)",
      color: "var(--paper)",
      padding: "20px 22px", fontSize: 14.5, borderRadius: 16,
      boxShadow: "inset 0 0 0 1.5px rgba(247,244,238,0.5)",
      backdropFilter: "blur(10px)",
      display: "inline-flex", alignItems: "center", gap: 10,
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: "50%",
        background: "linear-gradient(160deg, #FFE89A, #C8A348)",
        boxShadow: "0 0 10px rgba(200,163,72,0.6)",
      }}/>
      Daily
      <span style={{ opacity: 0.6, fontWeight: 500 }}>· #142</span>
      <span style={{
        marginLeft: 6, display: "inline-flex", alignItems: "center", gap: 3,
        color: "var(--accent)", fontSize: 12, fontWeight: 700,
      }}>
        <svg width={10} height={10} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2c1 4 5 5 5 10a5 5 0 1 1-10 0c0-2 1-3 2-4-1 3 1 4 2 4 0-3-1-5 1-10Z"/>
        </svg>
        <span className="tnum">12</span>
      </span>
    </button>
  );
}

window.DailyEntry = DailyEntry;
window.DailyCTA = DailyCTA;
