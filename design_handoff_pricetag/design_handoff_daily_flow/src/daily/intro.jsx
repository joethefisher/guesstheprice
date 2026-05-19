/* global React */
// src/daily/intro.jsx — Daily intro / onboard screen
// Game-show energy: curtains, bulbs, spotlight. Two variants.

function DailyIntro({ variant = "stage" }) {
  if (variant === "letter") return <DailyIntroLetter/>;
  return <DailyIntroStage/>;
}

// Variant A — stage / game-show
function DailyIntroStage() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <div className="stage-bg"/>
      <div className="spotlight-l"/>
      <div className="spotlight-r"/>
      <div className="spotlight"/>
      <div className="grain" style={{ position: "absolute", inset: 0, opacity: 0.35 }}/>

      {/* Top chrome */}
      <header style={{
        position: "absolute", top: 26, left: 36, right: 36, zIndex: 4,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        color: "var(--paper)",
      }}>
        <window.Wordmark size={18}/>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(247,244,238,0.7)" }}>
            <span className="pulse-dot"/> 38,402 playing now
          </span>
          <button className="btn btn-icon" style={{ background: "rgba(247,244,238,0.08)", color: "var(--paper)", boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.2)" }}>
            <window.Icon.X size={16}/>
          </button>
        </div>
      </header>

      {/* Center stage */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 5,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "0 60px", textAlign: "center",
      }}>
        {/* Open-house style plaque + bulb row inline */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 26, gap: 16 }}>
          <div className="plaque" style={{ fontSize: 14 }}>
            <span style={{ fontStyle: "normal", fontFamily: "var(--body)", fontSize: 10, letterSpacing: "0.22em", fontWeight: 700 }}>
              NOW OPEN
            </span>
          </div>
          <div className="bulbs">
            {Array.from({ length: 14 }).map((_, i) => <span key={i}/>)}
          </div>
        </div>

        <div className="eyebrow" style={{ color: "rgba(255,214,107,0.85)", marginBottom: 14, letterSpacing: "0.22em" }}>
          DAILY #142 · {window.TODAY.date.toUpperCase()}
        </div>

        <h1 className="display" style={{
          margin: 0, fontSize: 120, color: "var(--paper)", lineHeight: 0.95,
          maxWidth: "16ch", letterSpacing: "-0.03em",
          textShadow: "0 4px 40px rgba(255,214,107,0.25)",
        }}>
          One house.<br/>
          <span style={{ color: "var(--spot)" }}>One guess.</span>
        </h1>

        <p style={{
          fontSize: 17, lineHeight: 1.5, color: "rgba(247,244,238,0.7)",
          maxWidth: "44ch", margin: "28px 0 36px",
        }}>
          Everyone gets the same house today. No do-overs.
          See how close you land and where you rank.
        </p>

        <button className="btn" style={{
          background: "var(--accent)", color: "#fff",
          padding: "24px 40px", fontSize: 18, borderRadius: 16,
          boxShadow: "0 1px 0 rgba(255,255,255,0.3) inset, 0 20px 50px -10px rgba(255,92,57,0.6)",
          display: "inline-flex", alignItems: "center", gap: 12,
        }}>
          Open today's listing
          <window.Icon.Arrow size={20}/>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 38, color: "rgba(247,244,238,0.7)", fontSize: 13 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <window.Icon.Flame size={14}/>
            <span style={{ color: "var(--paper)", fontWeight: 700 }} className="tnum">12</span>
            <span>day streak</span>
          </span>
          <span style={{ width: 1, height: 14, background: "rgba(247,244,238,0.2)" }}/>
          <span>Next house resets in <span style={{ color: "var(--paper)", fontFamily: "var(--mono)", fontWeight: 700 }}>06:42</span></span>
        </div>
      </div>

      {/* Footer: avg accuracy ticker, like the marquee at the bottom */}
      <div style={{
        position: "absolute", bottom: 24, left: 36, right: 36, zIndex: 4,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 22px", borderRadius: 12,
        background: "rgba(247,244,238,0.06)", backdropFilter: "blur(12px)",
        color: "rgba(247,244,238,0.75)", fontSize: 12,
        boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.08)",
      }}>
        <span>Today's average: <span style={{ color: "var(--spot)", fontWeight: 700 }} className="tnum">71%</span></span>
        <span>Hardest day this month: <span style={{ color: "var(--paper)", fontWeight: 700 }}>Apr 28</span></span>
        <span>Top scorer: <span style={{ color: "var(--paper)", fontFamily: "var(--display)", fontStyle: "italic" }}>@margaux_b</span> · <span className="tnum">99%</span></span>
      </div>
    </div>
  );
}

// Variant B — quieter "letter" style
function DailyIntroLetter() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "var(--paper)" }}>
      <div className="grain" style={{ position: "absolute", inset: 0, opacity: 1 }}/>

      <header style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 4,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "26px 36px",
      }}>
        <window.Wordmark size={18}/>
        <button className="btn btn-icon"><window.Icon.X size={16}/></button>
      </header>

      <div style={{
        position: "absolute", inset: 0, zIndex: 2, padding: "0 80px",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center",
      }}>
        {/* LEFT: envelope */}
        <div>
          <div className="ribbon" style={{ display: "inline-block", fontSize: 14, marginBottom: 28 }}>
            Daily · No. 142
          </div>
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            {window.TODAY.date}
          </div>
          <h1 className="display" style={{
            margin: 0, fontSize: 88, lineHeight: 0.95, letterSpacing: "-0.03em",
            color: "var(--ink)",
          }}>
            Today's<br/>
            <span style={{ color: "var(--accent)" }}>house.</span>
          </h1>
          <p style={{
            fontSize: 16, lineHeight: 1.6, color: "var(--ink-mute)",
            maxWidth: "40ch", margin: "24px 0 32px",
          }}>
            One real listing. One guess. Same house for everyone, everywhere.
            See the photos, name your price, then meet the world.
          </p>
          <button className="btn btn-primary" style={{
            background: "var(--accent)", color: "#fff",
            padding: "20px 28px", fontSize: 16, borderRadius: 14,
          }}>
            Open the listing →
          </button>
          <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 18, color: "var(--ink-mute)", fontSize: 13 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <window.Icon.Flame size={14}/>
              <b style={{ color: "var(--accent)" }} className="tnum">12</b> day streak
            </span>
            <span>·</span>
            <span>Resets <span className="tnum">06:42</span></span>
          </div>
        </div>

        {/* RIGHT: wax-sealed envelope */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{
            position: "relative", width: 380, height: 280,
            background: "var(--cream)",
            boxShadow: "0 20px 50px -16px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(26,26,26,0.06)",
            borderRadius: 4, transform: "rotate(-2deg)",
          }}>
            <div style={{
              position: "absolute", inset: 0, padding: 28,
              display: "flex", flexDirection: "column", justifyContent: "space-between",
            }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-quiet)", letterSpacing: "0.1em" }}>
                FROM PRICETAG H.Q.<br/>NEW YORK
              </div>
              <div>
                <div className="display" style={{ fontSize: 28, color: "var(--ink)" }}>Player {`#7,128,402`.replace(/,/g, ",")}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-mute)", marginTop: 6 }}>
                  PRESENT THIS CARD FOR ENTRY · {window.TODAY.shortDate.toUpperCase()}
                </div>
              </div>
            </div>
            {/* wax seal */}
            <div style={{
              position: "absolute", right: -22, top: "50%", transform: "translateY(-50%)",
              width: 64, height: 64, borderRadius: "50%",
              background: "radial-gradient(circle at 30% 30%, #c64a3a, #8b2a2a 70%)",
              boxShadow: "0 6px 14px rgba(0,0,0,0.25), inset 0 -3px 0 rgba(0,0,0,0.25)",
              display: "grid", placeItems: "center", color: "#fff",
              fontFamily: "var(--display)", fontStyle: "italic", fontSize: 26,
            }}>P</div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.DailyIntro = DailyIntro;
