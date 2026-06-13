/* global React, ReactDOM */
// amazon/app.jsx — Pricetag: Amazon edition — routing + state + tweaks

const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#FF5C39",
  "showGrain": true,
  "displayFont": "Fraunces",
  "hardMode": false,
  "startScreen": "landing"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", t.accent);
    document.documentElement.style.setProperty("--display",
      `"${t.displayFont}", "Tiempos Headline", Georgia, serif`);
  }, [t.accent, t.displayFont]);

  const [route, setRoute] = useState(t.startScreen);

  const initialRounds = window.PRODUCTS.slice(0, 12);
  const [deck, setDeck] = useState(initialRounds);
  const [roundIdx, setRoundIdx] = useState(0);
  const [history, setHistory] = useState([]);

  const [lastGame, setLastGame] = useState(() => {
    try {
      const raw = localStorage.getItem("pricetag.amz.lastGame");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const rounds = parsed.rounds.map(r => ({
        ...r,
        product: window.ALL_PRODUCTS.find(p => p.id === r.productId) || r.product,
      }));
      return { rounds, completedAt: parsed.completedAt };
    } catch (e) { return null; }
  });
  const [streak, setStreak] = useState(5);
  const [savedItems] = useState(() => seedSaved());

  function seedSaved() {
    return [
      { productId: "amz-earbuds", guess: 199, accuracy: 95, pctOff: 0.053 },
      { productId: "amz-tumbler", guess: 42, accuracy: 93, pctOff: 0.067 },
      { productId: "amz-espresso", guess: 599, accuracy: 80, pctOff: 0.20 },
      { productId: "amz-vacuum", guess: 520, accuracy: 89, pctOff: 0.109 },
      { productId: "amz-backpack", guess: 95, accuracy: 68, pctOff: 0.317 },
      { productId: "amz-headphones", guess: 349, accuracy: 87, pctOff: 0.125 },
      { productId: "amz-blender", guess: 380, accuracy: 85, pctOff: 0.154 },
      { productId: "amz-watch", guess: 60, accuracy: 0, pctOff: 1.4 },
      { productId: "amz-controller", guess: 49, accuracy: 91, pctOff: 0.093 },
    ];
  }

  function startNewGame() {
    setDeck(window.PRODUCTS.slice(0, 12));
    setRoundIdx(0);
    setHistory([]);
    setRoute("play");
  }

  function handleSubmit({ guess, product }) {
    const pctOff = Math.abs(guess - product.price) / product.price;
    const accuracy = Math.max(0, (1 - pctOff) * 100);
    const points = Math.max(0, Math.round((1 - pctOff) * 100));
    const entry = { product, guess, accuracy, pctOff, points };
    const newHist = [...history, entry];
    setHistory(newHist);

    if (roundIdx + 1 >= deck.length) {
      const snapshot = { rounds: newHist, completedAt: Date.now() };
      setLastGame(snapshot);
      try {
        localStorage.setItem("pricetag.amz.lastGame", JSON.stringify({
          rounds: newHist.map(r => ({
            productId: r.product.id, guess: r.guess,
            accuracy: r.accuracy, pctOff: r.pctOff, points: r.points,
          })),
          completedAt: snapshot.completedAt,
        }));
      } catch (e) { /* localStorage unavailable */ }
      setStreak(s => s + 1);
      setRoute("summary");
    } else {
      setRoundIdx(roundIdx + 1);
    }
  }

  function mockSummary() {
    const m = [
      ["amz-headphones", 379, 0.05], ["amz-watch", 22, 0.12],
      ["amz-smartwatch", 259, 0.04], ["amz-earbuds", 149, 0.21],
      ["amz-camera-instax", 75, 0.05], ["amz-sneakers", 110, 0.147],
      ["amz-sunglasses", 95, 0.41], ["amz-keyboard", 85, 0.045],
      ["amz-tumbler", 35, 0.222], ["amz-camera", 720, 0.06],
      ["amz-espresso", 549, 0.267], ["amz-controller", 59, 0.093],
    ];
    return m.map(([id, guess, pctOff]) => {
      const product = window.ALL_PRODUCTS.find(p => p.id === id);
      const accuracy = (1 - pctOff) * 100;
      return { product, guess, accuracy, pctOff, points: Math.round(accuracy) };
    });
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {route === "landing" && (
        <Landing
          onPlay={startNewGame} onDaily={startNewGame} onSaved={() => setRoute("saved")} accent={t.accent}
          lastGame={lastGame} onViewLastGame={() => setRoute("summary")}
        />
      )}
      {route === "play" && (
        <PlayScreen
          product={deck[roundIdx]} roundNum={roundIdx + 1} totalRounds={deck.length}
          streak={streak} accent={t.accent} hardMode={t.hardMode}
          onSubmit={handleSubmit} onExit={() => setRoute("landing")}
        />
      )}
      {route === "summary" && (
        <SummaryScreen
          rounds={
            (lastGame && lastGame.rounds.length === deck.length) ? lastGame.rounds :
            (history.length === deck.length) ? history : mockSummary()
          }
          accent={t.accent}
          onPlayAgain={startNewGame} onDaily={startNewGame} onHome={() => setRoute("landing")}
        />
      )}
      {route === "saved" && (
        <SavedScreen
          saved={savedItems} products={window.ALL_PRODUCTS} accent={t.accent}
          onPlay={startNewGame} onHome={() => setRoute("landing")}
        />
      )}

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

      <style>{`${!t.showGrain ? ".grain::before { display: none !important; }" : ""}`}</style>
    </div>
  );
}

function FloatingNav({ route, setRoute, accent }) {
  if (route === "play" || route === "landing") return null;
  const items = [
    { k: "landing", label: "Home" },
    { k: "saved", label: "Saved" },
    { k: "summary", label: "Last game" },
  ];
  return (
    <div style={{
      position: "fixed", left: 24, bottom: 24, zIndex: 30,
      display: "flex", gap: 4, padding: 4,
      background: "rgba(247,244,238,0.92)", backdropFilter: "blur(12px)",
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
