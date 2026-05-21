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
    <div className="min-h-screen flex flex-col items-center justify-center bg-paper p-6">
      <div className="mb-10">
        <Wordmark size={22} />
      </div>

      <div
        className="w-full max-w-narrow bg-paper border border-ink-08 rounded-6 px-9 py-10"
        style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.06)" }}
      >
        <h1 className="display text-2xl m-0 mb-2 text-ink">
          Welcome back.
        </h1>
        <p className="m-0 mb-8 text-ink-55 text-base">
          Sign in to keep your streak alive.
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
              className="px-3.5 py-3 rounded-2 border-[1.5px] border-ink-15 text-base text-ink bg-[rgba(26,26,26,0.02)] outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="px-3.5 py-3 rounded-2 border-[1.5px] border-ink-15 text-base text-ink bg-[rgba(26,26,26,0.02)] outline-none focus:border-accent"
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
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-55">
          New here?{" "}
          <Link href="/auth/signup" className="text-accent font-semibold no-underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
