/* global React */
// src/landing.jsx — Landing screen

const { useState: useStateL, useEffect: useEffectL } = React;

function Landing({ onPlay, onDaily, accent = "#FF5C39" }) {
  const hero = "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=2400&q=85";
  const avgScore = 73;
  const todayHomes = 1247;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "var(--paper)" }}>
      {/* HERO PHOTO */}
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
        <Wordmark size={20}/>
        <nav style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="btn btn-ghost" style={{ color: "var(--ink)", fontSize: 14 }}>Daily</button>
          <button className="btn btn-ghost" style={{ color: "var(--ink)", fontSize: 14 }}>Saved</button>
          <button className="btn btn-ghost" style={{ color: "var(--ink)", fontSize: 14 }}>Stats</button>
          <button className="btn btn-secondary" style={{ padding: "10px 18px", fontSize: 13 }}>Sign in</button>
        </nav>
      </header>

      {/* MAIN COMPOSITION (headline + CTAs) — clears bottom strip */}
      <div style={{
        position: "absolute", left: 0, right: 0, top: 0, bottom: 96, zIndex: 3,
        display: "flex", alignItems: "flex-end",
        padding: "0 56px 36px", color: "var(--paper)",
      }}>
        <div style={{
          width: "100%",
          display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 56, alignItems: "end",
        }}>
          <div>
            <div className="eyebrow" style={{ color: "rgba(247,244,238,0.75)", marginBottom: 18 }}>
              Real homes · Real prices
            </div>
            <h1 className="display" style={{
              margin: 0, fontSize: "clamp(64px, 8.4vw, 132px)",
              color: "var(--paper)", textShadow: "0 2px 30px rgba(0,0,0,0.25)",
              maxWidth: "12ch",
            }}>
              Guess the<br/>
              <span style={{ color: accent, fontStyle: "italic" }}>price.</span>
            </h1>
          </div>

          <div>
            <p style={{
              fontSize: 17, lineHeight: 1.5, margin: "0 0 24px",
              color: "rgba(247,244,238,0.92)", maxWidth: "32ch",
            }}>
              <span className="tnum">{todayHomes.toLocaleString()}</span> homes. One question.
              How close can you get?
            </p>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button className="btn" onClick={onPlay} style={{
                background: accent, color: "#fff",
                padding: "20px 28px", fontSize: 16, borderRadius: 16,
                boxShadow: `0 1px 0 rgba(255,255,255,0.25) inset, 0 14px 36px -10px ${accent}88`,
              }}>
                Play <span style={{ opacity: 0.7, fontWeight: 500 }}>—</span> 10 rounds
                <Icon.Arrow size={18}/>
              </button>
              <button className="btn" onClick={onDaily} style={{
                background: "rgba(247,244,238,0.14)",
                color: "var(--paper)", padding: "20px 22px", fontSize: 14.5,
                boxShadow: "inset 0 0 0 1.5px rgba(247,244,238,0.5)", borderRadius: 16,
                backdropFilter: "blur(10px)",
              }}>
                Daily <span style={{ opacity: 0.6 }}>· May 9</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM STRIP — proper horizontal bar */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 4,
        background: "rgba(247,244,238,0.94)",
        backdropFilter: "blur(14px) saturate(150%)",
        borderTop: "1px solid var(--rule)",
        padding: "16px 56px",
        display: "grid", gridTemplateColumns: "1.6fr auto 1.2fr auto 1fr", gap: 28,
        alignItems: "center", color: "var(--ink)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Today, around the world</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span className="display tnum" style={{ fontSize: 36, lineHeight: 1, color: "var(--ink)" }}>
                {avgScore}<span style={{ fontSize: 18, color: "var(--ink-mute)" }}>%</span>
              </span>
              <span style={{ fontSize: 12.5, color: "var(--ink-mute)" }}>
                avg accuracy · <span className="tnum">38,402</span> plays
              </span>
            </div>
          </div>
          {/* sparkline */}
          <svg viewBox="0 0 220 36" width="220" height="36" preserveAspectRatio="none">
            <path d="M0 22 L20 18 L40 26 L60 14 L80 20 L100 10 L120 18 L140 8 L160 16 L180 6 L200 12 L220 14" stroke={accent} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M0 22 L20 18 L40 26 L60 14 L80 20 L100 10 L120 18 L140 8 L160 16 L180 6 L200 12 L220 14 L220 36 L0 36 Z" fill={accent} opacity="0.1"/>
          </svg>
        </div>

        <div style={{ width: 1, height: 36, background: "var(--rule)" }}/>

        <div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Top scorer · today</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: "var(--display)", fontStyle: "italic", fontSize: 22, lineHeight: 1, fontWeight: 500 }}>
              @margaux_b
            </span>
            <span className="tnum" style={{ fontSize: 13, color: "var(--ink-mute)" }}>· 947 / 1000</span>
          </div>
        </div>

        <div style={{ width: 1, height: 36, background: "var(--rule)" }}/>

        <div style={{ textAlign: "right" }}>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Now showing</div>
          <div style={{ fontSize: 13, color: "var(--ink)" }}>
            Carbon Beach · Malibu, CA <span style={{ color: "var(--ink-mute)" }}>· $18.75M</span>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Landing = Landing;
