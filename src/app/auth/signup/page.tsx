"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

export default function SignUpPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setError("That username is already taken");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      // Auto sign-in after successful signup
      const result = await signIn("credentials", { username, password, redirect: false });
      if (result?.error) {
        setError("Account created — please sign in");
        router.push("/auth/signin");
      } else {
        router.push("/");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1.5px solid rgba(26,26,26,0.15)",
    fontSize: 15,
    color: "var(--ink)",
    background: "rgba(26,26,26,0.02)",
    outline: "none",
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: "var(--paper)", padding: "24px" }}
    >
      <div style={{ marginBottom: 40 }}>
        <Wordmark size={22} />
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "var(--paper)",
          border: "1px solid rgba(26,26,26,0.1)",
          borderRadius: 20,
          padding: "40px 36px",
          boxShadow: "0 4px 32px rgba(0,0,0,0.06)",
        }}
      >
        <h1 className="display" style={{ fontSize: 32, margin: "0 0 8px", color: "var(--ink)" }}>
          Create account.
        </h1>
        <p style={{ margin: "0 0 32px", color: "rgba(26,26,26,0.55)", fontSize: 15 }}>
          Save your streak and stats across devices.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
              Username
            </label>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(26,26,26,0.15)")}
            />
            <span style={{ fontSize: 12, color: "rgba(26,26,26,0.4)" }}>
              3–20 characters · letters, numbers, underscores
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
              Password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(26,26,26,0.15)")}
            />
            <span style={{ fontSize: 12, color: "rgba(26,26,26,0.4)" }}>
              8 or more characters
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
              Confirm password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(26,26,26,0.15)")}
            />
          </div>

          {error && (
            <p style={{ margin: 0, fontSize: 13, color: "#c0392b", fontWeight: 500 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ marginTop: 8, fontSize: 15, padding: "14px 20px", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: "rgba(26,26,26,0.55)" }}>
          Already have an account?{" "}
          <Link
            href="/auth/signin"
            style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
