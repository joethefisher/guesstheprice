import * as Sentry from "@sentry/nextjs";

// Client-side events shouldn't ship request bodies or cookies to Sentry —
// see instrumentation.ts for the full rationale.
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

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: false,
  beforeSend: scrubRequest,
  beforeSendTransaction: scrubRequest,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
