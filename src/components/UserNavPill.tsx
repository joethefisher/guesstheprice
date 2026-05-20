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
  const [hover, setHover] = useState(false);
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
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-label={`Signed in as ${handle}. Open menu.`}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "6px 14px 6px 6px",
          borderRadius: 999,
          background: hover ? "#000" : "var(--ink)",
          color: "var(--paper)",
          fontSize: 13.5,
          fontWeight: 600,
          boxShadow: "0 6px 18px -10px rgba(0,0,0,0.45)",
          border: "none",
          cursor: "pointer",
          transition: "background 200ms var(--ease)",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: 999,
            background: "var(--accent)",
            overflow: "hidden",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)",
            flexShrink: 0,
          }}
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
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 180ms var(--ease)",
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            minWidth: 180,
            background: "var(--paper)",
            border: "1px solid rgba(26,26,26,0.1)",
            borderRadius: 14,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            overflow: "hidden",
            zIndex: 100,
          }}
        >
          <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(26,26,26,0.06)" }}>
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "rgba(26,26,26,0.4)", fontWeight: 500 }}>
              Signed in as
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink)" }}>
              @{handle}
            </p>
          </div>
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              router.push("/profile");
            }}
            style={{
              width: "100%",
              padding: "11px 14px",
              background: "none",
              border: "none",
              textAlign: "left",
              fontSize: "var(--text-sm)",
              color: "var(--ink)",
              cursor: "pointer",
              fontWeight: 500,
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(26,26,26,0.04)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "none")}
          >
            My profile
          </button>
          <button
            role="menuitem"
            onClick={() => signOut({ callbackUrl: "/" })}
            style={{
              width: "100%",
              padding: "11px 14px",
              background: "none",
              border: "none",
              textAlign: "left",
              fontSize: "var(--text-sm)",
              color: "var(--ink)",
              cursor: "pointer",
              fontWeight: 500,
              borderTop: "1px solid rgba(26,26,26,0.06)",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(26,26,26,0.04)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "none")}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
