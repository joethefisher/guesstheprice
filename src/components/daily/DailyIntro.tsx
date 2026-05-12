"use client";

import { motion } from "framer-motion";
import { Wordmark } from "@/components/Wordmark";
import {
  StageBackground,
  SpotlightCones,
  GrainOverlay,
  BulbRow,
  DarkIconButton,
  NextDailyCountdown,
} from "./DailyShared";
import { Icon } from "@/components/Icons";

interface Props {
  dailyNumber: number;
  dateET: string;
  currentStreak: number;
  streakBroken: boolean;
  onBegin: () => void;
  onExit: () => void;
}

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.4 } },
};
const wordVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

function formatDateLabel(dateET: string): string {
  if (!dateET) return "";
  const d = new Date(dateET + "T12:00:00Z");
  return d.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  }).toUpperCase();
}

export function DailyIntro({
  dailyNumber,
  dateET,
  currentStreak,
  streakBroken,
  onBegin,
  onExit,
}: Props) {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <StageBackground />
      <SpotlightCones />
      <GrainOverlay opacity={0.35} />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          position: "absolute", top: 26, left: 36, right: 36, zIndex: 10,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}
      >
        <div style={{ filter: "invert(1) hue-rotate(180deg)" }}>
          <Wordmark size={18} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span style={{
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 12, color: "rgba(247,244,238,0.7)",
          }}>
            <span className="pulse-dot" />
            playing now
          </span>
          <DarkIconButton onClick={onExit} />
        </div>
      </motion.header>

      {/* Center stage */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 5,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "0 60px", textAlign: "center",
      }}>
        {/* Plaque + bulbs */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 26, gap: 16 }}
        >
          <div className="plaque" style={{ fontSize: 14 }}>
            <span style={{
              fontStyle: "normal", fontFamily: "var(--body)",
              fontSize: 10, letterSpacing: "0.22em", fontWeight: 700,
            }}>
              NOW OPEN
            </span>
          </div>
          <BulbRow count={14} />
        </motion.div>

        {/* Date eyebrow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="eyebrow"
          style={{ color: "rgba(255,214,107,0.85)", marginBottom: 14, letterSpacing: "0.22em" }}
        >
          DAILY #{dailyNumber}{dateET ? ` · ${formatDateLabel(dateET)}` : ""}
        </motion.div>

        {/* Headline — word-by-word stagger */}
        <motion.h1
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="display"
          style={{
            margin: 0, fontSize: "clamp(72px, 9vw, 120px)",
            color: "var(--paper)", lineHeight: 0.95,
            maxWidth: "16ch", letterSpacing: "-0.03em",
            textShadow: "0 4px 40px rgba(255,214,107,0.25)",
            display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 0.25em",
          }}
        >
          {["One", "house."].map((w, i) => (
            <motion.span key={i} variants={wordVariant}>{w}</motion.span>
          ))}
          <br style={{ width: "100%", content: '""' }} />
          {["One", "guess."].map((w, i) => (
            <motion.span
              key={`b${i}`}
              variants={wordVariant}
              style={{ color: i === 1 ? "var(--spot)" : "var(--paper)" }}
            >
              {w}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.8 }}
          style={{
            fontSize: 17, lineHeight: 1.5,
            color: "rgba(247,244,238,0.7)",
            maxWidth: "44ch", margin: "28px 0 36px",
          }}
        >
          Everyone gets the same house today. No do-overs.
          See how close you land and where you rank.
        </motion.p>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.9 }}
          className="btn"
          onClick={onBegin}
          style={{
            background: "var(--accent)", color: "#fff",
            padding: "24px 40px", fontSize: 18, borderRadius: 16,
            boxShadow: "0 1px 0 rgba(255,255,255,0.3) inset, 0 20px 50px -10px rgba(255,92,57,0.6)",
            display: "inline-flex", alignItems: "center", gap: 12,
          }}
        >
          Open today's listing
          <Icon.Arrow size={20} />
        </motion.button>

        {/* Streak + countdown footer strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 1.0 }}
          style={{
            display: "flex", alignItems: "center", gap: 28,
            marginTop: 38, color: "rgba(247,244,238,0.7)", fontSize: 13,
          }}
        >
          {currentStreak > 0 && (
            <>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon.Flame size={14} />
                <span style={{ color: "var(--paper)", fontWeight: 700 }} className="tnum">
                  {currentStreak}
                </span>
                <span>day streak</span>
              </span>
              <span style={{ width: 1, height: 14, background: "rgba(247,244,238,0.2)" }} />
            </>
          )}
          {streakBroken && (
            <span style={{ color: "rgba(255,92,57,0.85)" }}>
              Streak reset — missed a day
            </span>
          )}
          <span>
            Next house in{" "}
            <span style={{ color: "var(--paper)", fontFamily: "var(--mono)", fontWeight: 700 }}>
              <NextDailyCountdown size={13} color="var(--paper)" />
            </span>
          </span>
        </motion.div>
      </div>

      {/* Footer marquee strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 1.1 }}
        style={{
          position: "absolute", bottom: 24, left: 36, right: 36, zIndex: 10,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 22px", borderRadius: 12,
          background: "rgba(247,244,238,0.06)", backdropFilter: "blur(12px)",
          color: "rgba(247,244,238,0.75)", fontSize: 12,
          boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.08)",
        }}
      >
        <span>One guess. No do-overs. Resets at midnight Eastern.</span>
        <span style={{ color: "rgba(247,244,238,0.4)" }}>·</span>
        <span>Same house for everyone, everywhere.</span>
      </motion.div>
    </div>
  );
}
