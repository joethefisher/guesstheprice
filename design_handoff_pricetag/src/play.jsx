/* global React */
// src/play.jsx — Game Round (browsing) + Reveal overlay

const { useState: useStateP, useEffect: useEffectP, useRef: useRefP, useMemo: useMemoP } = React;

function PlayScreen({
  listing, roundNum, totalRounds, streak,
  onSubmit, onExit, onSave, accent, hardMode,
}) {
  const [photoIdx, setPhotoIdx] = useStateP(0);
  const [guess, setGuess] = useStateP(900_000);
  const [hasInteracted, setHasInteracted] = useStateP(false);
  const [inputMode, setInputMode] = useStateP("slider"); // slider | manual
  const [revealed, setRevealed] = useStateP(false);
  const [savedHere, setSavedHere] = useStateP(false);
  const [showFloorplan, setShowFloorplan] = useStateP(false);

  // Reset round
  useEffectP(() => {
    setPhotoIdx(0); setGuess(900_000); setHasInteracted(false);
    setRevealed(false); setSavedHere(false); setShowFloorplan(false);
  }, [listing.id]);

  function handleGuess(v) {
    setGuess(v);
    setHasInteracted(true);
  }

  function lockIn() {
    setRevealed(true);
  }

  function nextRound() {
    onSubmit({ guess, listing });
  }

  const fmtBeds = listing.beds === 0 ? "Studio" : listing.beds;

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
          <button className="btn btn-icon" aria-label="Save home"
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
        gridTemplateColumns: "minmax(0, 1.55fr) minmax(420px, 1fr)",
        gap: 0, padding: "0 28px 28px", minHeight: 0,
      }}>
        {/* PHOTO COLUMN */}
        <div style={{
          position: "relative", borderRadius: 18, overflow: "hidden",
          boxShadow: "0 10px 36px -16px rgba(0,0,0,0.35), 0 1px 0 rgba(0,0,0,0.05)",
        }}>
          <PhotoCarousel
            photos={listing.photos}
            bandColor={listing.bandColor}
            overlayCount={listing.photoCount}
            onIndexChange={setPhotoIdx}
          />
          {/* photo type tabs (overlay) */}
          {(() => {
            const activeTab = showFloorplan ? "floorplan" : "photos";
            return (
              <div style={{
                position: "absolute", left: 16, top: 16, zIndex: 3,
                display: "flex", gap: 4, padding: 4,
                background: "rgba(247,244,238,0.92)", borderRadius: 999,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                backdropFilter: "blur(8px)",
              }}>
                {[
                  { k: "photos", label: "Photos" },
                  { k: "floorplan", label: "Floor plan" },
                  { k: "map", label: "Map", disabled: true },
                ].map(t => {
                  const isActive = activeTab === t.k;
                  return (
                    <button key={t.k}
                      onClick={() => !t.disabled && setShowFloorplan(t.k === "floorplan")}
                      style={{
                        padding: "7px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                        background: isActive ? "var(--ink)" : "transparent",
                        color: isActive ? "var(--paper)" : t.disabled ? "var(--ink-quiet)" : "var(--ink-mute)",
                        letterSpacing: "0.02em",
                        cursor: t.disabled ? "default" : "pointer",
                      }}>{t.label}{t.disabled ? <span style={{ opacity: 0.6, marginLeft: 6, fontSize: 10 }}>🔒</span> : null}</button>
                  );
                })}
              </div>
            );
          })()}

          {/* Floor plan placeholder (overlay) */}
          {showFloorplan && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 4,
              background: "var(--cream)", padding: "60px 40px",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "fadeIn 220ms var(--ease)",
            }}>
              <FloorPlanPlaceholder listing={listing}/>
            </div>
          )}
        </div>

        {/* GUESS PANEL */}
        <div style={{
          padding: "14px 0 0 36px", display: "flex", flexDirection: "column", minHeight: 0,
        }}>
          {/* Property facts */}
          <div style={{
            paddingBottom: 22, marginBottom: 22, borderBottom: "1px solid var(--rule)",
          }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>
              Listed in {listing.city}
            </div>
            <h2 style={{
              fontFamily: "var(--display)", fontStyle: "italic", fontWeight: 500,
              fontSize: 36, lineHeight: 1.05, letterSpacing: "-0.02em",
              margin: "0 0 10px", color: "var(--ink)",
            }}>
              {listing.neighborhood},<br/>
              <span style={{ color: "var(--ink-mute)" }}>{listing.city}, {listing.state}</span>
            </h2>
            <p style={{ fontSize: 14.5, color: "var(--ink-mute)", margin: "0 0 18px", lineHeight: 1.5 }}>
              {listing.blurb}
            </p>
            <div style={{
              display: "flex", flexWrap: "wrap", gap: "12px 22px", paddingTop: 4,
            }}>
              <Stat icon={Icon.Bed} label="bd" value={fmtBeds}/>
              <Stat icon={Icon.Bath} label="ba" value={listing.baths}/>
              <Stat icon={Icon.Sqft} label="sqft" value={listing.sqft.toLocaleString()}/>
              <Stat icon={Icon.Year} label="built" value={listing.year}/>
              {listing.lot && <Stat icon={Icon.Map} label="lot" value={listing.lot.toLocaleString()}/>}
            </div>
          </div>

          {/* GUESS LARGE NUMBER */}
          <div style={{ marginBottom: 8 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              Your guess
            </div>
            {inputMode === "slider" ? (
              <div className="display tnum" style={{
                fontSize: 78, lineHeight: 1, color: hasInteracted ? "var(--ink)" : "var(--ink-quiet)",
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
            {[
              { k: "slider", label: "Slider" },
              { k: "manual", label: "Type a number" },
            ].map(m => (
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
          <div style={{ marginTop: "auto", paddingTop: 28, display: "flex", gap: 10 }}>
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
            <button className="btn btn-secondary" style={{ padding: "20px 18px", fontSize: 14 }} title="Skip this round">
              Skip
            </button>
          </div>
        </div>
      </div>

      {/* REVEAL OVERLAY */}
      {revealed && (
        <RevealOverlay
          listing={listing}
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
      <span className="display" style={{ fontSize: 78, lineHeight: 1, color: "var(--ink)" }}>$</span>
      <input
        type="text" inputMode="numeric"
        value={Number(str.replace(/[^0-9]/g, "")).toLocaleString("en-US")}
        onChange={(e) => {
          const n = Number(e.target.value.replace(/[^0-9]/g, ""));
          setStr(String(n));
          onChange(Math.max(50_000, Math.min(20_000_000, n || 50_000)));
        }}
        style={{
          fontFamily: "var(--display)", fontStyle: "italic", fontWeight: 500,
          fontSize: 78, lineHeight: 1, letterSpacing: "-0.03em",
          background: "transparent", border: 0, outline: "none",
          width: "100%", color: "var(--ink)",
          fontFeatureSettings: '"tnum"',
          borderBottom: "2px solid var(--ink)", padding: 0,
        }}
      />
    </div>
  );
}

// ─── Floor plan placeholder ────────────────────────
function FloorPlanPlaceholder({ listing }) {
  return (
    <svg viewBox="0 0 600 400" style={{ width: "100%", height: "100%", maxWidth: 800 }}>
      <rect width="600" height="400" fill="var(--cream)"/>
      {/* outer wall */}
      <rect x="40" y="40" width="520" height="320" fill="none" stroke="var(--ink)" strokeWidth="3"/>
      {/* internal walls */}
      <line x1="280" y1="40" x2="280" y2="220" stroke="var(--ink)" strokeWidth="2"/>
      <line x1="40" y1="220" x2="560" y2="220" stroke="var(--ink)" strokeWidth="2"/>
      <line x1="380" y1="220" x2="380" y2="360" stroke="var(--ink)" strokeWidth="2"/>
      {/* doors (gaps) */}
      <line x1="160" y1="220" x2="200" y2="220" stroke="var(--cream)" strokeWidth="3"/>
      <line x1="280" y1="140" x2="280" y2="180" stroke="var(--cream)" strokeWidth="3"/>
      {/* labels */}
      <text x="160" y="135" textAnchor="middle" fontFamily="var(--body)" fontSize="13" fontWeight="600" fill="var(--ink-mute)" letterSpacing="0.06em">LIVING</text>
      <text x="160" y="155" textAnchor="middle" fontFamily="var(--mono)" fontSize="11" fill="var(--ink-quiet)">18'×22'</text>
      <text x="420" y="135" textAnchor="middle" fontFamily="var(--body)" fontSize="13" fontWeight="600" fill="var(--ink-mute)" letterSpacing="0.06em">KITCHEN</text>
      <text x="420" y="155" textAnchor="middle" fontFamily="var(--mono)" fontSize="11" fill="var(--ink-quiet)">14'×16'</text>
      <text x="160" y="295" textAnchor="middle" fontFamily="var(--body)" fontSize="13" fontWeight="600" fill="var(--ink-mute)" letterSpacing="0.06em">BEDROOM</text>
      <text x="160" y="315" textAnchor="middle" fontFamily="var(--mono)" fontSize="11" fill="var(--ink-quiet)">12'×14'</text>
      <text x="320" y="295" textAnchor="middle" fontFamily="var(--body)" fontSize="11" fontWeight="600" fill="var(--ink-mute)" letterSpacing="0.06em">BATH</text>
      <text x="470" y="295" textAnchor="middle" fontFamily="var(--body)" fontSize="13" fontWeight="600" fill="var(--ink-mute)" letterSpacing="0.06em">PRIMARY</text>
      <text x="470" y="315" textAnchor="middle" fontFamily="var(--mono)" fontSize="11" fill="var(--ink-quiet)">14'×18'</text>
      {/* dashed scale */}
      <line x1="40" y1="380" x2="120" y2="380" stroke="var(--ink-mute)" strokeWidth="1" strokeDasharray="3 3"/>
      <text x="80" y="375" textAnchor="middle" fontFamily="var(--mono)" fontSize="10" fill="var(--ink-quiet)">10 ft</text>
      <text x="300" y="30" textAnchor="middle" fontFamily="var(--display)" fontStyle="italic" fontSize="18" fill="var(--ink)">Floor 1 of 2 · {listing.sqft.toLocaleString()} sqft</text>
    </svg>
  );
}

// ─── Reveal Overlay (the dopamine moment) ──────────
function RevealOverlay({ listing, guess, accent, onNext, onSave, saved, isLast }) {
  const diff = guess - listing.price;
  const pctOff = Math.abs(diff) / listing.price;
  const accuracy = Math.max(0, Math.min(100, Math.round((1 - pctOff) * 100)));
  const reaction = useMemoP(() => window.pickReaction(pctOff), [listing.id, guess]);
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
        position: "relative",
        width: "100%", maxWidth: 760,
        background: "var(--paper)",
        borderRadius: 24,
        padding: "40px 48px 36px",
        boxShadow: "0 30px 80px -20px rgba(0,0,0,0.5)",
        animation: "scaleIn 360ms var(--ease)",
      }} className="grain">
        <div style={{ position: "relative", zIndex: 2 }}>
          {/* tag bar */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 22,
          }}>
            <span className="caption" style={{
              padding: "5px 10px", borderRadius: 999,
              background: reaction.color, color: "var(--paper)",
              fontSize: 10, letterSpacing: "0.14em",
            }}>{reaction.label.toUpperCase()}</span>
            <span className="caption" style={{ color: "var(--ink-quiet)", fontSize: 11 }}>
              REVEAL
            </span>
          </div>

          {/* reaction line */}
          <h2 className="display" style={{
            margin: "0 0 32px", fontSize: 56, lineHeight: 1, color: "var(--ink)",
            letterSpacing: "-0.025em",
          }}>
            {reaction.copy}
          </h2>

          {/* number stack */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28,
            paddingBottom: 24, borderBottom: "1px solid var(--rule)", marginBottom: 24,
          }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Your guess</div>
              <div className="tnum" style={{
                fontFamily: "var(--display)", fontStyle: "italic", fontWeight: 500,
                fontSize: 38, lineHeight: 1, color: "var(--ink-mute)",
                letterSpacing: "-0.02em",
              }}>
                ${guess.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8, color: accent }}>Actual price</div>
              <div className="tnum display" style={{
                fontSize: 64, lineHeight: 1, color: accent,
                letterSpacing: "-0.025em",
              }}>
                <NumberTicker value={listing.price} duration={1100} onDone={() => setTickerDone(true)}/>
              </div>
            </div>
          </div>

          {/* delta + accuracy + score */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 22,
            paddingBottom: 28,
          }}>
            <Metric
              label="Off by"
              value={(diff < 0 ? "−" : "+") + "$" + Math.abs(diff).toLocaleString()}
              tone={diff < 0 ? "low" : "high"}
            />
            <Metric label="Accuracy" value={accuracy + "%"}/>
            <Metric label="Score this round" value={"+" + points} accent={accent}/>
          </div>

          {/* address + map preview */}
          <div style={{
            display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18,
            background: "var(--cream)", borderRadius: 16, padding: 18, marginBottom: 24,
          }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Where it is</div>
              <div style={{ fontFamily: "var(--display)", fontStyle: "italic", fontSize: 22, lineHeight: 1.2, color: "var(--ink)" }}>
                {listing.address}
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-mute)", marginTop: 4 }}>
                {listing.neighborhood} · {listing.city}, {listing.state}
              </div>
            </div>
            <MapMini listing={listing}/>
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" onClick={onNext} style={{
              flex: 1, background: accent, padding: "20px", fontSize: 16, borderRadius: 14,
              boxShadow: `0 1px 0 rgba(255,255,255,0.25) inset, 0 12px 28px -10px ${accent}aa`,
            }}>
              {isLast ? "See your results" : "Next round"} <Icon.Arrow size={18}/>
            </button>
            <button className="btn btn-secondary" onClick={onSave} style={{
              padding: "20px", fontSize: 14, color: saved ? accent : "var(--ink)",
              boxShadow: `inset 0 0 0 1.5px ${saved ? accent : "var(--ink)"}`,
            }}>
              <Icon.Heart filled={saved} size={16}/> {saved ? "Saved" : "Save this home"}
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

// ─── Mini map ───────────────────────────────────
function MapMini({ listing }) {
  return (
    <div style={{
      position: "relative", borderRadius: 12, overflow: "hidden",
      background: "#dbe5ec", height: 90,
      animation: "fadeIn 600ms var(--ease) 400ms both",
    }}>
      <svg viewBox="0 0 200 90" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(74,103,65,0.18)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="200" height="90" fill="#e8efe8"/>
        <rect width="200" height="90" fill="url(#grid)"/>
        {/* roads */}
        <path d="M0 30 L200 35" stroke="#fff" strokeWidth="3"/>
        <path d="M0 60 L200 55" stroke="#fff" strokeWidth="2"/>
        <path d="M70 0 L75 90" stroke="#fff" strokeWidth="3"/>
        <path d="M140 0 L145 90" stroke="#fff" strokeWidth="2"/>
        {/* blocks */}
        <rect x="80" y="10" width="55" height="20" fill="rgba(232,224,206,0.5)"/>
        <rect x="80" y="40" width="55" height="15" fill="rgba(232,224,206,0.5)"/>
        <rect x="10" y="40" width="55" height="15" fill="rgba(232,224,206,0.5)"/>
        <rect x="150" y="40" width="45" height="15" fill="rgba(232,224,206,0.5)"/>
        {/* pin */}
        <g transform="translate(110, 38)">
          <circle r="13" fill="rgba(255,92,57,0.18)"/>
          <circle r="6" fill="#FF5C39" stroke="#fff" strokeWidth="2"/>
        </g>
      </svg>
    </div>
  );
}

window.PlayScreen = PlayScreen;
