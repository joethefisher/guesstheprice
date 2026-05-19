"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get("callbackUrl") ?? "/";
  // Only allow relative paths — block protocol-relative (//) and absolute URLs
  const callbackUrl = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid username or password");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: "var(--paper)", padding: "24px" }}
    >
 <div className="mb-10">
        <Wordmark size={22} />
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: "var(--w-narrow)",
          background: "var(--paper)",
          border: "1px solid rgba(26,26,26,0.1)",
          borderRadius: 20,
          padding: "40px 36px",
          boxShadow: "0 4px 32px rgba(0,0,0,0.06)",
        }}
      >
        <h1
          className="display"
          style={{ fontSize: "var(--text-2xl)", margin: "0 0 8px", color: "var(--ink)" }}
        >
          Welcome back.
        </h1>
        <p style={{ margin: "0 0 32px", color: "rgba(26,26,26,0.55)", fontSize: "var(--text-base)" }}>
          Sign in to keep your streak alive.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink)" }}>
              Username
            </label>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1.5px solid rgba(26,26,26,0.15)",
                fontSize: "var(--text-base)",
                color: "var(--ink)",
                background: "rgba(26,26,26,0.02)",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(26,26,26,0.15)")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink)" }}>
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1.5px solid rgba(26,26,26,0.15)",
                fontSize: "var(--text-base)",
                color: "var(--ink)",
                background: "rgba(26,26,26,0.02)",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(26,26,26,0.15)")}
            />
          </div>

          {error && (
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "#c0392b", fontWeight: 500 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ marginTop: 8, fontSize: "var(--text-base)", padding: "14px 20px", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: "center", fontSize: "var(--text-sm)", color: "rgba(26,26,26,0.55)" }}>
          New here?{" "}
          <Link
            href="/auth/signup"
            style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
