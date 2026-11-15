import { describe, it, expect } from "vitest";
import { acceptsMarkdown, htmlToAgentMarkdown, isMarkdownPath } from "../agent-markdown";

const page = (body: string, head = "") =>
  `<!doctype html><html><head><title>T — Pricetag</title>
   <meta name="description" content='Say "hi"'>${head}</head><body>${body}</body></html>`;

describe("isMarkdownPath", () => {
  it("allows content pages", () => {
    for (const p of ["/", "/about", "/how-it-works", "/methodology", "/faq", "/cities", "/cities/co/denver"]) {
      expect(isMarkdownPath(p)).toBe(true);
    }
  });
  it("rejects game, account and API routes", () => {
    for (const p of ["/play", "/daily", "/profile", "/saved", "/api/score", "/about/x", "/cities/../api", "/md"]) {
      expect(isMarkdownPath(p)).toBe(false);
    }
  });
});

describe("acceptsMarkdown", () => {
  it("accepts markdown unless refused with q=0", () => {
    expect(acceptsMarkdown("text/markdown")).toBe(true);
    expect(acceptsMarkdown("TEXT/Markdown, text/html;q=0.9")).toBe(true);
    expect(acceptsMarkdown("text/markdown;q=0.5")).toBe(true);
    expect(acceptsMarkdown("text/markdown;q=0")).toBe(false);
    expect(acceptsMarkdown("text/markdown; q=0.0, text/html")).toBe(false);
    expect(acceptsMarkdown("text/html,*/*;q=0.8")).toBe(false);
    expect(acceptsMarkdown(null)).toBe(false);
  });
});

describe("htmlToAgentMarkdown", () => {
  it("emits frontmatter with escaped values and the canonical url", () => {
    const { markdown } = htmlToAgentMarkdown(page("<main><h1>Hi</h1></main>"), "https://guesstheprice.ai/about");
    expect(markdown.startsWith('---\ntitle: "T — Pricetag"\ndescription: "Say \\"hi\\""\nurl: "https://guesstheprice.ai/about"\n---\n')).toBe(true);
    expect(markdown).toContain("# Hi");
  });

  it("uses <main>, drops scripts/nav, and appends the footer links", () => {
    const { markdown } = htmlToAgentMarkdown(
      page(`<header><nav>NAVTEXT</nav></header><main><p>Body</p><script>evil()</script></main>
            <footer><a href="/faq">FAQ</a></footer>`),
      "https://guesstheprice.ai/about",
    );
    expect(markdown).toContain("Body");
    expect(markdown).not.toContain("NAVTEXT");
    expect(markdown).not.toContain("evil");
    expect(markdown).toContain("[FAQ](https://guesstheprice.ai/faq)");
  });

  it("makes links absolute and unwraps next/image urls", () => {
    const { markdown } = htmlToAgentMarkdown(
      page(`<main><a href="/daily">Daily</a>
            <img alt="house" src="/_next/image?url=https%3A%2F%2Fphotos.guesstheprice.ai%2Fa.jpg&w=640&q=75"></main>`),
      "https://guesstheprice.ai/",
    );
    expect(markdown).toContain("[Daily](https://guesstheprice.ai/daily)");
    expect(markdown).toContain("![house](https://photos.guesstheprice.ai/a.jpg)");
  });

  it("separates touching sibling elements but not inline formatting", () => {
    const { markdown } = htmlToAgentMarkdown(
      page(`<main><a href="/c"><span>Denver, CO</span><span>180 homes</span></a>
            <p>@joe<span>290</span></p><p><strong>90%+</strong><em>wow</em></p></main>`),
      "https://guesstheprice.ai/cities",
    );
    expect(markdown).toContain("Denver, CO 180 homes");
    expect(markdown).toContain("@joe 290");
    expect(markdown).toContain("**90%+**_wow_");
  });

  it("reports a token estimate", () => {
    const { markdown, tokens } = htmlToAgentMarkdown(page("<main>x</main>"), "https://guesstheprice.ai/");
    expect(tokens).toBe(Math.ceil(markdown.length / 4));
  });
});
