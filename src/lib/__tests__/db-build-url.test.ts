import { describe, it, expect } from "vitest";
import { buildTimeDatabaseUrl } from "../db";

const PG = "postgresql://u:p%40ss@host.example.com:6543/postgres?pgbouncer=true";
const BUILD = "phase-production-build";

describe("buildTimeDatabaseUrl", () => {
  it("caps the pool during next build, keeping existing params", () => {
    const u = new URL(buildTimeDatabaseUrl(PG, BUILD)!);
    expect(u.searchParams.get("connection_limit")).toBe("2");
    expect(u.searchParams.get("pool_timeout")).toBe("60");
    expect(u.searchParams.get("pgbouncer")).toBe("true");
    expect(u.password).toBe("p%40ss");
    expect(u.host).toBe("host.example.com:6543");
  });

  it("leaves runtime and dev alone", () => {
    expect(buildTimeDatabaseUrl(PG, undefined)).toBeUndefined();
    expect(buildTimeDatabaseUrl(PG, "phase-development-server")).toBeUndefined();
    expect(buildTimeDatabaseUrl(PG, "phase-production-server")).toBeUndefined();
  });

  it("respects an explicit connection_limit and ignores non-postgres URLs", () => {
    expect(buildTimeDatabaseUrl(PG + "&connection_limit=5", BUILD)).toBeUndefined();
    expect(buildTimeDatabaseUrl("file:./dev.db", BUILD)).toBeUndefined();
    expect(buildTimeDatabaseUrl(undefined, BUILD)).toBeUndefined();
  });

  it("keeps an explicit pool_timeout", () => {
    const u = new URL(buildTimeDatabaseUrl(PG + "&pool_timeout=5", BUILD)!);
    expect(u.searchParams.get("pool_timeout")).toBe("5");
  });
});
