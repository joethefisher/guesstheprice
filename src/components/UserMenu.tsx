"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Props {
  variant?: "dark" | "light";
}

export function UserMenu({ variant = "light" }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const textColor = variant === "dark" ? "var(--paper)" : "var(--ink)";
  const borderColor = variant === "dark" ? "rgba(247,244,238,0.2)" : "rgba(26,26,26,0.15)";

  if (status === "loading") {
    return <div style={{ width: 72, height: 36 }} />;
  }

  if (!session) {
    return (
      <button
        className="btn btn-primary"
        style={{ padding: "10px 18px", fontSize: "var(--text-sm)" }}
        onClick={() => router.push("/auth/signin")}
      >
        Sign in
      </button>
    );
  }

  const username = session.user.name ?? "Account";

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 14px",
          borderRadius: 20,
          border: `1px solid ${borderColor}`,
          background: "transparent",
          cursor: "pointer",
          fontSize: "var(--text-sm)",
          fontWeight: 600,
          color: textColor,
          transition: "opacity 0.15s",
        }}
      >
        <span style={{ opacity: 0.55, fontWeight: 400 }}>@</span>
        {username}
        <svg
          width={10}
          height={10}
          viewBox="0 0 10 10"
          fill="none"
          style={{ opacity: 0.5, marginLeft: 2, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
        >
          <path d="M1.5 3.5L5 7L8.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            minWidth: 160,
            background: "var(--paper)",
            border: "1px solid rgba(26,26,26,0.1)",
            borderRadius: 14,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            overflow: "hidden",
            zIndex: 100,
          }}
        >
          <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(26,26,26,0.06)" }}>
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "rgba(26,26,26,0.4)", fontWeight: 500 }}>Signed in as</p>
            <p style={{ margin: "2px 0 0", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink)" }}>@{username}</p>
          </div>
          <button
            onClick={() => { setOpen(false); router.push("/profile"); }}
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
            onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = "rgba(26,26,26,0.04)")}
            onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = "none")}
          >
            My profile
          </button>
          <button
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
            onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = "rgba(26,26,26,0.04)")}
            onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = "none")}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
