"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Confetti } from "@/components/Confetti";
import { milestoneHeadline } from "@/lib/daily/service";
import {
  StageBackground,
  SpotlightCones,
  GrainOverlay,
} from "./DailyShared";

interface Props {
  threshold: number;
  streak: number;
  avgAccuracy: number;
  onContinue: () => void;
}

const MILESTONE_SUBHEAD: Record<number, string> = {
  7:   "A full week without missing a single one. You're consistent.",
  30:  "Thirty consecutive days. That's not a habit — that's a discipline.",
  50:  "Fifty days. You're in genuinely rare company now.",
  100: "A hundred days straight. This is exceptional. Truly.",
  365: "Three hundred and sixty-five days. One entire year. We didn't think this was possible.",
};

function getMedalColor(threshold: number): string {
  if (threshold >= 365) return "radial-gradient(circle at 30% 30%, #C0E0FF 0%, #4A90D9 35%, #1E4D8C 80%)"; // platinum/blue
  if (threshold >= 100) return "radial-gradient(circle at 30% 30%, #FFE89A 0%, #C8A348 35%, #8C7022 80%)"; // gold
  if (threshold >= 50)  return "radial-gradient(circle at 30% 30%, #E8E8E8 0%, #B0B0B0 35%, #707070 80%)"; // silver
  return "radial-gradient(circle at 30% 30%, #FFD6B0 0%, #C8894A 35%, #8C5022 80%)"; // bronze
}

function getMedalGlow(threshold: number): string {
  if (threshold >= 365) return "0 12px 30px -8px rgba(74,144,217,0.7)";
  if (threshold >= 100) return "0 12px 30px -8px rgba(200,163,72,0.7)";
  if (threshold >= 50)  return "0 12px 30px -8px rgba(160,160,160,0.5)";
  return "0 12px 30px -8px rgba(200,137,74,0.6)";
}

export function DailyMilestone({ threshold, streak, avgAccuracy, onContinue }: Props) {
  const [fired, setFired] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFired(true), 300);
    return () => clearTimeout(t);
  }, []);

  const headline = milestoneHeadline(threshold);
  const subhead = MILESTONE_SUBHEAD[threshold] ?? `${threshold} days in a row.`;
  const medalBg = getMedalColor(threshold);
  const medalGlow = getMedalGlow(threshold);

  return (
    <div className="relative w-full h-full overflow-hidden text-paper">
      <StageBackground />
      <SpotlightCones />
      <GrainOverlay opacity={0.3} />

      {fired && <Confetti fire count={120} />}

      {/* Center content */}
      <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center px-[60px] py-20 text-center">
        {/* Medal */}
        <motion.div className="mb-8"
          initial={{ scale: 0, rotate: -20, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 350, damping: 14, delay: 0.1 }}
        >
          <div
            className="w-[100px] h-[100px] rounded-full grid place-items-center text-3xl"
            style={{
              background: medalBg,
              boxShadow: `inset 0 -6px 14px rgba(0,0,0,0.25), inset 0 4px 8px rgba(255,255,255,0.45), ${medalGlow}`,
            }}
          >
            {threshold >= 365 ? "🌟" : threshold >= 100 ? "🏆" : threshold >= 50 ? "🥈" : "🔥"}
          </div>
          {/* Ribbon */}
          <div
            className="w-2 h-8 mx-auto"
            style={{ background: "linear-gradient(180deg, rgba(200,163,72,0.8) 0%, rgba(140,112,34,0.6) 100%)" }}
          />
          <div className="w-[60px] h-2 rounded-[4px] mx-auto bg-[rgba(200,163,72,0.6)]" />
        </motion.div>

        {/* Milestone label */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="px-4 py-1.5 rounded-pill mb-5 bg-[rgba(255,214,107,0.15)] text-xs font-bold tracking-[0.2em] text-spot"
          style={{ boxShadow: "inset 0 0 0 1px rgba(255,214,107,0.35)" }}
        >
          {threshold}-DAY MILESTONE
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="display m-0 mb-[18px] leading-[0.95] tracking-[-0.03em] text-paper max-w-[14ch]"
          style={{
            fontSize: "clamp(56px, 7vw, 96px)",
            textShadow: "0 4px 40px rgba(255,214,107,0.2)",
          }}
        >
          {headline}
        </motion.h1>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="text-md leading-[1.55] text-paper-80 max-w-[42ch] m-0 mb-9"
        >
          {subhead}
        </motion.p>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.9 }}
          className="flex gap-px bg-paper-08 rounded-3 overflow-hidden mb-9"
        >
          {[
            { label: "STREAK", value: String(streak), sub: "days 🔥", tone: "var(--accent)" },
            { label: "AVG ACCURACY", value: `${avgAccuracy}%`, tone: "var(--spot)" },
          ].map((m, i) => (
            <div
              key={i}
              className="py-[18px] px-9 text-center"
              style={{ background: "rgba(15,17,13,0.6)" }}
            >
              <div className="eyebrow text-paper-40 mb-2 text-xs">
                {m.label}
              </div>
              <div className="display tnum text-3xl leading-none tracking-[-0.025em]" style={{ color: m.tone }}>
                {m.value}
              </div>
              {m.sub && (
                <div className="text-paper-40 text-sm mt-1">
                  {m.sub}
                </div>
              )}
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 1.1 }}
          className="btn btn-primary py-[22px] px-11 text-md rounded-4"
          onClick={onContinue}
          style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 20px 50px -10px rgba(255,92,57,0.6)" }}
        >
          See full stats →
        </motion.button>
      </div>
    </div>
  );
}
