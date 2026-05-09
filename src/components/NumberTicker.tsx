"use client";

import { useEffect, useState } from "react";

interface Props {
  value: number;
  duration?: number;
  prefix?: string;
  className?: string;
  onDone?: () => void;
}

export function NumberTicker({ value, duration = 1100, prefix = "$", className = "", onDone }: Props) {
  const [n, setN] = useState(0);

  useEffect(() => {
    let raf: number;
    let start: number | null = null;

    function step(ts: number) {
      if (!start) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(value * eased));
      if (t < 1) {
        raf = requestAnimationFrame(step);
      } else {
        onDone?.();
      }
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, onDone]);

  return (
    <span className={`tnum ${className}`} aria-live="polite">
      {prefix}{n.toLocaleString("en-US")}
    </span>
  );
}
