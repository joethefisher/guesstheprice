"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserNavPill } from "./UserNavPill";

interface Props {
  // Kept for backwards-compat with existing call sites. Signed-in trigger is
  // now a solid ink pill that reads on any background, so variant is unused;
  // the signed-out CTA is always the brand primary button.
  variant?: "dark" | "light";
}

export function UserMenu(_props: Props = {}) {
  const { data: session, status } = useSession();
  const router = useRouter();

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

  const handle = session.user.name ?? "Account";
  return <UserNavPill handle={handle} />;
}
