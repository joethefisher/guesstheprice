/* global React, ReactDOM, LISTINGS, Landing, PlayScreen, SummaryScreen, SavedScreen */
// src/app.jsx — Pricetag root: routing + state machine + tweaks

const { useState, useEffect, useRef } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#FF5C39",
  "showGrain": true,
  "displayFont": "Fraunces",
  "hardMode": false,
  "startScreen": "landing"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  // Apply accent + grain to CSS vars on root
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", t.accent);
    document.documentElement.style.setProperty("--display",
      `"${t.displayFont}", "Tiempos Headline", Georgia, serif`);
  }, [t.accent, t.displayFont]);

  const [route, setRoute] = useState(t.startScreen);
  // route: landing | play | summary | saved

  // Game state
  const initialRounds = window.LISTINGS.slice(0, 10);
  const [deck, setDeck] = useState(initialRounds);
  const [roundIdx, setRoundIdx] = useState(0);
  const [history, setHistory] = useState([]); // {listing, guess, accuracy, pctOff, points}
  const [streak, setStreak] = useState(4);
  const [savedHomes, setSavedHomes] = useState(() => seedSaved());

  function seedSaved() {
    // Pre-seed a few so the Saved tab is full when first visited
    return [
      { listingId: "phx-001", guess: 4_200_000, accuracy: 86, pctOff: 0.13 },
      { listingId: "atx-001", guess: 1_400_000, accuracy: 98, pctOff: 0.018 },
      { listingId: "bk-001", guess: 2_900_000, accuracy: 88, pctOff: 0.12 },
      { listingId: "pdx-001", guess: 825_000, accuracy: 86, pctOff: 0.137 },
      { listingId: "no-001", guess: 480_000, accuracy: 88, pctOff: 0.12 },
      { listingId: "atl-001", guess: 720_000, accuracy: 83, pctOff: 0.17 },
    ];
  }

  function startNewGame() {
    setDeck(window.LISTINGS.slice(0, 10));
    setRoundIdx(0);
    setHistory([]);
    setRoute("play");
  }

  function handleSubmit({ guess, listing }) {
    const pctOff = Math.abs(guess - listing.price) / listing.price;
    const accuracy = Math.max(0, (1 - pctOff) * 100);
    const points = Math.max(0, Math.round((1 - pctOff) * 100));
    const entry = { listing, guess, accuracy, pctOff, points };
    const newHist = [...history, entry];
    setHistory(newHist);

    if (roundIdx + 1 >= deck.length) {
      setStreak(s => s + 1);
      setRoute("summary");
    } else {
      setRoundIdx(roundIdx + 1);
    }
  }

  // Mock summary data (used when jumping to summary directly)
  function mockSummary() {
    return [
      mkRound("bk-001", 3_100_000, 0.059),
      mkRound("phx-001", 4_500_000, 0.072),
      mkRound("sf-001", 1_200_000, 0.341),
      mkRound("atx-001", 1_400_000, 0.018),
      mkRound("det-001", 410_000, 0.065),
      mkRound("mal-001", 12_500_000, 0.333),
      mkRound("atl-001", 720_000, 0.171),
      mkRound("no-001", 525_000, 0.037),
      mkRound("asp-001", 22_000_000, 0.2),
      mkRound("pdx-001", 825_000, 0.137),
    ];
  }
  function mkRound(id, guess, pctOff) {
    const listing = window.LISTINGS.find(l => l.id === id);
    const accuracy = (1 - pctOff) * 100;
    return { listing, guess, accuracy, pctOff, points: Math.round(accuracy) };
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {route === "landing" && (
        <Landing
          onPlay={startNewGame}
          onDaily={startNewGame}
          accent={t.accent}
        />
      )}
      {route === "play" && (
        <PlayScreen
          listing={deck[roundIdx]}
          roundNum={roundIdx + 1}
          totalRounds={deck.length}
          streak={streak}
          accent={t.accent}
          hardMode={t.hardMode}
          onSubmit={handleSubmit}
          onExit={() => setRoute("landing")}
          onSave={() => {}}
        />
      )}
      {route === "summary" && (
        <SummaryScreen
          rounds={history.length === 10 ? history : mockSummary()}
          accent={t.accent}
          onPlayAgain={startNewGame}
          onDaily={startNewGame}
          onHome={() => setRoute("landing")}
        />
      )}
      {route === "saved" && (
        <SavedScreen
          saved={savedHomes}
          listings={window.LISTINGS}
          accent={t.accent}
          onPlay={startNewGame}
          onHome={() => setRoute("landing")}
        />
      )}

      {/* GLOBAL NAV (fixed bottom-left) */}
      <FloatingNav route={route} setRoute={setRoute} accent={t.accent}/>

      {/* TWEAKS PANEL */}
      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Visual identity"/>
        <window.TweakColor
          label="Accent"
          value={t.accent}
          options={["#FF5C39", "#4A6741", "#C8A348", "#5B7CA8", "#1A1A1A"]}
          onChange={(v) => setTweak("accent", v)}
        />
        <window.TweakRadio
          label="Display font"
          value={t.displayFont}
          options={["Fraunces", "DM Serif Display", "Recoleta"]}
          onChange={(v) => setTweak("displayFont", v)}
        />
        <window.TweakToggle
          label="Grain texture"
          value={t.showGrain}
          onChange={(v) => setTweak("showGrain", v)}
        />

        <window.TweakSection label="Gameplay"/>
        <window.TweakToggle
          label="Hard mode"
          value={t.hardMode}
          onChange={(v) => setTweak("hardMode", v)}
        />
        <window.TweakRadio
          label="Jump to"
          value={route}
          options={["landing", "play", "summary", "saved"]}
          onChange={(v) => setRoute(v)}
        />
      </window.TweaksPanel>

      {/* Apply grain master toggle */}
      <style>{`
        ${!t.showGrain ? `.grain::before { display: none !important; }` : ""}
      `}</style>
    </div>
  );
}

// ─── Floating page-level nav (small, persistent) ──
function FloatingNav({ route, setRoute, accent }) {
  if (route === "play") return null; // play screen has its own
  if (route === "landing") return null; // landing has its own top-nav
  const items = [
    { k: "landing", label: "Home" },
    { k: "saved", label: "Saved" },
    { k: "summary", label: "Last game" },
  ];
  return (
    <div style={{
      position: "fixed", left: 24, bottom: 24, zIndex: 30,
      display: "flex", gap: 4, padding: 4,
      background: "rgba(247,244,238,0.92)",
      backdropFilter: "blur(12px)",
      borderRadius: 999, boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset, 0 8px 24px -8px rgba(0,0,0,0.2)",
      border: "1px solid var(--rule)",
    }}>
      {items.map(it => (
        <button key={it.k} onClick={() => setRoute(it.k)} style={{
          padding: "8px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600,
          background: route === it.k ? "var(--ink)" : "transparent",
          color: route === it.k ? "var(--paper)" : "var(--ink-mute)",
          letterSpacing: "0.02em",
        }}>{it.label}</button>
      ))}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
