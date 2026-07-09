/**
 * Curated "as seen on" outlets with bundled transparent logos.
 *
 * Layout (per outlet id):
 *
 *   public/publishers/logos/{id}/color.png
 *   public/publishers/logos/{id}/black.png
 *   public/publishers/logos/{id}/white.png
 *
 * Legacy flat files (`{id}.png`) are still read as black when variants are missing.
 *
 * Catalog is intentionally small: only Brandfetch-curated outlets with
 * reviewed color/black/white assets ship in the app.
 */

export const BUNDLED_PUBLISHER_LOGO_DIR = "/publishers/logos";

export const BUNDLED_LOGO_EXTENSIONS = [".png", ".svg", ".webp"] as const;

export interface BundledPublisher {
  category: string;
  id: string;
  name: string;
  sortOrder: number;
  websiteUrl: string;
}

/** Brandfetch-curated press outlets (quality over quantity). */
export const BUNDLED_PUBLISHERS: BundledPublisher[] = [
  {
    id: "forbes",
    name: "Forbes",
    category: "Business",
    websiteUrl: "https://forbes.com",
    sortOrder: 1,
  },
  {
    id: "bloomberg",
    name: "Bloomberg",
    category: "Business",
    websiteUrl: "https://bloomberg.com",
    sortOrder: 2,
  },
  {
    id: "fortune",
    name: "Fortune",
    category: "Business",
    websiteUrl: "https://fortune.com",
    sortOrder: 3,
  },
  {
    id: "economist",
    name: "The Economist",
    category: "Business",
    websiteUrl: "https://economist.com",
    sortOrder: 4,
  },
  {
    id: "techcrunch",
    name: "TechCrunch",
    category: "Tech",
    websiteUrl: "https://techcrunch.com",
    sortOrder: 5,
  },
  {
    id: "wired",
    name: "Wired",
    category: "Tech",
    websiteUrl: "https://wired.com",
    sortOrder: 6,
  },
  {
    id: "new-york-times",
    name: "The New York Times",
    category: "News",
    websiteUrl: "https://nytimes.com",
    sortOrder: 7,
  },
  {
    id: "bbc",
    name: "BBC",
    category: "News",
    websiteUrl: "https://bbc.com",
    sortOrder: 8,
  },
  {
    id: "cnn",
    name: "CNN",
    category: "News",
    websiteUrl: "https://cnn.com",
    sortOrder: 9,
  },
  {
    id: "vogue",
    name: "Vogue",
    category: "Culture",
    websiteUrl: "https://vogue.com",
    sortOrder: 10,
  },
];

const BUNDLED_PUBLISHER_IDS = new Set(
  BUNDLED_PUBLISHERS.map((publisher) => publisher.id)
);

export function isBundledPublisherId(id: string): boolean {
  return BUNDLED_PUBLISHER_IDS.has(id);
}
