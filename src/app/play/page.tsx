import { fetchOneListing } from "@/lib/listing-fetch";
import PlayClient from "./PlayClient";

export const dynamic = "force-dynamic";

/**
 * /play renders as a server component so round 1 ships inline in the HTML —
 * no JS-then-fetch round-trip for the most common path. Subsequent rounds
 * are handled client-side via the existing /api/listings call + sessionStorage
 * prefetch cache.
 */
export default async function PlayPage() {
  const initialListing = await fetchOneListing();
  return <PlayClient initialListing={initialListing} />;
}
