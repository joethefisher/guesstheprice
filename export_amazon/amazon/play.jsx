/* global React */
// amazon/play.jsx — Guess round (browse product) + Reveal overlay

const { useState: useStateP, useEffect: useEffectP, useRef: useRefP, useMemo: useMemoP } = React;

function PlayScreen({
  product, roundNum, totalRounds, streak,
  onSubmit, onExit, accent, hardMode,
}) {
  const [guess, setGuess] = useStateP(120);
  const [hasInteracted, setHasInteracted] = useStateP(false);
  const [inputMode, setInputMode] = useStateP("slider"); // slider | manual
  const [revealed, setRevealed] = useStateP(false);
  const [savedHere, setSavedHere] = useStateP(false);
  const [tab, setTab] = useStateP("photos"); // photos | specs

  useEffectP(() => {
    setGuess(120); setHasInteracted(false);
    setRevealed(false); setSavedHere(false); setTab("photos");
  }, [product.id]);

  function handleGuess(v) {
    setGuess(v);
    setHasInteracted(true);
  }
  function lockIn() { setRevealed(true); }
  function nextRound() { onSubmit({ guess, product }); }

  return (
    <div style={{
      position: "relative", width: "100%", height: "100%",
      background: "var(--paper)", display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* TOP BAR */}
      <header style={{
        flex: "0 0 auto", display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "18px 28px", zIndex: 5,
        position: "relative",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Wordmark size={17}/>
          <div style={{ width: 1, height: 18, background: "var(--rule)" }}/>
          <RoundPill current={roundNum} total={totalRounds}/>
          <StreakFlame count={streak}/>
          {hardMode && (
            <span className="caption" style={{
              padding: "5px 10px", borderRadius: 999,
              background: "var(--ink)", color: "var(--paper)",
              fontSize: 10, letterSpacing: "0.12em",
            }}>HARD MODE</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="btn btn-icon" aria-label="Save item"
            onClick={() => setSavedHere(s => !s)}
            style={{ color: savedHere ? accent : "var(--ink)" }}>
            <Icon.Heart filled={savedHere} size={18}/>
          </button>
          <button className="btn btn-icon" aria-label="Exit round" onClick={onExit}>
            <Icon.X size={18}/>
          </button>
        </div>
      </header>

      {/* MAIN GRID */}
      <div style={{
        flex: "1 1 auto", display: "grid",
        gridTemplateColumns: "minmax(0, 1.5fr) minmax(440px, 1fr)",
        gap: 0, padding: "0 28px 28px", minHeight: 0,
      }}>
        {/* IMAGE COLUMN */}
        <div style={{
          position: "relative", borderRadius: 18, overflow: "hidden",
          boxShadow: "0 10px 36px -16px rgba(0,0,0,0.35), 0 1px 0 rgba(0,0,0,0.05)",
          background: "#fff",
        }}>
          <ProductGallery
            photos={product.photos}
            bandColor={product.bandColor}
            overlayCount={product.photoCount}
          />

          {/* tab toggle (overlay) */}
          <div style={{
            position: "absolute", left: 16, top: 16, zIndex: 3,
            display: "flex", gap: 4, padding: 4,
            background: "rgba(247,244,238,0.92)", borderRadius: 999,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)", backdropFilter: "blur(8px)",
          }}>
            {[{ k: "photos", label: "Photos" }, { k: "specs", label: "Specs" }].map(t => {
              const isActive = tab === t.k;
              return (
                <button key={t.k} onClick={() => setTab(t.k)} style={{
                  padding: "7px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                  background: isActive ? "var(--ink)" : "transparent",
                  color: isActive ? "var(--paper)" : "var(--ink-mute)",
                  letterSpacing: "0.02em",
                }}>{t.label}</button>
              );
            })}
          </div>

          {/* Specs overlay */}
          {tab === "specs" && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 2,
              background: "var(--paper)", padding: "70px 44px 44px",
              display: "flex", flexDirection: "column", justifyContent: "center",
              animation: "fadeIn 220ms var(--ease)",
            }}>
              <div className="eyebrow" style={{ marginBottom: 18 }}>Product details</div>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0",
                borderTop: "1px solid var(--rule)",
              }}>
                {product.specs.map(([k, v], i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", gap: 14,
                    padding: "14px 18px", borderBottom: "1px solid var(--rule)",
                    borderRight: i % 2 === 0 ? "1px solid var(--rule)" : "none",
                  }}>
                    <span style={{ fontSize: 13, color: "var(--ink-mute)" }}>{k}</span>
                    <span className="tnum" style={{ fontSize: 13.5, fontWeight: 600, textAlign: "right" }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 22 }}>
                <div className="eyebrow" style={{ marginBottom: 10 }}>About this item</div>
                <ul style={{ margin: 0, paddingLeft: 18, color: "var(--ink-soft)", fontSize: 13.5, lineHeight: 1.7 }}>
                  {product.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* GUESS PANEL */}
        <div style={{
          padding: "14px 0 0 36px", display: "flex", flexDirection: "column", minHeight: 0,
        }}>
          {/* Product facts */}
          <div style={{
            paddingBottom: 20, marginBottom: 20, borderBottom: "1px solid var(--rule)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <span className="eyebrow">{product.category} <span style={{ color: "var(--ink-quiet)" }}>›</span> {product.subcategory}</span>
              {product.badge && <ChoiceBadge label={product.badge}/>}
            </div>
            <h2 style={{
              fontFamily: "var(--display)", fontStyle: "italic", fontWeight: 500,
              fontSize: 31, lineHeight: 1.08, letterSpacing: "-0.02em",
              margin: "0 0 12px", color: "var(--ink)", textWrap: "balance",
            }}>
              {product.title}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Stars value={product.rating} size={17}/>
                <span className="tnum" style={{ fontWeight: 700, fontSize: 14 }}>{product.rating.toFixed(1)}</span>
              </span>
              <span className="tnum" style={{ fontSize: 13.5, color: "var(--ink-mute)" }}>
                {product.reviews.toLocaleString()} ratings
              </span>
              {product.prime && <PrimeBadge small/>}
            </div>
            <p style={{ fontSize: 14.5, color: "var(--ink-mute)", margin: "0 0 16px", lineHeight: 1.5 }}>
              {product.blurb}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 22px" }}>
              <Stat icon={Icon.Cart} label="" value={product.boughtBlurb}/>
              {!hardMode && <Stat icon={Icon.Tag} label="" value={product.rank}/>}
            </div>
          </div>

          {/* GUESS LARGE NUMBER */}
          <div style={{ marginBottom: 8 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Your guess</div>
            {inputMode === "slider" ? (
              <div className="display tnum" style={{
                fontSize: 76, lineHeight: 1, color: hasInteracted ? "var(--ink)" : "var(--ink-quiet)",
                letterSpacing: "-0.03em", fontFeatureSettings: '"tnum"',
              }}>
                ${Math.round(guess).toLocaleString()}
              </div>
            ) : (
              <ManualEntry value={guess} onChange={handleGuess}/>
            )}
          </div>

          {/* Mode tabs */}
          <div style={{ display: "flex", gap: 6, marginTop: 8, marginBottom: 10 }}>
            {[{ k: "slider", label: "Slider" }, { k: "manual", label: "Type a number" }].map(m => (
              <button key={m.k} onClick={() => setInputMode(m.k)} style={{
                padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                background: inputMode === m.k ? "var(--ink)" : "transparent",
                color: inputMode === m.k ? "var(--paper)" : "var(--ink-mute)",
                boxShadow: inputMode === m.k ? "none" : "inset 0 0 0 1px var(--rule)",
                letterSpacing: "0.01em",
              }}>{m.label}</button>
            ))}
          </div>

          {/* SLIDER */}
          {inputMode === "slider" && (
            <PriceSlider value={guess} onChange={handleGuess} locked={revealed}/>
          )}

          {/* CTA */}
          <div style={{ marginTop: "auto", paddingTop: 26, display: "flex", gap: 10 }}>
            <button
              className="btn btn-primary"
              onClick={lockIn}
              disabled={!hasInteracted || revealed}
              style={{
                flex: 1, background: !hasInteracted ? "rgba(26,26,26,0.08)" : accent,
                color: !hasInteracted ? "var(--ink-quiet)" : "#fff",
                padding: "20px", fontSize: 16, borderRadius: 14,
                boxShadow: hasInteracted ? `0 1px 0 rgba(255,255,255,0.25) inset, 0 12px 28px -10px ${accent}88` : "none",
              }}>
              {hasInteracted ? "Lock it in" : "Make a guess to continue"}
              {hasInteracted && <Icon.Arrow size={18}/>}
            </button>
            <button className="btn btn-secondary" style={{ padding: "20px 18px", fontSize: 14 }} title="Skip this item">
              Skip
            </button>
          </div>
        </div>
      </div>

      {/* REVEAL OVERLAY */}
      {revealed && (
        <RevealOverlay
          product={product}
          guess={guess}
          accent={accent}
          onNext={nextRound}
          onSave={() => setSavedHere(s => !s)}
          saved={savedHere}
          isLast={roundNum === totalRounds}
        />
      )}
    </div>
  );
}

// ─── Manual entry ──────────────────────────────────
function ManualEntry({ value, onChange }) {
  const [str, setStr] = useStateP(value.toString());
  useEffectP(() => { setStr(value.toString()); }, [value]);
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
      <span className="display" style={{ fontSize: 76, lineHeight: 1, color: "var(--ink)" }}>$</span>
      <input
        type="text" inputMode="numeric"
        value={Number(str.replace(/[^0-9]/g, "")).toLocaleString("en-US")}
        onChange={(e) => {
          const n = Number(e.target.value.replace(/[^0-9]/g, ""));
          setStr(String(n));
          onChange(Math.max(5, Math.min(5000, n || 5)));
        }}
        style={{
          fontFamily: "var(--display)", fontStyle: "italic", fontWeight: 500,
          fontSize: 76, lineHeight: 1, letterSpacing: "-0.03em",
          background: "transparent", border: 0, outline: "none",
          width: "100%", color: "var(--ink)", fontFeatureSettings: '"tnum"',
          borderBottom: "2px solid var(--ink)", padding: 0,
        }}
      />
    </div>
  );
}

// ─── Reveal Overlay (the dopamine moment) ──────────
function RevealOverlay({ product, guess, accent, onNext, onSave, saved, isLast }) {
  const diff = guess - product.price;
  const pctOff = Math.abs(diff) / product.price;
  const accuracy = Math.max(0, Math.min(100, Math.round((1 - pctOff) * 100)));
  const reaction = useMemoP(() => window.pickReaction(pctOff), [product.id, guess]);
  const points = Math.max(0, Math.round((1 - pctOff) * 100));
  const fireConfetti = pctOff <= 0.05;
  const [tickerDone, setTickerDone] = useStateP(false);

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 50,
      background: "rgba(26,26,26,0.55)",
      backdropFilter: "blur(14px) saturate(140%)",
      WebkitBackdropFilter: "blur(14px) saturate(140%)",
      animation: "fadeIn 280ms var(--ease)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <Confetti fire={fireConfetti && tickerDone}/>

      <div style={{
        position: "relative", width: "100%", maxWidth: 760,
        background: "var(--paper)", borderRadius: 24,
        padding: "38px 48px 34px",
        boxShadow: "0 30px 80px -20px rgba(0,0,0,0.5)",
        animation: "scaleIn 360ms var(--ease)",
        maxHeight: "92vh", overflow: "auto",
      }} className="grain">
        <div style={{ position: "relative", zIndex: 2 }}>
          {/* tag bar */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20,
          }}>
            <span className="caption" style={{
              padding: "5px 10px", borderRadius: 999,
              background: reaction.color, color: "var(--paper)",
              fontSize: 10, letterSpacing: "0.14em",
            }}>{reaction.label.toUpperCase()}</span>
            <span className="caption" style={{ color: "var(--ink-quiet)", fontSize: 11 }}>REVEAL</span>
          </div>

          {/* reaction line */}
          <h2 className="display" style={{
            margin: "0 0 28px", fontSize: 54, lineHeight: 1, color: "var(--ink)",
            letterSpacing: "-0.025em",
          }}>
            {reaction.copy}
          </h2>

          {/* number stack */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28,
            paddingBottom: 22, borderBottom: "1px solid var(--rule)", marginBottom: 22,
          }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Your guess</div>
              <div className="tnum" style={{
                fontFamily: "var(--display)", fontStyle: "italic", fontWeight: 500,
                fontSize: 38, lineHeight: 1, color: "var(--ink-mute)", letterSpacing: "-0.02em",
              }}>
                ${guess.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8, color: accent }}>Actual price</div>
              <div className="tnum display" style={{
                fontSize: 60, lineHeight: 1, color: accent, letterSpacing: "-0.025em",
              }}>
                <NumberTicker value={product.price} duration={1100} onDone={() => setTickerDone(true)}/>
              </div>
            </div>
          </div>

          {/* delta + accuracy + score */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 22, paddingBottom: 26,
          }}>
            <Metric
              label="Off by"
              value={(diff < 0 ? "−" : "+") + "$" + Math.abs(diff).toLocaleString()}
              tone={diff < 0 ? "low" : "high"}
            />
            <Metric label="Accuracy" value={accuracy + "%"}/>
            <Metric label="Score this round" value={"+" + points} accent={accent}/>
          </div>

          {/* review quote + rank */}
          <div style={{
            display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18,
            background: "var(--cream)", borderRadius: 16, padding: 18, marginBottom: 22,
          }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Top review</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Stars value={product.review.stars} size={13}/>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>{product.review.name}</span>
              </div>
              <div style={{
                fontFamily: "var(--display)", fontStyle: "italic", fontSize: 17, lineHeight: 1.32,
                color: "var(--ink)", textWrap: "pretty",
              }}>
                "{product.review.text}"
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 12, borderLeft: "1px solid var(--rule)", paddingLeft: 18 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 5 }}>Rank</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3 }}>{product.rank}</div>
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom: 5 }}>Demand</div>
                <div className="tnum" style={{ fontSize: 13.5, fontWeight: 600 }}>{product.boughtBlurb}</div>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" onClick={onNext} style={{
              flex: 1, background: accent, padding: "20px", fontSize: 16, borderRadius: 14,
              boxShadow: `0 1px 0 rgba(255,255,255,0.25) inset, 0 12px 28px -10px ${accent}aa`,
            }}>
              {isLast ? "See your results" : "Next item"} <Icon.Arrow size={18}/>
            </button>
            <button className="btn btn-secondary" onClick={onSave} style={{
              padding: "20px", fontSize: 14, color: saved ? accent : "var(--ink)",
              boxShadow: `inset 0 0 0 1.5px ${saved ? accent : "var(--ink)"}`,
            }}>
              <Icon.Heart filled={saved} size={16}/> {saved ? "Saved" : "Save item"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, tone, accent }) {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
      <div className="tnum" style={{
        fontFamily: "var(--display)", fontStyle: "italic", fontWeight: 500,
        fontSize: 28, letterSpacing: "-0.02em",
        color: accent || "var(--ink)",
      }}>
        {value}
      </div>
    </div>
  );
}

window.PlayScreen = PlayScreen;
