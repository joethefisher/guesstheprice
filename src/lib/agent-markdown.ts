/**
 * Markdown for Agents — HTML → markdown conversion.
 *
 * Requests that send `Accept: text/markdown` to a content page are
 * rewritten (next.config.js) to /md/<path>, which fetches the page's
 * normal HTML and runs it through `htmlToAgentMarkdown`. Converting the
 * live HTML (instead of hand-writing markdown copies) means the two can
 * never drift, and the markdown can never expose anything the public
 * HTML doesn't already show — important for a game whose answers
 * (sold price, exact address) must stay hidden.
 */

import { parse, NodeType, type HTMLElement } from "node-html-parser";
import { NodeHtmlMarkdown } from "node-html-markdown";

/**
 * Pages that get a markdown representation. Content/marketing pages
 * only — the game routes are interactive shells with nothing useful to
 * an agent. Matched against the pathname (no trailing slash).
 */
const MARKDOWN_PATHS: RegExp[] = [
  /^\/$/,
  /^\/(about|how-it-works|methodology|faq)$/,
  /^\/cities(\/[a-z0-9-]+){0,4}$/,
];

/**
 * True unless the Accept header explicitly refuses markdown with q=0
 * (RFC 9110: "not acceptable"). The rewrite already required that
 * text/markdown appears at all.
 */
export function acceptsMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  return accept.split(",").some((part) => {
    const [type, ...params] = part.trim().toLowerCase().split(";").map((s) => s.trim());
    if (type !== "text/markdown") return false;
    const q = params.find((p) => p.startsWith("q="));
    return !q || Number(q.slice(2)) > 0;
  });
}

export function isMarkdownPath(pathname: string): boolean {
  return MARKDOWN_PATHS.some((re) => re.test(pathname));
}

// Chrome that isn't page content: the site header/nav and anything that
// renders nothing as text. The global footer is kept (it sits outside
// <main>, so it only survives on pages without one — i.e. the landing
// page, where its link list is the useful site map for an agent).
const STRIP_SELECTORS = [
  "script",
  "style",
  "noscript",
  "template",
  "svg",
  "iframe",
  "header",
  "nav",
  "[aria-hidden=true]",
];

// Inline formatting tags that legitimately abut each other or text
// ("<strong>a</strong><em>b</em>") — everything else gets a separating
// space when it touches a sibling element (see separateSiblings).
const INLINE_FORMATTING = new Set(["STRONG", "EM", "B", "I", "U", "CODE", "SUP", "SUB", "SMALL", "MARK", "BR"]);

const nhm = new NodeHtmlMarkdown({ bulletMarker: "-", maxConsecutiveNewlines: 2 });

function meta(root: HTMLElement, selector: string): string | null {
  const v = root.querySelector(selector)?.getAttribute("content")?.trim();
  return v ? v : null;
}

/** YAML-safe scalar: always double-quote, escape backslashes and quotes. */
function yamlString(s: string): string {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\s+/g, " ")}"`;
}

/**
 * Agents may read the markdown with no base URL, so make every link and
 * image absolute. Next's image-optimizer URLs (/_next/image?url=…) are
 * unwrapped to the original image.
 */
function absolutizeUrls(el: HTMLElement, base: string) {
  for (const a of el.querySelectorAll("a[href]")) {
    const href = a.getAttribute("href")!;
    try {
      a.setAttribute("href", new URL(href, base).toString());
    } catch {
      /* leave malformed hrefs as-is */
    }
  }
  for (const img of el.querySelectorAll("img[src]")) {
    try {
      const u = new URL(img.getAttribute("src")!, base);
      const original = u.pathname === "/_next/image" ? u.searchParams.get("url") : null;
      img.setAttribute("src", original ? new URL(original, base).toString() : u.toString());
    } catch {
      /* leave malformed srcs as-is */
    }
  }
}

/**
 * Layouts often put text in sibling elements with no whitespace between
 * them (flex rows: <span>Denver, CO</span><span>180 homes</span>), which
 * the converter would glue into "Denver, CO180 homes". Insert a space
 * between touching sibling elements; markdown collapses any extras.
 */
function separateSiblings(el: HTMLElement) {
  for (const child of el.querySelectorAll("*")) {
    // Text glued to a following element: "@joe<span>290</span>".
    const prev = child.previousSibling;
    if (
      prev?.nodeType === NodeType.TEXT_NODE &&
      /\S$/.test(prev.rawText) &&
      !INLINE_FORMATTING.has(child.tagName) &&
      child.tagName !== "A"
    ) {
      child.insertAdjacentHTML("beforebegin", " ");
    }
    const next = child.nextSibling;
    if (
      next?.nodeType === NodeType.ELEMENT_NODE &&
      !INLINE_FORMATTING.has(child.tagName) &&
      !INLINE_FORMATTING.has((next as HTMLElement).tagName)
    ) {
      child.insertAdjacentHTML("afterend", " ");
    }
  }
}

export interface AgentMarkdown {
  markdown: string;
  /** Rough token estimate (~4 chars/token) for the x-markdown-tokens header. */
  tokens: number;
}

/**
 * Convert a rendered page to agent-friendly markdown: YAML frontmatter
 * (title / description / image / url, mirroring Cloudflare's format),
 * then the page's <main> content (or <body> minus site chrome when the
 * page has no <main>, e.g. the landing page).
 */
export function htmlToAgentMarkdown(html: string, canonicalUrl: string): AgentMarkdown {
  const root = parse(html);

  const title =
    root.querySelector("title")?.text.trim() ||
    meta(root, 'meta[property="og:title"]');
  const description =
    meta(root, 'meta[name="description"]') ?? meta(root, 'meta[property="og:description"]');
  const image = meta(root, 'meta[property="og:image"]');

  const main = root.querySelector("main");
  const content = main ?? root.querySelector("body") ?? root;
  for (const sel of STRIP_SELECTORS) {
    for (const el of content.querySelectorAll(sel)) el.remove();
  }
  absolutizeUrls(content, canonicalUrl);
  separateSiblings(content);

  let body = nhm.translate(content.innerHTML).trim();
  // Pages with a <main> lose the footer with the rest of the layout
  // chrome; on those the footer's site links are still worth having.
  if (main) {
    // The site footer specifically (a direct child of <body>), not an
    // article <footer> that might live inside <main>.
    const footer = root.querySelector("body > footer");
    if (footer) {
      absolutizeUrls(footer, canonicalUrl);
      separateSiblings(footer);
      body += "\n\n---\n\n" + nhm.translate(footer.innerHTML).trim();
    }
  }

  const fm = ["---"];
  if (title) fm.push(`title: ${yamlString(title)}`);
  if (description) fm.push(`description: ${yamlString(description)}`);
  if (image) fm.push(`image: ${yamlString(image)}`);
  fm.push(`url: ${yamlString(canonicalUrl)}`);
  fm.push("---");

  const markdown = `${fm.join("\n")}\n\n${body}\n`;
  return { markdown, tokens: Math.ceil(markdown.length / 4) };
}
