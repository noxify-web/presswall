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

/** ~50 top press / business / tech / news / culture outlets. */
export const BUNDLED_PUBLISHERS: BundledPublisher[] = [
  // Business
  {
    id: "forbes",
    name: "Forbes",
    category: "Business",
    websiteUrl: "https://forbes.com",
    sortOrder: 1,
  },
  {
    id: "entrepreneur",
    name: "Entrepreneur",
    category: "Business",
    websiteUrl: "https://entrepreneur.com",
    sortOrder: 2,
  },
  {
    id: "inc",
    name: "Inc.",
    category: "Business",
    websiteUrl: "https://inc.com",
    sortOrder: 3,
  },
  {
    id: "fast-company",
    name: "Fast Company",
    category: "Business",
    websiteUrl: "https://fastcompany.com",
    sortOrder: 4,
  },
  {
    id: "bloomberg",
    name: "Bloomberg",
    category: "Business",
    websiteUrl: "https://bloomberg.com",
    sortOrder: 5,
  },
  {
    id: "business-insider",
    name: "Business Insider",
    category: "Business",
    websiteUrl: "https://businessinsider.com",
    sortOrder: 6,
  },
  {
    id: "cnbc",
    name: "CNBC",
    category: "Business",
    websiteUrl: "https://cnbc.com",
    sortOrder: 7,
  },
  {
    id: "fortune",
    name: "Fortune",
    category: "Business",
    websiteUrl: "https://fortune.com",
    sortOrder: 8,
  },
  {
    id: "harvard-business-review",
    name: "Harvard Business Review",
    category: "Business",
    websiteUrl: "https://hbr.org",
    sortOrder: 9,
  },
  {
    id: "financial-times",
    name: "Financial Times",
    category: "Business",
    websiteUrl: "https://ft.com",
    sortOrder: 10,
  },
  {
    id: "economist",
    name: "The Economist",
    category: "Business",
    websiteUrl: "https://economist.com",
    sortOrder: 11,
  },
  {
    id: "barrons",
    name: "Barron's",
    category: "Business",
    websiteUrl: "https://barrons.com",
    sortOrder: 12,
  },
  {
    id: "marketwatch",
    name: "MarketWatch",
    category: "Business",
    websiteUrl: "https://marketwatch.com",
    sortOrder: 13,
  },
  {
    id: "yahoo-finance",
    name: "Yahoo Finance",
    category: "Business",
    websiteUrl: "https://finance.yahoo.com",
    sortOrder: 14,
  },
  {
    id: "adweek",
    name: "Adweek",
    category: "Business",
    websiteUrl: "https://adweek.com",
    sortOrder: 15,
  },
  // Tech
  {
    id: "techcrunch",
    name: "TechCrunch",
    category: "Tech",
    websiteUrl: "https://techcrunch.com",
    sortOrder: 16,
  },
  {
    id: "wired",
    name: "Wired",
    category: "Tech",
    websiteUrl: "https://wired.com",
    sortOrder: 17,
  },
  {
    id: "the-verge",
    name: "The Verge",
    category: "Tech",
    websiteUrl: "https://theverge.com",
    sortOrder: 18,
  },
  {
    id: "mashable",
    name: "Mashable",
    category: "Tech",
    websiteUrl: "https://mashable.com",
    sortOrder: 19,
  },
  {
    id: "venturebeat",
    name: "VentureBeat",
    category: "Tech",
    websiteUrl: "https://venturebeat.com",
    sortOrder: 20,
  },
  {
    id: "ars-technica",
    name: "Ars Technica",
    category: "Tech",
    websiteUrl: "https://arstechnica.com",
    sortOrder: 21,
  },
  {
    id: "engadget",
    name: "Engadget",
    category: "Tech",
    websiteUrl: "https://engadget.com",
    sortOrder: 22,
  },
  {
    id: "product-hunt",
    name: "Product Hunt",
    category: "Tech",
    websiteUrl: "https://producthunt.com",
    sortOrder: 23,
  },
  {
    id: "cnet",
    name: "CNET",
    category: "Tech",
    websiteUrl: "https://cnet.com",
    sortOrder: 24,
  },
  {
    id: "zdnet",
    name: "ZDNET",
    category: "Tech",
    websiteUrl: "https://zdnet.com",
    sortOrder: 25,
  },
  {
    id: "gizmodo",
    name: "Gizmodo",
    category: "Tech",
    websiteUrl: "https://gizmodo.com",
    sortOrder: 26,
  },
  // News
  {
    id: "new-york-times",
    name: "The New York Times",
    category: "News",
    websiteUrl: "https://nytimes.com",
    sortOrder: 27,
  },
  {
    id: "wall-street-journal",
    name: "The Wall Street Journal",
    category: "News",
    websiteUrl: "https://wsj.com",
    sortOrder: 28,
  },
  {
    id: "washington-post",
    name: "The Washington Post",
    category: "News",
    websiteUrl: "https://washingtonpost.com",
    sortOrder: 29,
  },
  {
    id: "bbc",
    name: "BBC",
    category: "News",
    websiteUrl: "https://bbc.com",
    sortOrder: 30,
  },
  {
    id: "cnn",
    name: "CNN",
    category: "News",
    websiteUrl: "https://cnn.com",
    sortOrder: 31,
  },
  {
    id: "the-guardian",
    name: "The Guardian",
    category: "News",
    websiteUrl: "https://theguardian.com",
    sortOrder: 32,
  },
  {
    id: "usa-today",
    name: "USA Today",
    category: "News",
    websiteUrl: "https://usatoday.com",
    sortOrder: 33,
  },
  {
    id: "reuters",
    name: "Reuters",
    category: "News",
    websiteUrl: "https://reuters.com",
    sortOrder: 34,
  },
  {
    id: "associated-press",
    name: "Associated Press",
    category: "News",
    websiteUrl: "https://apnews.com",
    sortOrder: 35,
  },
  {
    id: "time",
    name: "TIME",
    category: "News",
    websiteUrl: "https://time.com",
    sortOrder: 36,
  },
  {
    id: "politico",
    name: "Politico",
    category: "News",
    websiteUrl: "https://politico.com",
    sortOrder: 37,
  },
  {
    id: "axios",
    name: "Axios",
    category: "News",
    websiteUrl: "https://axios.com",
    sortOrder: 38,
  },
  {
    id: "npr",
    name: "NPR",
    category: "News",
    websiteUrl: "https://npr.org",
    sortOrder: 39,
  },
  {
    id: "fox-news",
    name: "Fox News",
    category: "News",
    websiteUrl: "https://foxnews.com",
    sortOrder: 40,
  },
  {
    id: "nbc-news",
    name: "NBC News",
    category: "News",
    websiteUrl: "https://nbcnews.com",
    sortOrder: 41,
  },
  {
    id: "abc-news",
    name: "ABC News",
    category: "News",
    websiteUrl: "https://abcnews.go.com",
    sortOrder: 42,
  },
  // Culture / lifestyle
  {
    id: "the-atlantic",
    name: "The Atlantic",
    category: "Culture",
    websiteUrl: "https://theatlantic.com",
    sortOrder: 43,
  },
  {
    id: "new-yorker",
    name: "The New Yorker",
    category: "Culture",
    websiteUrl: "https://newyorker.com",
    sortOrder: 44,
  },
  {
    id: "vanity-fair",
    name: "Vanity Fair",
    category: "Culture",
    websiteUrl: "https://vanityfair.com",
    sortOrder: 45,
  },
  {
    id: "vogue",
    name: "Vogue",
    category: "Culture",
    websiteUrl: "https://vogue.com",
    sortOrder: 46,
  },
  {
    id: "gq",
    name: "GQ",
    category: "Culture",
    websiteUrl: "https://gq.com",
    sortOrder: 47,
  },
  {
    id: "rolling-stone",
    name: "Rolling Stone",
    category: "Culture",
    websiteUrl: "https://rollingstone.com",
    sortOrder: 48,
  },
  {
    id: "variety",
    name: "Variety",
    category: "Culture",
    websiteUrl: "https://variety.com",
    sortOrder: 49,
  },
  {
    id: "espn",
    name: "ESPN",
    category: "Sports",
    websiteUrl: "https://espn.com",
    sortOrder: 50,
  },
];

const BUNDLED_PUBLISHER_IDS = new Set(
  BUNDLED_PUBLISHERS.map((publisher) => publisher.id)
);

export function isBundledPublisherId(id: string): boolean {
  return BUNDLED_PUBLISHER_IDS.has(id);
}
