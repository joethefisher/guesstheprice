import { NextRequest } from "next/server";
import { acceptsMarkdown, htmlToAgentMarkdown, isMarkdownPath } from "@/lib/agent-markdown";

/**
 * Markdown for Agents endpoint. Not linked anywhere: requests carrying
 * `Accept: text/markdown` to a content page are rewritten here by
 * next.config.js, so agents get markdown at the page's own URL while
 * browsers keep getting HTML. See src/lib/agent-markdown.ts.
 */

const SITE = "https://guesstheprice.ai";

// Matches robots.txt — the per-response form of the same content signals.
const CONTENT_SIGNAL = "search=yes, ai-input=yes, ai-train=no";

function plain(status: number, text: string) {
  return new Response(text, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await params;
  const pathname = "/" + (path ?? []).join("/");

  // Allow-list: only content pages, so this can't be pointed at the
  // game/API routes or turned into a general-purpose fetcher.
  if (!isMarkdownPath(pathname)) return plain(404, "Not found\n");

  // Fetch the page's normal HTML from ourselves. Accept: text/html keeps
  // the request off the markdown rewrite, so this can't loop.
  // On Vercel deployments behind Deployment Protection (previews,
  // *.vercel.app) the self-fetch would get a 401; the automation bypass
  // secret, when configured, lets it through. No-op on the custom domain.
  const fetchHeaders: Record<string, string> = { Accept: "text/html" };
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (bypass) fetchHeaders["x-vercel-protection-bypass"] = bypass;

  let upstream: Response;
  try {
    upstream = await fetch(new URL(pathname, req.nextUrl.origin), {
      headers: fetchHeaders,
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    return plain(502, "Upstream page unavailable\n");
  }
  if (upstream.status !== 200) {
    return plain(upstream.status === 404 ? 404 : 502, upstream.status === 404 ? "Not found\n" : "Upstream page unavailable\n");
  }

  const html = await upstream.text();

  // The rewrite matched on "text/markdown" appearing at all; an explicit
  // q=0 refusal gets the normal HTML instead.
  if (!acceptsMarkdown(req.headers.get("accept"))) {
    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8", Vary: "Accept", "Cache-Control": "no-store" },
    });
  }

  const canonical = SITE + (pathname === "/" ? "" : pathname);
  const { markdown, tokens } = htmlToAgentMarkdown(html, canonical);

  return new Response(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
      "x-markdown-tokens": String(tokens),
      "Content-Signal": CONTENT_SIGNAL,
      Link: `<${canonical}>; rel="canonical"`,
      // CDN-cache briefly; content pages change rarely. The homepage's
      // live stats are ISR'd at 60s anyway.
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
