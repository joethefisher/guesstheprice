/* global React */
// amazon/summary.jsx — End-of-game summary screen

const { useState: useStateS } = React;

function SummaryScreen({ rounds, onPlayAgain, onDaily, onHome, accent }) {
  const total = rounds.reduce((s, r) => s + r.points, 0);
  const max = rounds.length * 100;
  const avgAcc = Math.round(rounds.reduce((s, r) => s + r.accuracy, 0) / rounds.length);
  const best = rounds.reduce((b, r) => r.points > b.points ? r : b, rounds[0]);
  const worst = rounds.reduce((w, r) => r.points < w.points ? r : w, rounds[0]);
  const tiles = rounds.map(r => window.tileFor(r.pctOff)).join("");
  const dateStr = "June 12, 2026";

  return (
    <div style={{
      position: "relative", width: "100%", height: "100%",
      background: "var(--paper)", overflow: "auto",
    }} className="grain">
      <div style={{ position: "relative", zIndex: 2, padding: "32px 56px 56px", maxWidth: 1320, margin: "0 auto" }}>

        {/* HEADER */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
          <Wordmark size={20}/>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="eyebrow">{dateStr}</span>
            <button className="btn btn-icon" onClick={onHome}><Icon.X size={18}/></button>
          </div>
        </header>

        {/* HERO STATS */}
        <div style={{
          display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 36, alignItems: "end", marginBottom: 48,
        }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Cart complete · {rounds.length} of {rounds.length}</div>
            <h1 className="display" style={{
              margin: 0, fontSize: "clamp(64px, 8.4vw, 124px)", color: "var(--ink)", letterSpacing: "-0.03em",
            }}>
              You scored<br/>
              <span className="tnum" style={{ color: accent }}>{total}</span>
              <span style={{ color: "var(--ink-mute)", fontSize: "0.55em" }}> / {max}</span>
            </h1>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <BigStat label="Average accuracy" value={avgAcc + "%"} note={
              avgAcc >= 80 ? "Genuinely impressive." :
              avgAcc >= 60 ? "Solid run." :
              avgAcc >= 40 ? "Decent vibes." : "There's always tomorrow."
            }/>
            <BigStat label="Best guess" value={best.product.brand} note={
              `+${best.points} on the ${best.product.subcategory.toLowerCase()}`
            }/>
          </div>
        </div>

        <hr className="hairline" style={{ margin: "0 0 36px" }}/>

        {/* PER-ROUND CARDS */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
            <h2 style={{
              fontFamily: "var(--display)", fontStyle: "italic", fontWeight: 500,
              fontSize: 32, margin: 0, letterSpacing: "-0.02em",
            }}>Item by item</h2>
            <span className="eyebrow">click to revisit</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14 }}>
            {rounds.map((r, i) => (
              <RoundCard key={i} idx={i + 1} r={r} accent={accent}
                isBest={r === best} isWorst={r === worst}/>
            ))}
          </div>
        </div>

        {/* SHARE CARD + CTAs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
          <ShareCard rounds={rounds} avgAcc={avgAcc} tiles={tiles} accent={accent} dateStr={dateStr}/>

          <div style={{
            background: "var(--ink)", color: "var(--paper)", borderRadius: 22, padding: "32px 32px 28px",
            display: "flex", flexDirection: "column", gap: 18, position: "relative", overflow: "hidden",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="caption" style={{ color: "rgba(247,244,238,0.5)" }}>NEXT UP</span>
              <Icon.Sparkle size={16}/>
            </div>
            <h3 style={{
              fontFamily: "var(--display)", fontStyle: "italic", fontWeight: 500,
              fontSize: 36, margin: 0, lineHeight: 1.05, letterSpacing: "-0.02em",
            }}>
              Keep the streak<br/>going.
            </h3>
            <p style={{ color: "rgba(247,244,238,0.7)", fontSize: 14.5, margin: 0, lineHeight: 1.5 }}>
              Daily challenge resets at midnight local. 6 hand-picked products,
              same set everyone else is playing.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              <button className="btn" onClick={onDaily} style={{
                background: accent, color: "#fff", padding: "18px 22px", fontSize: 15, borderRadius: 12,
              }}>
                Daily challenge — Jun 12 <Icon.Arrow size={18}/>
              </button>
              <button className="btn" onClick={onPlayAgain} style={{
                background: "rgba(247,244,238,0.1)", color: "var(--paper)",
                padding: "18px 22px", fontSize: 15, borderRadius: 12,
                boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.25)",
              }}>
                Play another 12 <Icon.Arrow size={18}/>
              </button>
            </div>
          </div>
        </div>

        {/* WORST ROUND ZINGER */}
        <div style={{
          marginTop: 36, padding: "26px 28px", background: "var(--cream)",
          borderRadius: 18, display: "flex", gap: 22, alignItems: "center",
        }}>
          <div style={{
            width: 88, height: 88, borderRadius: 12, flexShrink: 0,
            backgroundImage: `url(${worst.product.photos[0]})`,
            backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center",
            backgroundColor: "#fff",
          }}/>
          <div style={{ flex: 1 }}>
            <span className="caption" style={{ color: "var(--flag)", fontSize: 10 }}>WORST GUESS · ITEM {rounds.indexOf(worst) + 1}</span>
            <div style={{
              fontFamily: "var(--display)", fontStyle: "italic", fontSize: 22,
              margin: "6px 0 4px", letterSpacing: "-0.01em",
            }}>
              The {worst.product.subcategory.toLowerCase()} got the better of you.
            </div>
            <div style={{ fontSize: 13.5, color: "var(--ink-mute)" }}>
              You guessed <span className="tnum" style={{ fontWeight: 600 }}>${worst.guess.toLocaleString()}</span>.
              It was <span className="tnum" style={{ fontWeight: 600 }}>${worst.product.price.toLocaleString()}</span>.
              Off by <span className="tnum" style={{ color: "var(--flag)", fontWeight: 600 }}>{Math.round(worst.pctOff * 100)}%</span>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BigStat({ label, value, note }) {
  return (
    <div style={{ padding: "18px 22px", background: "var(--cream)", borderRadius: 16 }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
      <div className="tnum" style={{
        fontFamily: "var(--display)", fontStyle: "italic", fontWeight: 500,
        fontSize: 38, lineHeight: 1, letterSpacing: "-0.02em", marginBottom: 4,
      }}>{value}</div>
      <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>{note}</div>
    </div>
  );
}

function RoundCard({ idx, r, accent, isBest, isWorst }) {
  const tier = window.reactionFor(r.pctOff);
  return (
    <div style={{
      background: "#fff", borderRadius: 14, overflow: "hidden",
      boxShadow: "0 1px 0 var(--rule)", transition: "transform 200ms var(--ease)",
      cursor: "pointer", position: "relative",
    }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
       onMouseLeave={(e) => e.currentTarget.style.transform = "none"}>
      {(isBest || isWorst) && (
        <div style={{
          position: "absolute", top: 8, left: 8, zIndex: 2,
          padding: "3px 8px", borderRadius: 999, fontSize: 9, letterSpacing: "0.12em",
          background: isBest ? "var(--moss)" : "var(--flag)", color: "var(--paper)", fontWeight: 700,
        }}>{isBest ? "BEST" : "WORST"}</div>
      )}
      <div style={{
        height: 86, backgroundImage: `url(${r.product.photos[0]})`, backgroundColor: "#fff",
        backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center",
      }}/>
      <div style={{ padding: "10px 12px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span className="caption tnum" style={{ fontSize: 9, color: "var(--ink-mute)" }}>#{String(idx).padStart(2,"0")}</span>
          <span className="tnum" style={{ fontSize: 11, fontWeight: 600, color: tier.color }}>{Math.round(r.accuracy)}%</span>
        </div>
        <div style={{
          fontFamily: "var(--display)", fontStyle: "italic", fontSize: 13.5, fontWeight: 500,
          letterSpacing: "-0.01em", margin: "0 0 6px", color: "var(--ink)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{r.product.brand}</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-mute)" }} className="tnum">
          <span>{window.fmtShortPrice(r.guess)}</span>
          <span style={{ color: "var(--ink-quiet)" }}>→</span>
          <span style={{ color: "var(--ink)", fontWeight: 600 }}>{window.fmtShortPrice(r.product.price)}</span>
        </div>
      </div>
    </div>
  );
}

function ShareCard({ rounds, avgAcc, tiles, accent, dateStr }) {
  const [copied, setCopied] = useStateS(false);
  function copy() {
    const text = `Pricetag · Amazon · ${dateStr}\n${tiles}\n${avgAcc}% accurate · ${rounds.length} items\nplay.pricetag.app`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }
  return (
    <div style={{
      background: "var(--paper)", borderRadius: 22, padding: "32px",
      boxShadow: "0 1px 0 var(--rule), 0 20px 40px -20px rgba(0,0,0,0.12)",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <span className="caption" style={{ color: "var(--ink-mute)" }}>SHARE CARD</span>
        <Wordmark size={13} edition={false}/>
      </div>
      <div style={{
        background: "var(--cream)", borderRadius: 14, padding: "22px 24px",
        marginBottom: 22, fontFamily: "var(--mono)", fontSize: 13, lineHeight: 1.6,
      }}>
        <div style={{ color: "var(--ink-mute)", marginBottom: 4 }}>Pricetag · Amazon · {dateStr}</div>
        <div style={{ fontSize: 26, letterSpacing: "0.04em", lineHeight: 1.2, marginBottom: 8 }}>{tiles}</div>
        <div className="tnum" style={{ color: "var(--ink)", fontWeight: 600 }}>{avgAcc}% accurate · 5-day streak</div>
        <div style={{ color: "var(--ink-quiet)", fontSize: 11, marginTop: 4 }}>play.pricetag.app</div>
      </div>
      <button className="btn" onClick={copy} style={{
        width: "100%", background: "var(--ink)", color: "var(--paper)",
        padding: "16px", fontSize: 14, borderRadius: 12,
      }}>
        <Icon.Share size={16}/>
        {copied ? "Copied!" : "Copy share text"}
      </button>
    </div>
  );
}

window.SummaryScreen = SummaryScreen;
