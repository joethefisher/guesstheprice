// Provider: "Realty US" by ntd119 — realty-us.p.rapidapi.com
// Endpoint: GET /properties/search-buy
// Location slug: city:{state_lower}_{city_lower} (e.g. city:il_chicago)
// Pagination: ?page=N — 20 results per page, meta.totalPage gives total
// Sold price: top-level last_sold_price (populated on resale listings, null on new construction)

import type { RawListing } from "../types";

export const REALTY_US_HOST = "realty-us.p.rapidapi.com";
export const SEARCH_BUY_ENDPOINT = `https://${REALTY_US_HOST}/properties/search-buy`;
export const MAX_PAGE = 475; // hard cap: offset 9500 / 20 per page

// --- Raw API types (observed from live /properties/search-buy response) ---

interface RealtyUsCoordinate {
  lat: number;
  lon: number;
}

interface RealtyUsAddress {
  line: string;
  city: string;
  state_code: string;
  postal_code: string | null;
  coordinate: RealtyUsCoordinate | null;
}

interface RealtyUsDescription {
  beds: number | null;
  baths: number | null;
  baths_full_calc?: number | null;
  baths_partial_calc?: number | null;
  sqft: number | null;
  lot_sqft: number | null;
  year_built: number | null;
  type: string | null;
}

interface RealtyUsPhoto {
  href: string;
}

export interface RealtyUsListing {
  property_id: string;
  listing_id?: string;
  status?: string;
  last_sold_price: number | null;
  last_sold_date: string | null;
  list_price: number | null;
  description: RealtyUsDescription;
  location: {
    address: RealtyUsAddress;
    neighborhoods: null;
  };
  photos: RealtyUsPhoto[];
  photo_count?: number;
}

export interface RealtyUsBuyResponse {
  data: {
    count: number;
    total: number;
    results: RealtyUsListing[];
  } | null;
  meta: {
    currentPage: number;
    limit: number;
    totalRecords: number;
    totalPage: number;
  };
  status: boolean;
  message: string;
}

// --- Helpers ---

export function toLocationSlug(city: string, state: string): string {
  const c = city.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  const s = state.toLowerCase();
  return `city:${s}_${c}`;
}

export function toRawListing(api: RealtyUsListing): RawListing {
  const addr = api.location.address;
  const desc = api.description;

  // Convert integer baths to baths_consolidated string format that normalize/quality expect.
  // Prefer full+partial calc for precision; fall back to plain baths integer.
  let bathsConsolidated: string | undefined;
  if (desc.baths_full_calc != null) {
    const total = (desc.baths_full_calc ?? 0) + 0.5 * (desc.baths_partial_calc ?? 0);
    bathsConsolidated = String(total);
  } else if (desc.baths != null) {
    bathsConsolidated = String(desc.baths);
  }

  return {
    property_id: api.property_id,
    address: {
      line: addr.line,
      city: addr.city,
      state_code: addr.state_code,
      postal_code: addr.postal_code ?? undefined,
      coordinate: addr.coordinate ?? undefined,
    },
    description: {
      beds: api.description.beds ?? 0,
      baths_consolidated: bathsConsolidated,
      sqft: desc.sqft ?? undefined,
      lot_sqft: desc.lot_sqft ?? undefined,
      year_built: desc.year_built ?? undefined,
      type: desc.type ?? undefined,
    },
    list_price: api.list_price ?? undefined,
    last_sold_price: api.last_sold_price ?? undefined,
    last_sold_date: api.last_sold_date ?? undefined,
    photos: (api.photos ?? []).map((p) => ({ href: p.href })),
  };
}

export function parseSearchBuyResponse(json: unknown): {
  listings: RealtyUsListing[];
  totalPages: number;
  currentPage: number;
} {
  const r = json as RealtyUsBuyResponse;
  return {
    listings: r?.data?.results ?? [],
    totalPages: r?.meta?.totalPage ?? 1,
    currentPage: r?.meta?.currentPage ?? 1,
  };
}
