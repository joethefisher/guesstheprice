"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Props {
  handle: string;
}

export function UserNavPill({ handle }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Signed in as ${handle}. Open menu.`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-2.5 pr-3.5 pl-1.5 py-1.5 rounded-pill bg-ink text-paper text-[13.5px] font-semibold border-none cursor-pointer transition-colors duration-200 hover:bg-black"
        style={{ boxShadow: "0 6px 18px -10px rgba(0,0,0,0.45)" }}
      >
        <span
          aria-hidden="true"
          className="inline-flex items-center justify-center w-7 h-7 rounded-pill bg-accent overflow-hidden flex-shrink-0"
          style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)" }}
        >
          <svg width={18} height={18} viewBox="0 0 100 100" aria-hidden="true">
            <g transform="rotate(-7 50 50)">
              <path
                d="M 24 22 L 70 16 L 84 30 L 80 76 L 60 80 L 56 84 L 22 88 Z"
                fill="var(--paper)"
              />
              <circle cx={32} cy={30} r={4} fill="var(--accent)" />
              <text
                x={54}
                y={62}
                textAnchor="middle"
                fontFamily="var(--display)"
                fontWeight={700}
                fontStyle="italic"
                fontSize={46}
                fill="var(--accent)"
              >
                ?
              </text>
            </g>
          </svg>
        </span>
        <span>{handle}</span>
        <svg
          width={13}
          height={13}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-[calc(100%+8px)] right-0 min-w-[180px] bg-paper border border-ink-08 rounded-3 overflow-hidden z-[100]"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
        >
          <div className="px-3.5 py-2.5 border-b border-[rgba(26,26,26,0.06)]">
            <p className="m-0 text-sm text-ink-quiet font-medium">
              Signed in as
            </p>
            <p className="mt-0.5 mb-0 text-sm font-bold text-ink">
              @{handle}
            </p>
          </div>
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              router.push("/profile");
            }}
            className="w-full px-3.5 py-2.5 bg-transparent hover:bg-[rgba(26,26,26,0.04)] border-none text-left text-sm text-ink cursor-pointer font-medium"
          >
            My profile
          </button>
          <button
            role="menuitem"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full px-3.5 py-2.5 bg-transparent hover:bg-[rgba(26,26,26,0.04)] border-none text-left text-sm text-ink cursor-pointer font-medium border-t border-[rgba(26,26,26,0.06)]"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
