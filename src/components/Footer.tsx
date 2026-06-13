import Link from "next/link";

// Footer renders on every route via the root layout. Two jobs:
// 1. Surface a stable navigation surface for users on any page.
// 2. Spread internal-link equity from the homepage (which gets most inbound
//    crawl + traffic) to deeper pages — about, FAQ, methodology, etc.
//    Search engines weight internal links from the homepage heavily, so a
//    persistent footer link is one of the cheapest SEO wins for content pages.
export function Footer() {
  return (
    <footer className="border-t border-rule mt-16 py-10 text-ink-mute text-sm">
      <div className="mx-auto max-w-5xl px-6 grid grid-cols-2 sm:grid-cols-4 gap-8">
        <div>
          <div className="display text-ink text-base mb-3">Pricetag</div>
          <ul className="space-y-1.5">
            <li>
              <Link href="/" className="hover:text-ink">
                Home
              </Link>
            </li>
            <li>
              <Link href="/play" className="hover:text-ink">
                Play
              </Link>
            </li>
            <li>
              <Link href="/daily" className="hover:text-ink">
                Daily
              </Link>
            </li>
            <li>
              <Link href="/leaderboard" className="hover:text-ink">
                Leaderboard
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="display text-ink text-base mb-3">Learn</div>
          <ul className="space-y-1.5">
            <li>
              <Link href="/about" className="hover:text-ink">
                About
              </Link>
            </li>
            <li>
              <Link href="/how-it-works" className="hover:text-ink">
                How it works
              </Link>
            </li>
            <li>
              <Link href="/methodology" className="hover:text-ink">
                Methodology
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-ink">
                FAQ
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="display text-ink text-base mb-3">Account</div>
          <ul className="space-y-1.5">
            <li>
              <Link href="/auth/signin" className="hover:text-ink">
                Sign in
              </Link>
            </li>
            <li>
              <Link href="/auth/signup" className="hover:text-ink">
                Sign up
              </Link>
            </li>
            <li>
              <Link href="/profile" className="hover:text-ink">
                Profile
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="display text-ink text-base mb-3">More</div>
          <ul className="space-y-1.5">
            <li>
              <a
                href="https://joeking.ai"
                className="hover:text-ink"
                target="_blank"
                rel="noopener noreferrer"
              >
                joeking.ai
              </a>
            </li>
            <li>
              <a
                href="https://joeking.ai/f1-oracle"
                className="hover:text-ink"
                target="_blank"
                rel="noopener noreferrer"
              >
                F1 Oracle
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-6 mt-8 text-ink-quiet text-xs">
        &copy; {new Date().getFullYear()} Pricetag. Listings sourced from public Realtor.com data.
      </div>
    </footer>
  );
}
