/* global React */
// src/daily/reveal.jsx — The big game-show reveal

function DailyReveal({ variant = "show" }) {
  if (variant === "quiet") return <DailyRevealQuiet/>;
  return <DailyRevealShow/>;
}

function DailyRevealShow() {
  const listing = window.TODAY.listing;
  const guess = 2_300_000;
  const diff = guess - listing.price;
  const pctOff = Math.abs(diff) / listing.price;
  const accuracy = Math.round((1 - pctOff) * 100);
  const points = accuracy;
  const rank = 412;
  const totalPlayed = 38402;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <div className="stage-bg"/>
      <div className="spotlight-l"/>
      <div className="spotlight-r"/>
      <div className="spotlight"/>
      <div className="grain" style={{ position: "absolute", inset: 0, opacity: 0.3 }}/>

      {/* Top label */}
      <div style={{ position: "absolute", top: 40, left: 0, right: 0, zIndex: 4, textAlign: "center" }}>
        <div className="eyebrow" style={{ color: "var(--spot)", letterSpacing: "0.3em", fontSize: 11 }}>
          THE REVEAL · DAILY #142
        </div>
      </div>

      <div style={{ position: "absolute", inset: 0, zIndex: 5, display: "flex", flexDirection: "column", justifyContent: "center", padding: "100px 56px 36px", color: "var(--paper)" }}>
        {/* Three-column number stack */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 40,
          alignItems: "center", marginBottom: 36,
        }}>
          {/* YOUR GUESS */}
          <div style={{ textAlign: "right" }}>
            <div className="eyebrow" style={{ marginBottom: 12, color: "rgba(247,244,238,0.55)", letterSpacing: "0.22em" }}>YOUR GUESS</div>
            <div className="display tnum" style={{
              fontSize: 80, lineHeight: 1, color: "rgba(247,244,238,0.6)",
              letterSpacing: "-0.025em",
            }}>
              ${guess.toLocaleString()}
            </div>
          </div>

          {/* SOLD stamp — housing-game-show motif replacing the chevron */}
          <div className="sold-stamp" style={{ fontSize: 26, color: "var(--accent)" }}>
            Sold
          </div>

          {/* ACTUAL */}
          <div>
            <div className="eyebrow" style={{ marginBottom: 12, color: "var(--spot)", letterSpacing: "0.22em" }}>ACTUAL PRICE</div>
            <div className="display tnum" style={{
              fontSize: 120, lineHeight: 1, color: "var(--spot)",
              letterSpacing: "-0.03em",
              textShadow: "0 0 60px rgba(255,214,107,0.4)",
            }}>
              ${listing.price.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Reaction line */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            display: "inline-block",
            padding: "6px 14px", borderRadius: 999,
            background: "var(--accent)", color: "#fff",
            fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", marginBottom: 18,
          }}>SO CLOSE</div>
          <h2 className="display" style={{ margin: 0, fontSize: 52, lineHeight: 1, color: "var(--paper)" }}>
            You over-guessed by <span style={{ color: "var(--accent)" }}>$195K.</span>
          </h2>
        </div>

        {/* Metric row */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 1,
          background: "rgba(247,244,238,0.1)",
          borderRadius: 14, overflow: "hidden",
          maxWidth: 980, margin: "0 auto", width: "100%",
        }}>
          {[
            { label: "Accuracy", value: accuracy + "%", tone: "var(--spot)" },
            { label: "Score today", value: "+" + points, tone: "var(--paper)" },
            { label: "World rank", value: "#" + rank.toLocaleString(), sub: "of " + (totalPlayed/1000).toFixed(0) + "K", tone: "var(--paper)" },
            { label: "New streak", value: "13", sub: "day streak 🔥", tone: "var(--accent)" },
          ].map((m, i) => (
            <div key={i} style={{
              background: "rgba(15,17,13,0.7)",
              padding: "22px 18px", textAlign: "center",
            }}>
              <div className="eyebrow" style={{ color: "rgba(247,244,238,0.5)", marginBottom: 10, fontSize: 9.5 }}>{m.label}</div>
              <div className="display tnum" style={{ fontSize: 40, lineHeight: 1, color: m.tone, letterSpacing: "-0.025em" }}>
                {m.value}
              </div>
              {m.sub && <div style={{ color: "rgba(247,244,238,0.5)", fontSize: 11, marginTop: 6 }}>{m.sub}</div>}
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 36 }}>
          <button className="btn btn-primary" style={{
            background: "var(--accent)", padding: "18px 32px", fontSize: 15, borderRadius: 14,
          }}>
            <window.Icon.Share size={16}/> Share my result
          </button>
          <button className="btn" style={{
            background: "rgba(247,244,238,0.08)", color: "var(--paper)",
            padding: "18px 24px", fontSize: 14, borderRadius: 14,
            boxShadow: "inset 0 0 0 1.5px rgba(247,244,238,0.4)",
          }}>
            See full stats
          </button>
          <button className="btn" style={{
            background: "transparent", color: "rgba(247,244,238,0.7)",
            padding: "18px 18px", fontSize: 14, borderRadius: 14,
          }}>
            Practice rounds →
          </button>
        </div>
      </div>
    </div>
  );
}

function DailyRevealQuiet() {
  const listing = window.TODAY.listing;
  const guess = 2_300_000;
  const diff = guess - listing.price;
  const accuracy = 92;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "var(--paper)", overflow: "hidden" }}>
      <div className="grain" style={{ position: "absolute", inset: 0, opacity: 1 }}/>

      <header style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 4, display: "flex", justifyContent: "space-between", padding: "26px 36px" }}>
        <window.Wordmark size={18}/>
        <window.DailyBadge/>
      </header>

      <div style={{ position: "absolute", inset: 0, padding: "100px 80px 60px", display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 60, alignItems: "center" }}>
        {/* Left — reveal */}
        <div>
          <div className="eyebrow" style={{ marginBottom: 16 }}>The reveal</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: "var(--ink-mute)", fontFamily: "var(--mono)" }}>Your guess</span>
            <span className="display tnum" style={{ fontSize: 38, color: "var(--ink-mute)", letterSpacing: "-0.02em" }}>
              ${guess.toLocaleString()}
            </span>
          </div>
          <div style={{ height: 1, background: "var(--rule)", margin: "12px 0 16px" }}/>
          <div className="eyebrow" style={{ color: "var(--accent)", marginBottom: 8 }}>Actual price</div>
          <div className="display tnum" style={{ fontSize: 132, lineHeight: 1, color: "var(--accent)", letterSpacing: "-0.03em" }}>
            $2.49M
          </div>
          <div className="display tnum" style={{ fontSize: 22, color: "var(--ink-mute)", fontStyle: "italic", marginTop: 6 }}>
            ${listing.price.toLocaleString()}
          </div>

          <div style={{ marginTop: 32, padding: 20, background: "var(--cream)", borderRadius: 14, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
            <window.StatBlock label="ACCURACY" value={accuracy + "%"}/>
            <window.StatBlock label="POINTS" value={"+" + accuracy} accent="var(--accent)"/>
            <window.StatBlock label="STREAK" value="13"/>
          </div>
        </div>

        {/* Right — photo */}
        <div>
          <div style={{
            position: "relative", aspectRatio: "4/5", borderRadius: 16, overflow: "hidden",
            backgroundImage: `url(${listing.photos[0]})`, backgroundSize: "cover", backgroundPosition: "center",
            boxShadow: "0 24px 60px -20px rgba(0,0,0,0.25)",
          }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.7) 100%)" }}/>
            <div style={{ position: "absolute", bottom: 18, left: 18, right: 18, color: "var(--paper)" }}>
              <div className="display" style={{ fontSize: 22, fontStyle: "italic", marginBottom: 4 }}>
                {listing.address}
              </div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>{listing.neighborhood} · {listing.city}, {listing.state}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.DailyReveal = DailyReveal;
