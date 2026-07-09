/**
 * Download press logos from vhv.rs search pages and build color/black/white variants.
 *
 * Usage:
 *   bun scripts/download-vhv-logos.ts
 *   bun scripts/download-vhv-logos.ts --ids forbes,cnbc
 *   bun scripts/download-vhv-logos.ts --skip-existing
 *
 * For each bundled publisher id it:
 * 1. Fetches https://www.vhv.rs/somore/{search-slug}/
 * 2. Scores viewpic candidates and picks the best logo-like transparent mark
 * 3. Downloads full-res PNG via /dpng/f/
 * 4. Runs scripts/process-publisher-logo-variants.sh
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { $ } from "bun";
import { BUNDLED_PUBLISHERS } from "../lib/bundled-publishers";

const ROOT = path.join(import.meta.dir, "..");
const WORK =
  process.env.LOGO_WORK_DIR ?? path.join(ROOT, "tmp/logo-variant-sources");
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

/** Extra search query variants when the default `{name}-logo` page is weak. */
const SEARCH_SLUGS: Record<string, string[]> = {
  forbes: ["forbes-logo", "forbes-magazine-logo"],
  entrepreneur: ["entrepreneur-logo", "entrepreneur-magazine-logo"],
  inc: ["inc-magazine-logo", "inc-logo"],
  "fast-company": ["fast-company-logo", "fastcompany-logo"],
  bloomberg: ["bloomberg-logo", "bloomberg-business-logo"],
  "business-insider": ["business-insider-logo", "businessinsider-logo"],
  cnbc: ["cnbc-logo", "cnbc-logo-transparent"],
  fortune: ["fortune-logo", "fortune-magazine-logo"],
  "harvard-business-review": ["harvard-business-review-logo", "hbr-logo"],
  "financial-times": ["financial-times-logo", "ft-logo"],
  economist: ["the-economist-logo", "economist-logo"],
  barrons: ["barrons-logo", "barron-s-logo"],
  marketwatch: ["marketwatch-logo", "market-watch-logo"],
  "yahoo-finance": ["yahoo-finance-logo", "yahoo-finance"],
  adweek: ["adweek-logo"],
  techcrunch: ["techcrunch-logo", "tech-crunch-logo"],
  wired: ["wired-logo", "wired-magazine-logo"],
  "the-verge": ["the-verge-logo", "verge-logo"],
  mashable: ["mashable-logo"],
  venturebeat: ["venturebeat-logo", "venture-beat-logo"],
  "ars-technica": ["ars-technica-logo", "arstechnica-logo"],
  engadget: ["engadget-logo"],
  "product-hunt": ["product-hunt-logo", "producthunt-logo"],
  cnet: ["cnet-logo"],
  zdnet: ["zdnet-logo"],
  gizmodo: ["gizmodo-logo"],
  "new-york-times": ["new-york-times-logo", "nytimes-logo", "nyt-logo"],
  "wall-street-journal": ["wall-street-journal-logo", "wsj-logo"],
  "washington-post": ["washington-post-logo", "washingtonpost-logo"],
  bbc: ["bbc-logo", "bbc-news-logo"],
  cnn: ["cnn-logo"],
  "the-guardian": ["the-guardian-logo", "guardian-logo"],
  "usa-today": ["usa-today-logo", "usatoday-logo"],
  reuters: ["reuters-logo"],
  "associated-press": ["associated-press-logo", "ap-news-logo", "ap-logo"],
  time: ["time-magazine-logo", "time-logo"],
  politico: ["politico-logo"],
  axios: ["axios-logo"],
  npr: ["npr-logo"],
  "fox-news": ["fox-news-logo", "foxnews-logo"],
  "nbc-news": ["nbc-news-logo", "nbcnews-logo"],
  "abc-news": ["abc-news-logo", "abcnews-logo"],
  "the-atlantic": ["the-atlantic-logo", "atlantic-logo"],
  "new-yorker": ["the-new-yorker-logo", "new-yorker-logo"],
  "vanity-fair": ["vanity-fair-logo", "vanityfair-logo"],
  vogue: ["vogue-logo", "vogue-magazine-logo"],
  gq: ["gq-logo", "gq-magazine-logo"],
  "rolling-stone": ["rolling-stone-logo", "rollingstone-logo"],
  variety: ["variety-logo"],
  espn: ["espn-logo"],
};

/** Tokens that usually mean a wrong/unwanted mark. */
const NEGATIVE = [
  "alexander",
  "middle-east",
  "interviews",
  "presensos",
  "neon",
  "world-channel",
  "thumb-image",
  "nbc-logo", // bare NBC when searching CNBC
  "fake",
  "app-icon",
  "icon-only",
  "square-icon",
  "favicon",
  "wallpaper",
  "background",
  "cover",
  "magazine-cover",
  "iphone",
  "android",
  "mockup",
  "person",
  "portrait",
];

const POSITIVE = [
  "logo",
  "transparent",
  "png",
  "wordmark",
  "logotype",
  "brand",
];

function parseArgs(argv: string[]) {
  const ids = new Set<string>();
  let skipExisting = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--skip-existing") {
      skipExisting = true;
    } else if (arg === "--ids" && argv[i + 1]) {
      for (const id of argv[++i].split(",")) {
        if (id.trim()) {
          ids.add(id.trim());
        }
      }
    }
  }
  return { ids, skipExisting };
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,*/*" },
      redirect: "follow",
    });
    if (!res.ok) {
      return null;
    }
    return await res.text();
  } catch {
    return null;
  }
}

function extractViewpicSlugs(html: string): string[] {
  const re = /\/viewpic\/([a-zA-Z0-9_-]+)\//g;
  const found = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    found.add(match[1]);
  }
  return [...found];
}

function scoreSlug(slug: string, outletId: string, name: string): number {
  const lower = slug.toLowerCase();
  let score = 0;

  for (const token of POSITIVE) {
    if (lower.includes(token)) {
      score += 3;
    }
  }
  for (const token of NEGATIVE) {
    if (lower.includes(token)) {
      score -= 12;
    }
  }

  // Prefer slugs that mention outlet name tokens.
  const nameTokens = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
  for (const token of nameTokens) {
    if (lower.includes(token)) {
      score += 8;
    }
  }

  const idTokens = outletId.split("-").filter((t) => t.length > 2);
  for (const token of idTokens) {
    if (lower.includes(token)) {
      score += 6;
    }
  }

  // Prefer transparent / hd marks
  if (lower.includes("transparent")) {
    score += 5;
  }
  if (lower.includes("hd-png") || lower.includes("png-download")) {
    score += 2;
  }
  // Penalize overly long photo-style slugs
  if (slug.length > 80) {
    score -= 5;
  }

  return score;
}

async function resolveFullPngUrl(viewpicSlug: string): Promise<string | null> {
  const pageUrl = `https://www.vhv.rs/viewpic/${viewpicSlug}/`;
  const html = await fetchText(pageUrl);
  if (!html) {
    return null;
  }

  // Prefer og:image /dpng/d/… then upgrade to /dpng/f/
  const og =
    html.match(
      /content="(https:\/\/www\.vhv\.rs\/dpng\/[df]\/[^"]+\.png)"/i
    )?.[1] ??
    html.match(
      /(https:\/\/www\.vhv\.rs\/dpng\/[df]\/[a-zA-Z0-9_./-]+\.png)/i
    )?.[1];

  if (!og) {
    return null;
  }

  return og.replace("/dpng/d/", "/dpng/f/");
}

async function downloadBinary(url: string, dest: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "image/png,image/*" },
      redirect: "follow",
    });
    if (!res.ok) {
      return false;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    // PNG magic
    if (buf.length < 100 || buf[0] !== 0x89 || buf[1] !== 0x50) {
      return false;
    }
    writeFileSync(dest, buf);
    return true;
  } catch {
    return false;
  }
}

async function pickAndDownload(
  id: string,
  name: string
): Promise<string | null> {
  const slugs = SEARCH_SLUGS[id] ?? [
    `${id}-logo`,
    `${name.toLowerCase().replace(/\s+/g, "-")}-logo`,
  ];

  const candidates: { slug: string; score: number }[] = [];

  for (const search of slugs) {
    const html = await fetchText(`https://www.vhv.rs/somore/${search}/`);
    if (!html) {
      continue;
    }
    for (const viewSlug of extractViewpicSlugs(html)) {
      candidates.push({
        slug: viewSlug,
        score: scoreSlug(viewSlug, id, name),
      });
    }
    // Small delay to be polite
    await new Promise((r) => setTimeout(r, 200));
  }

  candidates.sort((a, b) => b.score - a.score);
  // Dedupe by slug
  const seen = new Set<string>();
  const ranked = candidates.filter((c) => {
    if (seen.has(c.slug)) {
      return false;
    }
    seen.add(c.slug);
    return c.score > 0;
  });

  const tryList = ranked.slice(0, 8);
  if (tryList.length === 0) {
    return null;
  }

  const sourceDir = path.join(WORK, "sources");
  mkdirSync(sourceDir, { recursive: true });

  for (const candidate of tryList) {
    const pngUrl = await resolveFullPngUrl(candidate.slug);
    if (!pngUrl) {
      continue;
    }
    const dest = path.join(sourceDir, `${id}.png`);
    const ok = await downloadBinary(pngUrl, dest);
    if (!ok) {
      continue;
    }
    // Prefer reasonably wide wordmarks (not tiny icons)
    try {
      const identify = await $`magick identify -format %w:%h ${dest}`.text();
      const [w, h] = identify.trim().split(":").map(Number);
      if (!(w && h) || w < 80 || h < 20) {
        continue;
      }
      // Prefer horizontal logos for press strips
      if (w / h < 0.9 && ranked.length > 1) {
        // tall icon — keep looking unless last
        if (candidate !== tryList[tryList.length - 1]) {
          continue;
        }
      }
    } catch {
      // identify failed — still use file
    }

    writeFileSync(
      path.join(WORK, `${id}.source.json`),
      JSON.stringify(
        {
          id,
          name,
          viewpic: candidate.slug,
          score: candidate.score,
          url: pngUrl,
        },
        null,
        2
      )
    );
    return dest;
  }

  return null;
}

async function processVariants(sourcePath: string, id: string) {
  const script = path.join(ROOT, "scripts/process-publisher-logo-variants.sh");
  await $`bash ${script} ${sourcePath} ${id}`;
}

async function migrateLegacyFlat(id: string): Promise<boolean> {
  const flat = path.join(ROOT, "public/publishers/logos", `${id}.png`);
  if (!existsSync(flat)) {
    return false;
  }
  await processVariants(flat, id);
  return true;
}

async function main() {
  const { ids, skipExisting } = parseArgs(process.argv.slice(2));
  mkdirSync(WORK, { recursive: true });

  const publishers = BUNDLED_PUBLISHERS.filter(
    (p) => ids.size === 0 || ids.has(p.id)
  );

  console.log(`Processing ${publishers.length} outlets → ${WORK}`);
  const summary: {
    id: string;
    status: string;
    source?: string;
  }[] = [];

  for (const publisher of publishers) {
    const { id, name } = publisher;
    const blackPath = path.join(
      ROOT,
      "public/publishers/logos",
      id,
      "black.png"
    );

    if (skipExisting && existsSync(blackPath)) {
      summary.push({ id, status: "skipped-existing" });
      console.log(`SKIP ${id} (exists)`);
      continue;
    }

    process.stdout.write(`→ ${id}… `);
    try {
      const downloaded = await pickAndDownload(id, name);
      if (downloaded) {
        await processVariants(downloaded, id);
        summary.push({ id, status: "downloaded", source: downloaded });
        console.log("ok (vhv)");
        continue;
      }

      // Fall back to existing flat silhouette
      if (await migrateLegacyFlat(id)) {
        summary.push({ id, status: "legacy-flat" });
        console.log("ok (legacy flat)");
        continue;
      }

      // Fall back to previous variant black as source for regeneration
      if (existsSync(blackPath)) {
        await processVariants(blackPath, id);
        summary.push({ id, status: "regen-existing" });
        console.log("ok (regen)");
        continue;
      }

      summary.push({ id, status: "failed" });
      console.log("FAILED");
    } catch (error) {
      summary.push({
        id,
        status: `error:${error instanceof Error ? error.message : String(error)}`,
      });
      console.log("ERROR", error);
    }

    await new Promise((r) => setTimeout(r, 150));
  }

  const out = path.join(WORK, "download-summary.json");
  writeFileSync(out, JSON.stringify(summary, null, 2));
  const ok = summary.filter(
    (s) => s.status !== "failed" && !s.status.startsWith("error")
  );
  console.log(`\nDone: ${ok.length}/${summary.length} ok. Summary: ${out}`);

  if (ok.length < Math.min(45, publishers.length) * 0.9) {
    process.exitCode = 1;
  }
}

main();
