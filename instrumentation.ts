/**
 * Sentry server + edge init.
 *
 * tracesSampleRate=0.1 means roughly 10% of requests get a full transaction
 * captured. /api/score payloads carry `gameId`, which acts as a bearer
 * token for anonymous round writes (see src/app/api/score/route.ts) — and
 * cookies/headers leak the NextAuth session token. Both `beforeSendTransaction`
 * and `beforeSend` (error events) strip request data + cookies + headers so
 * Sentry org members can't read those off captured events even if the org or
 * a token is compromised.
 */
type ScrubbableEvent = {
  request?: {
    data?: unknown;
    cookies?: unknown;
    headers?: unknown;
  };
};

function scrubRequest<E extends ScrubbableEvent | null>(event: E): E {
  if (event && event.request) {
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.headers;
  }
  return event;
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { init } = await import("@sentry/nextjs");
    init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
      debug: false,
      beforeSend: scrubRequest,
      beforeSendTransaction: scrubRequest,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    const { init } = await import("@sentry/nextjs");
    init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
      debug: false,
      beforeSend: scrubRequest,
      beforeSendTransaction: scrubRequest,
    });
  }
}
