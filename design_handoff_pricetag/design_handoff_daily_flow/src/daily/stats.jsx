/* global React */
// src/daily/stats.jsx — Stats + calendar tracking (dark stage theme)

function DailyStats() {
  const history = window.PLAYER.history;

  const cellColor = (v) => {
    if (v == null) return "rgba(247,244,238,0.06)";
    if (v >= 90) return "var(--emerald)";
    if (v >= 80) return "var(--moss)";
    if (v >= 70) return "var(--accent)";
    if (v >= 60) return "var(--gold)";
    return "rgba(247,244,238,0.15)";
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", color: "var(--paper)" }}>
      <div className="stage-bg-soft"/>
      <div className="spotlight-l"/>
      <div className="spotlight-r"/>
      <div className="grain" style={{ position: "absolute", inset: 0, opacity: 0.3 }}/>

      <header style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 4, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "26px 36px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ filter: "invert(1) hue-rotate(180deg)" }}><window.Wordmark size={18}/></div>
          <div style={{ width: 1, height: 18, background: "rgba(247,244,238,0.2)" }}/>
          <window.DailyBadge/>
        </div>
        <button className="btn btn-icon" style={{ background: "rgba(247,244,238,0.08)", color: "var(--paper)", boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.2)" }}>
          <window.Icon.X size={16}/>
        </button>
      </header>

      <div style={{ position: "absolute", top: 92, left: 56, right: 56, bottom: 24, display: "grid", gridTemplateColumns: "1.1fr 1.4fr", gap: 48, zIndex: 3 }}>

        {/* LEFT — stats hero */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div className="eyebrow" style={{ marginBottom: 16, color: "rgba(247,244,238,0.55)" }}>Your daily statistics</div>

          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24,
            paddingBottom: 28, borderBottom: "1px solid rgba(247,244,238,0.1)", marginBottom: 28,
          }}>
            <div>
              <div className="display tnum" style={{ fontSize: 84, lineHeight: 1, color: "var(--accent)", letterSpacing: "-0.03em" }}>12</div>
              <div className="eyebrow" style={{ marginTop: 6, color: "rgba(247,244,238,0.55)" }}>CURRENT STREAK 🔥</div>
            </div>
            <div>
              <div className="display tnum" style={{ fontSize: 84, lineHeight: 1, color: "var(--spot)", letterSpacing: "-0.03em" }}>28</div>
              <div className="eyebrow" style={{ marginTop: 6, color: "rgba(247,244,238,0.55)" }}>BEST STREAK</div>
            </div>
            <div>
              <div className="display tnum" style={{ fontSize: 56, lineHeight: 1, color: "var(--paper)", letterSpacing: "-0.025em" }}>47</div>
              <div className="eyebrow" style={{ marginTop: 6, color: "rgba(247,244,238,0.55)" }}>PLAYED</div>
            </div>
            <div>
              <div className="display tnum" style={{ fontSize: 56, lineHeight: 1, color: "var(--paper)", letterSpacing: "-0.025em" }}>
                78<span style={{ fontSize: 28, color: "rgba(247,244,238,0.5)" }}>%</span>
              </div>
              <div className="eyebrow" style={{ marginTop: 6, color: "rgba(247,244,238,0.55)" }}>AVG ACCURACY</div>
            </div>
          </div>

          <div>
            <div className="eyebrow" style={{ marginBottom: 12, color: "rgba(247,244,238,0.55)" }}>Accuracy distribution · last 47</div>
            <DistributionDark/>
          </div>

          <div style={{
            marginTop: "auto", padding: 18, borderRadius: 14,
            background: "rgba(247,244,238,0.06)",
            boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.1)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4, color: "rgba(247,244,238,0.55)" }}>NEXT DAILY</div>
              <window.NextDailyCountdown size={26} color="var(--spot)"/>
            </div>
            <div style={{ fontSize: 11, color: "rgba(247,244,238,0.55)", textAlign: "right", maxWidth: 160 }}>
              Resets at midnight Eastern.<br/>Miss it and your streak goes to zero.
            </div>
          </div>
        </div>

        {/* RIGHT — calendar */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4, color: "rgba(247,244,238,0.55)" }}>Five-week heatmap</div>
              <div className="display" style={{ fontSize: 28, fontStyle: "italic", color: "var(--paper)" }}>
                April 5 — May 10
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button className="btn btn-icon" style={{ width: 32, height: 32, background: "rgba(247,244,238,0.08)", color: "var(--paper)", boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.15)" }}><window.Icon.Arrow dir="left" size={14}/></button>
              <button className="btn btn-icon" style={{ width: 32, height: 32, background: "rgba(247,244,238,0.08)", color: "var(--paper)", boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.15)" }}><window.Icon.Arrow size={14}/></button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 8 }}>
            {["S","M","T","W","T","F","S"].map((d, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: 10, color: "rgba(247,244,238,0.4)", fontFamily: "var(--mono)", fontWeight: 700, letterSpacing: "0.1em" }}>{d}</div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 18 }}>
            {history.map((v, i) => {
              const dayNum = 5 + i;
              const isToday = i === history.length - 1;
              return (
                <div key={i} className="heatcell" style={{
                  background: cellColor(v),
                  color: v == null ? "rgba(247,244,238,0.3)" : v >= 70 ? "var(--paper)" : "rgba(247,244,238,0.7)",
                  position: "relative",
                  boxShadow: isToday ? "0 0 0 2px var(--spot)" : "none",
                }}>
                  <div style={{ fontSize: 9, opacity: 0.6, position: "absolute", top: 4, left: 5 }}>{dayNum}</div>
                  <div className="tnum" style={{ fontSize: 13, fontWeight: 700 }}>
                    {v == null ? "·" : v}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: "rgba(247,244,238,0.55)", marginBottom: 22 }}>
            <span>Missed</span>
            <div style={{ display: "flex", gap: 3 }}>
              {[null, 55, 65, 75, 85, 95].map((v, i) => (
                <div key={i} style={{ width: 16, height: 16, borderRadius: 3, background: cellColor(v) }}/>
              ))}
            </div>
            <span>Better →</span>
            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, boxShadow: "0 0 0 2px var(--spot)" }}/> Today
            </span>
          </div>

          <div style={{
            padding: 18, borderRadius: 14,
            background: "rgba(247,244,238,0.06)",
            boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.1)",
            marginBottom: 14,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div className="eyebrow" style={{ color: "rgba(247,244,238,0.55)" }}>Accuracy trend</div>
              <div style={{ fontSize: 11, color: "rgba(247,244,238,0.6)" }}>
                <span style={{ color: "var(--emerald)", fontWeight: 700 }}>↑ 6%</span> vs. last month
              </div>
            </div>
            <svg viewBox="0 0 400 80" width="100%" height="64">
              <defs>
                <linearGradient id="trendGD" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35"/>
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
                </linearGradient>
              </defs>
              {(() => {
                const pts = history.map((v, i) => ({ x: (i / (history.length - 1)) * 400, y: 80 - ((v ?? 50) / 100) * 70 }));
                const d = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
                return <>
                  <path d={`${d} L400,80 L0,80 Z`} fill="url(#trendGD)"/>
                  <path d={d} stroke="var(--spot)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </>;
              })()}
            </svg>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ padding: 14, borderRadius: 12, background: "rgba(247,244,238,0.06)", boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.1)" }}>
              <div className="eyebrow" style={{ fontSize: 9, color: "rgba(247,244,238,0.55)" }}>HARDEST DAY</div>
              <div style={{ fontFamily: "var(--display)", fontStyle: "italic", fontSize: 18, color: "var(--paper)", marginTop: 4 }}>Apr 13</div>
              <div style={{ fontSize: 11, color: "rgba(247,244,238,0.55)" }}>Detroit duplex · <span className="tnum">62%</span></div>
            </div>
            <div style={{ padding: 14, borderRadius: 12, background: "rgba(247,244,238,0.06)", boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.1)" }}>
              <div className="eyebrow" style={{ fontSize: 9, color: "rgba(247,244,238,0.55)" }}>BEST DAY</div>
              <div style={{ fontFamily: "var(--display)", fontStyle: "italic", fontSize: 18, color: "var(--paper)", marginTop: 4 }}>May 1</div>
              <div style={{ fontSize: 11, color: "rgba(247,244,238,0.55)" }}>Brooklyn brownstone · <span className="tnum">95%</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dark-themed distribution
function DistributionDark() {
  const max = Math.max(...window.PLAYER.distribution.map(d => d.count));
  return (
    <div style={{ display: "grid", gap: 4 }}>
      {window.PLAYER.distribution.map(d => {
        const isMe = d.bucket === "70";
        const w = `${Math.max(8, (d.count / max) * 100)}%`;
        return (
          <div key={d.bucket} className="dist-row">
            <span style={{ color: "rgba(247,244,238,0.55)", textAlign: "right" }}>{d.bucket}</span>
            <div style={{ position: "relative", height: "100%", background: "rgba(247,244,238,0.08)", borderRadius: 3 }}>
              <div className="dist-bar" style={{
                width: w, background: isMe ? "var(--accent)" : "rgba(247,244,238,0.5)",
                color: isMe ? "var(--paper)" : "var(--ink)",
                boxShadow: isMe ? "0 2px 12px -4px var(--accent)" : "none",
              }}>{d.count}</div>
            </div>
            <span style={{ color: isMe ? "var(--accent)" : "rgba(247,244,238,0.4)", textAlign: "right" }}>
              {isMe ? "← you" : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

window.DailyStats = DailyStats;
