export type Source = "realtor" | "zillow";

export interface Market {
  city: string;
  state: string;
  tier: "metro" | "secondary" | "luxury";
  weight: number;
}

export interface RawPhoto {
  href: string;
  width?: number;
  height?: number;
}

export interface RawListing {
  property_id: string;
  address: {
    line: string;
    neighborhood_name?: string;
    city: string;
    state_code: string;
    postal_code?: string;
    coordinate?: { lat: number; lon: number };
  };
  description: {
    beds: number;
    baths_consolidated?: string;
    sqft?: number;
    lot_sqft?: number;
    year_built?: number;
    type?: string;
  };
  list_price?: number;
  last_sold_price?: number;
  last_sold_date?: string;
  photos?: RawPhoto[];
}

export interface NormalizedPhoto {
  sourceUrl: string;
  width?: number;
  height?: number;
  ordering: number;
}

export interface NormalizedListing {
  externalId: string;
  source: Source;
  streetAddress: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  beds: number;
  baths: number;
  sqft?: number;
  lotSqft?: number;
  yearBuilt?: number;
  homeType?: string;
  soldPrice: number;
  soldDate?: Date;
  qualityScore: number;
  photos: NormalizedPhoto[];
}

export interface MirroredPhoto extends NormalizedPhoto {
  url: string;         // our mirrored 1600w URL
  thumbnailUrl: string; // our mirrored 400w URL
  mirroredWidth?: number;
  mirroredHeight?: number;
}

export interface MirroredListing extends NormalizedListing {
  photos: MirroredPhoto[];
}

export interface IngestionStats {
  marketsRequested: number;
  listingsFound: number;
  listingsIngested: number;
  listingsSkipped: number;
  errors: string[];
}
