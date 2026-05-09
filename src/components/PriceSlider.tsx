"use client";

import { useState, useEffect } from "react";
import { formatPrice } from "@/lib/scoring";

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

// Logarithmic mapping: slider 0-1000 → dollars MIN to MAX
// This gives finer-grained control at lower prices where most of the action is.
const SLIDER_RANGE = 1000;

function sliderToPrice(slider: number, min: number, max: number): number {
  const ratio = slider / SLIDER_RANGE;
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  const logVal = logMin + ratio * (logMax - logMin);
  const raw = Math.pow(10, logVal);
  // Snap to sensible increments based on magnitude
  if (raw < 100_000) return Math.round(raw / 1_000) * 1_000;
  if (raw < 1_000_000) return Math.round(raw / 5_000) * 5_000;
  if (raw < 5_000_000) return Math.round(raw / 25_000) * 25_000;
  return Math.round(raw / 100_000) * 100_000;
}

function priceToSlider(price: number, min: number, max: number): number {
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  const logVal = Math.log10(Math.max(min, Math.min(max, price)));
  return ((logVal - logMin) / (logMax - logMin)) * SLIDER_RANGE;
}

const TICK_MARKS = [100_000, 250_000, 500_000, 1_000_000, 2_500_000, 5_000_000, 10_000_000];

export function PriceSlider({
  value,
  onChange,
  min = 50_000,
  max = 20_000_000,
  disabled = false
}: Props) {
  const [sliderPos, setSliderPos] = useState(() => priceToSlider(value, min, max));
  const [manualMode, setManualMode] = useState(false);
  const [manualText, setManualText] = useState(value.toString());

  useEffect(() => {
    if (!manualMode) {
      setSliderPos(priceToSlider(value, min, max));
    }
  }, [value, min, max, manualMode]);

  function handleSlider(e: React.ChangeEvent<HTMLInputElement>) {
    const pos = parseFloat(e.target.value);
    setSliderPos(pos);
    const price = sliderToPrice(pos, min, max);
    onChange(price);
  }

  function handleManualChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setManualText(raw);
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num >= min && num <= max) {
      onChange(num);
    }
  }

  return (
    <div className="space-y-6">
      {/* Display value */}
      <div className="text-center">
        <p className="caption text-ink/50 mb-2">Your guess</p>
        {!manualMode ? (
          <div
            className={`font-display text-display-l md:text-display-xl font-semibold tnum tracking-tight ${
              disabled ? "text-ink/40" : "text-ink"
            }`}
          >
            {formatPrice(value)}
          </div>
        ) : (
          <div className="flex items-baseline justify-center gap-1">
            <span className="font-display text-display-l font-semibold text-ink">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={manualText}
              onChange={handleManualChange}
              autoFocus
              disabled={disabled}
              className="font-display text-display-l font-semibold tnum tracking-tight bg-transparent border-b-2 border-ink outline-none w-[280px] text-center"
            />
          </div>
        )}
      </div>

      {/* Slider */}
      {!manualMode && (
        <div className="space-y-3">
          <input
            type="range"
            min={0}
            max={SLIDER_RANGE}
            value={sliderPos}
            onChange={handleSlider}
            disabled={disabled}
            className="price-slider"
            aria-label="Price guess"
            aria-valuetext={formatPrice(value)}
          />

          {/* Tick marks with labels */}
          <div className="relative h-6">
            {TICK_MARKS.map((tick) => {
              const pos = (priceToSlider(tick, min, max) / SLIDER_RANGE) * 100;
              return (
                <div
                  key={tick}
                  className="absolute text-[10px] font-semibold text-ink/40 tnum -translate-x-1/2"
                  style={{ left: `${pos}%` }}
                >
                  {tick >= 1_000_000 ? `$${tick / 1_000_000}M` : `$${tick / 1_000}K`}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => {
            setManualMode((m) => !m);
            setManualText(value.toString());
          }}
          disabled={disabled}
          className="caption text-ink/50 hover:text-ink transition-colors underline underline-offset-4"
        >
          {manualMode ? "Use slider" : "Type a number"}
        </button>
      </div>
    </div>
  );
}
