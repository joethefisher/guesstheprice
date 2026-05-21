"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

const INPUT_CLASSES =
  "px-3.5 py-3 rounded-2 border-[1.5px] border-ink-15 text-base text-ink bg-[rgba(26,26,26,0.02)] outline-none focus:border-accent";

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-paper p-6">
      <div className="mb-10">
        <Wordmark size={22} />
      </div>

      <div
        className="w-full max-w-narrow bg-paper border border-ink-08 rounded-6 px-9 py-10"
        style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.06)" }}
      >
        <h1 className="display text-2xl m-0 mb-2 text-ink">
          Create account.
        </h1>
        <p className="m-0 mb-8 text-ink-55 text-base">
          Save your streak and stats across devices.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink">
              Username
            </label>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className={INPUT_CLASSES}
            />
            <span className="text-sm text-ink-quiet">
              3–20 characters · letters, numbers, underscores
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink">
              Password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className={INPUT_CLASSES}
            />
            <span className="text-sm text-ink-quiet">
              8 or more characters
            </span>
            <span className="text-sm font-medium text-flag">
              Heads up: we don't have password recovery yet — write yours down.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink">
              Confirm password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className={INPUT_CLASSES}
            />
          </div>

          {error && (
            <p className="m-0 text-sm font-medium" style={{ color: "#c0392b" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`btn btn-primary mt-2 text-base py-3.5 px-5 ${loading ? "opacity-70" : "opacity-100"}`}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-55">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-accent font-semibold no-underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
