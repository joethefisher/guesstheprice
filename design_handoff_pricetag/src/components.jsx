/* global React */
// src/components.jsx — shared building blocks for Pricetag

const { useState, useEffect, useRef, useCallback, useMemo } = React;

// ─── Hand-drawn-feel SVG icons ───────────────────────
const Icon = {
  Heart: ({ filled = false, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.5 7.5a4.5 4.5 0 0 0-8.5-2 4.5 4.5 0 0 0-8.5 2c0 5.5 8.5 11 8.5 11s8.5-5.5 8.5-11Z" />
    </svg>
  ),
  X: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  ),
  Arrow: ({ size = 18, dir = "right" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ transform: dir === "left" ? "scaleX(-1)" : "none" }}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Flame: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2c1 4 5 5 5 10a5 5 0 1 1-10 0c0-2 1-3 2-4-1 3 1 4 2 4 0-3-1-5 1-10Z" />
    </svg>
  ),
  Bed: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 14h18M7 10V8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2"/>
    </svg>
  ),
  Bath: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3ZM6 12V6a2 2 0 0 1 2-2c1.5 0 2 1 2 2"/>
      <path d="M9 6h3"/>
    </svg>
  ),
  Sqft: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="1"/>
      <path d="M4 9h4M4 14h4M9 20v-4M14 20v-4"/>
    </svg>
  ),
  Year: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 7v5l3 2"/>
    </svg>
  ),
  Map: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6Z"/>
      <path d="M9 4v16M15 6v16"/>
    </svg>
  ),
  Share: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v12M8 8l4-4 4 4M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/>
    </svg>
  ),
  Sparkle: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6L12 2Z"/>
    </svg>
  ),
};

// ─── Logo / Wordmark ───────────────────────────────
function Wordmark({ size = 20 }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
      <svg width={size + 4} height={size + 4} viewBox="0 0 28 28" fill="none">
        <path d="M3 6 L17 4 L25 14 L11 24 Z" fill="var(--ink)"/>
        <circle cx="13" cy="9" r="1.6" fill="var(--paper)"/>
      </svg>
      <span style={{
        fontFamily: "var(--display)", fontStyle: "italic", fontWeight: 500,
        fontSize: size, letterSpacing: "-0.025em", color: "var(--ink)"
      }}>pricetag</span>
    </div>
  );
}

// ─── Number ticker ────────────────────────────────
function NumberTicker({ value, duration = 900, prefix = "$", className = "", onDone }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf, start;
    const from = 0, to = value;
    function step(ts) {
      if (!start) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      // ease-out-cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(step);
      else if (onDone) onDone();
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return (
    <span className={"tnum " + className}>{prefix}{n.toLocaleString("en-US")}</span>
  );
}

// ─── Confetti ─────────────────────────────────────
function Confetti({ count = 80, fire = false }) {
  if (!fire) return null;
  const palette = ["#FF5C39", "#4A6741", "#A8C5DA", "#C8A348", "#1A1A1A", "#EDE6D6"];
  const pieces = useMemo(() =>
    Array.from({ length: count }).map((_, i) => ({
      x: Math.random() * 100,
      delay: Math.random() * 0.4,
      dur: 1.6 + Math.random() * 1.2,
      rot: Math.random() * 360,
      size: 6 + Math.random() * 8,
      color: palette[i % palette.length],
      shape: i % 3,
    })), [count]);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 60 }}>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position: "absolute",
          left: p.x + "%", top: 0,
          width: p.size, height: p.size * (p.shape === 1 ? 0.4 : 1),
          background: p.color,
          borderRadius: p.shape === 2 ? "50%" : 1,
          transform: `rotate(${p.rot}deg)`,
          animation: `confetti-fall ${p.dur}s ${p.delay}s linear forwards`,
        }} />
      ))}
    </div>
  );
}

// ─── Photo carousel ───────────────────────────────
function PhotoCarousel({ photos, bandColor = "#bfae93", overlayCount, onIndexChange }) {
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState({});
  useEffect(() => { onIndexChange && onIndexChange(idx); }, [idx]);
  const total = photos.length;
  const go = (d) => setIdx((i) => (i + d + total) % total);
  useEffect(() => {
    const k = (e) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: bandColor, overflow: "hidden" }}>
      {photos.map((src, i) => (
        <div key={i} style={{
          position: "absolute", inset: 0,
          opacity: i === idx ? 1 : 0,
          transition: "opacity 360ms var(--ease)",
          backgroundImage: `url(${src})`,
          backgroundSize: "cover", backgroundPosition: "center",
        }} />
      ))}
      {/* gradient for legibility of overlays */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, rgba(0,0,0,.32) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 60%, rgba(0,0,0,.5) 100%)",
        pointerEvents: "none",
      }} />

      {/* arrows */}
      <button onClick={() => go(-1)} aria-label="Previous photo" style={navStyle("left")}>
        <Icon.Arrow dir="left" size={20}/>
      </button>
      <button onClick={() => go(1)} aria-label="Next photo" style={navStyle("right")}>
        <Icon.Arrow size={20}/>
      </button>

      {/* counter */}
      <div style={{
        position: "absolute", top: 16, right: 16,
        background: "rgba(26,26,26,0.72)", color: "var(--paper)",
        padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600,
        letterSpacing: "0.02em", backdropFilter: "blur(8px)",
      }} className="tnum">
        {idx + 1} <span style={{ opacity: 0.55 }}>/</span> {overlayCount || total}
      </div>

      {/* dots */}
      <div style={{
        position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)",
        display: "flex", gap: 6, padding: "6px 10px",
        background: "rgba(26,26,26,0.4)", borderRadius: 999, backdropFilter: "blur(8px)",
      }}>
        {photos.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} aria-label={`Photo ${i+1}`} style={{
            width: i === idx ? 22 : 6, height: 6, borderRadius: 4,
            background: i === idx ? "var(--paper)" : "rgba(247,244,238,0.5)",
            transition: "all 280ms var(--ease)",
          }}/>
        ))}
      </div>
    </div>
  );
}
const navStyle = (side) => ({
  position: "absolute", top: "50%", [side]: 14, transform: "translateY(-50%)",
  width: 44, height: 44, borderRadius: 999,
  background: "rgba(247,244,238,0.92)", color: "var(--ink)",
  display: "grid", placeItems: "center",
  boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
});

// ─── Logarithmic price slider ────────────────────
const SLIDER_MIN = 50_000;
const SLIDER_MAX = 20_000_000;
const TICKS = [100_000, 250_000, 500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000];

function valueToPos(v) {
  const lmin = Math.log(SLIDER_MIN), lmax = Math.log(SLIDER_MAX);
  return (Math.log(v) - lmin) / (lmax - lmin);
}
function posToValue(p) {
  const lmin = Math.log(SLIDER_MIN), lmax = Math.log(SLIDER_MAX);
  return Math.exp(lmin + p * (lmax - lmin));
}
function snapValue(v) {
  if (v < 1_000_000) return Math.round(v / 5_000) * 5_000;
  if (v < 5_000_000) return Math.round(v / 25_000) * 25_000;
  return Math.round(v / 100_000) * 100_000;
}

function PriceSlider({ value, onChange, locked = false }) {
  const trackRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const pct = valueToPos(value);

  const updateFromX = useCallback((clientX) => {
    const r = trackRef.current.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    onChange(snapValue(posToValue(p)));
  }, [onChange]);

  useEffect(() => {
    if (!drag) return;
    const m = (e) => updateFromX(e.touches ? e.touches[0].clientX : e.clientX);
    const u = () => setDrag(false);
    window.addEventListener("mousemove", m);
    window.addEventListener("touchmove", m, { passive: true });
    window.addEventListener("mouseup", u);
    window.addEventListener("touchend", u);
    return () => {
      window.removeEventListener("mousemove", m);
      window.removeEventListener("touchmove", m);
      window.removeEventListener("mouseup", u);
      window.removeEventListener("touchend", u);
    };
  }, [drag, updateFromX]);

  return (
    <div style={{ position: "relative", padding: "32px 0 0", opacity: locked ? 0.55 : 1, pointerEvents: locked ? "none" : "auto" }}>
      {/* tick labels */}
      <div style={{ position: "relative", height: 16 }}>
        {TICKS.map((t) => (
          <div key={t} className="caption tnum" style={{
            position: "absolute", left: `${valueToPos(t) * 100}%`,
            transform: "translateX(-50%)",
            fontSize: 10, color: "var(--ink-quiet)",
            fontWeight: 600, letterSpacing: "0.06em",
          }}>{window.fmtShortPrice(t)}</div>
        ))}
      </div>

      {/* track */}
      <div
        ref={trackRef}
        onMouseDown={(e) => { setDrag(true); updateFromX(e.clientX); }}
        onTouchStart={(e) => { setDrag(true); updateFromX(e.touches[0].clientX); }}
        style={{
          position: "relative", height: 14, marginTop: 8,
          background: "var(--cream)", borderRadius: 999,
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.08)",
          cursor: locked ? "default" : "pointer",
        }}>
        {/* gradient hints at extremes */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 999, pointerEvents: "none",
          background: "linear-gradient(90deg, rgba(168,197,218,0.4) 0%, transparent 8%, transparent 92%, rgba(255,92,57,0.35) 100%)"
        }} />
        {/* tick marks */}
        {TICKS.map((t) => (
          <div key={t} style={{
            position: "absolute", left: `${valueToPos(t) * 100}%`, top: 4, bottom: 4,
            width: 1.5, background: "rgba(26,26,26,0.18)", transform: "translateX(-50%)", borderRadius: 1,
          }}/>
        ))}
        {/* fill */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: `${pct * 100}%`, background: "var(--ink)", borderRadius: 999,
          transition: drag ? "none" : "width 120ms var(--ease)",
        }}/>
        {/* thumb */}
        <div style={{
          position: "absolute", left: `${pct * 100}%`, top: "50%",
          transform: "translate(-50%, -50%)",
          width: 28, height: 28, borderRadius: 999,
          background: "var(--paper)",
          boxShadow: "0 0 0 2px var(--ink), 0 4px 12px rgba(0,0,0,0.18)",
          transition: drag ? "none" : "left 120ms var(--ease)",
        }}>
          <div style={{
            position: "absolute", inset: 6, borderRadius: 999,
            background: "var(--accent)",
          }}/>
        </div>
      </div>
    </div>
  );
}

// ─── Stat chip (for property facts) ──────────────
function Stat({ icon: Ico, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink)" }}>
      <span style={{ color: "var(--ink-mute)" }}><Ico size={16}/></span>
      <span className="tnum" style={{ fontWeight: 600, fontSize: 15 }}>{value}</span>
      <span style={{ fontSize: 12, color: "var(--ink-mute)", letterSpacing: "0.02em" }}>{label}</span>
    </div>
  );
}

// ─── Streak flame indicator ──────────────────────
function StreakFlame({ count }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 11px", borderRadius: 999,
      background: "var(--cream)", color: "var(--accent)",
      fontWeight: 700, fontSize: 13,
    }} className="tnum">
      <span style={{ animation: "flameFlicker 1.2s ease-in-out infinite", display: "inline-flex" }}>
        <Icon.Flame size={14}/>
      </span>
      {count}
    </div>
  );
}

// ─── Round counter pill ──────────────────────────
function RoundPill({ current, total }) {
  return (
    <div className="caption tnum" style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "6px 12px", borderRadius: 999,
      background: "rgba(26,26,26,0.06)", color: "var(--ink)",
      fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
    }}>
      ROUND <span>{String(current).padStart(2, "0")}</span>
      <span style={{ opacity: 0.4 }}>/</span>
      <span style={{ opacity: 0.55 }}>{String(total).padStart(2, "0")}</span>
    </div>
  );
}

window.Icon = Icon;
window.Wordmark = Wordmark;
window.NumberTicker = NumberTicker;
window.Confetti = Confetti;
window.PhotoCarousel = PhotoCarousel;
window.PriceSlider = PriceSlider;
window.Stat = Stat;
window.StreakFlame = StreakFlame;
window.RoundPill = RoundPill;
window.SLIDER_MIN = SLIDER_MIN;
window.SLIDER_MAX = SLIDER_MAX;
