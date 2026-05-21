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
    <div className="relative w-full h-full overflow-hidden">
      <StageBackground />
      <SpotlightCones />
      <GrainOverlay opacity={0.35} />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="absolute top-[26px] left-9 right-9 z-10 flex justify-between items-center"
      >
        <div style={{ filter: "invert(1) hue-rotate(180deg)" }}>
          <Wordmark size={18} />
        </div>
        <div className="flex items-center gap-[18px]">
          <span className="flex items-center gap-2 text-sm text-paper-80">
            <span className="pulse-dot" />
            playing now
          </span>
          <DarkIconButton onClick={onExit} />
        </div>
      </motion.header>

      {/* Center stage */}
      <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center px-[60px] text-center">
        {/* Plaque + bulbs */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center mb-[26px] gap-4"
        >
          <div className="plaque text-sm">
            <span className="not-italic font-sans text-xs tracking-[0.22em] font-bold">
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
          className="eyebrow mb-3.5 tracking-[0.22em]"
          style={{ color: "rgba(255,214,107,0.85)" }}
        >
          DAILY #{dailyNumber}{dateET ? ` · ${formatDateLabel(dateET)}` : ""}
        </motion.div>

        {/* Headline — word-by-word stagger */}
        <motion.h1
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="display m-0 text-paper leading-[0.95] max-w-[16ch] tracking-[-0.03em] flex flex-wrap justify-center"
          style={{
            fontSize: "clamp(72px, 9vw, 120px)",
            textShadow: "0 4px 40px rgba(255,214,107,0.25)",
            gap: "0 0.25em",
          }}
        >
          {["One", "house."].map((w, i) => (
            <motion.span key={i} variants={wordVariant}>{w}</motion.span>
          ))}
          <br className="w-full" />
          {["One", "guess."].map((w, i) => (
            <motion.span
              key={`b${i}`}
              variants={wordVariant}
              className={i === 1 ? "text-spot" : "text-paper"}
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
          className="text-md leading-[1.5] text-paper-80 max-w-[44ch] mt-7 mb-9"
        >
          Everyone gets the same house today. No do-overs.
          See how close you land and where you rank.
        </motion.p>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.9 }}
          className="btn bg-accent text-white py-6 px-10 text-md rounded-4 inline-flex items-center gap-3"
          onClick={onBegin}
          style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.3) inset, 0 20px 50px -10px rgba(255,92,57,0.6)" }}
        >
          Open today's listing
          <Icon.Arrow size={20} />
        </motion.button>

        {/* Streak + countdown footer strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 1.0 }}
          className="flex items-center gap-7 mt-[38px] text-paper-80 text-sm"
        >
          {currentStreak > 0 && (
            <>
              <span className="flex items-center gap-2">
                <Icon.Flame size={14} />
                <span className="text-paper font-bold tnum">
                  {currentStreak}
                </span>
                <span>day streak</span>
              </span>
              <span className="w-px h-3.5 bg-paper-20" />
            </>
          )}
          {streakBroken && (
            <span style={{ color: "rgba(255,92,57,0.85)" }}>
              Streak reset — missed a day
            </span>
          )}
          <span>
            Next house in{" "}
            <span className="text-paper font-mono font-bold">
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
        className="absolute bottom-6 left-9 right-9 z-10 flex justify-between items-center px-[22px] py-3.5 rounded-2 bg-paper-08 text-paper-95 text-sm"
        style={{
          backdropFilter: "blur(12px)",
          boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.08)",
        }}
      >
        <span>One guess. No do-overs. Resets at midnight Eastern.</span>
        <span className="text-paper-40">·</span>
        <span>Same house for everyone, everywhere.</span>
      </motion.div>
    </div>
  );
}
