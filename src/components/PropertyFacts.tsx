interface Listing {
  neighborhood?: string | null;
  city: string;
  state: string;
  beds: number;
  baths: number;
  sqft?: number | null;
  lotSqft?: number | null;
  yearBuilt?: number | null;
  homeType?: string | null;
}

function formatHomeType(t?: string | null): string {
  if (!t) return "Home";
  return t
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export function PropertyFacts({ listing }: { listing: Listing }) {
  const location = listing.neighborhood
    ? `${listing.neighborhood}, ${listing.city}, ${listing.state}`
    : `${listing.city}, ${listing.state}`;

  return (
    <div className="space-y-4">
      {/* Location — primary identifier */}
      <div>
        <p className="caption text-ink/50 mb-1">Location</p>
        <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">
          {location}
        </h2>
      </div>

      {/* Facts grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-2">
        <Fact label="Beds" value={listing.beds.toString()} />
        <Fact label="Baths" value={listing.baths.toString()} />
        <Fact
          label="Sq Ft"
          value={listing.sqft ? listing.sqft.toLocaleString() : "—"}
        />
        <Fact
          label="Year"
          value={listing.yearBuilt ? listing.yearBuilt.toString() : "—"}
        />
      </div>

      {/* Sub-info */}
      <div className="flex items-center gap-3 text-sm text-ink/60">
        <span>{formatHomeType(listing.homeType)}</span>
        {listing.lotSqft && (
          <>
            <span className="text-ink/30">·</span>
            <span className="tnum">
              {listing.lotSqft.toLocaleString()} sq ft lot
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-cream rounded-xl px-4 py-3">
      <p className="caption text-ink/50 mb-0.5">{label}</p>
      <p className="font-display text-xl font-semibold tnum">{value}</p>
    </div>
  );
}
