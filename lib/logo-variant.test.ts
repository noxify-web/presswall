import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
import { BUNDLED_PUBLISHERS } from "@/lib/bundled-publishers";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";
import {
  colorModeSchema,
  logoVariantForColorMode,
  migrateLegacyColorMode,
  normalizeColorMode,
  parseLogoVariant,
} from "@/lib/logo-variant";
import {
  absoluteBundledLogoUrl,
  bundledLogoPath,
} from "@/lib/publisher-logo-path";
import { presswallConfigSchema } from "@/lib/presswall-types";
import { readBundledPublisherLogo } from "@/lib/read-bundled-logo";
import { resolveStorefrontPublishers } from "@/lib/resolve-storefront-publishers";

describe("logoVariantForColorMode", () => {
  test("maps colorful / black / white / muted / legacy mono", () => {
    expect(logoVariantForColorMode("color")).toBe("color");
    expect(logoVariantForColorMode("black")).toBe("black");
    expect(logoVariantForColorMode("white")).toBe("white");
    expect(logoVariantForColorMode("muted")).toBe("black");
    expect(logoVariantForColorMode("mono")).toBe("black");
  });

  test("normalizeColorMode collapses mono to black", () => {
    expect(normalizeColorMode("mono")).toBe("black");
    expect(normalizeColorMode("black")).toBe("black");
    expect(normalizeColorMode("white")).toBe("white");
  });

  test("migrateLegacyColorMode maps mono+dark to white", () => {
    expect(migrateLegacyColorMode("mono", true)).toBe("white");
    expect(migrateLegacyColorMode("mono", false)).toBe("black");
    expect(migrateLegacyColorMode("black", true)).toBe("black");
    expect(migrateLegacyColorMode("white", false)).toBe("white");
    expect(migrateLegacyColorMode("color", true)).toBe("color");
  });

  test("schema accepts legacy mono and new modes", () => {
    expect(colorModeSchema.parse("mono")).toBe("black");
    expect(colorModeSchema.parse("black")).toBe("black");
    expect(colorModeSchema.parse("white")).toBe("white");
    expect(colorModeSchema.parse("color")).toBe("color");
  });
});

describe("legacy mono + dark background migration", () => {
  test("presswallConfigSchema maps mono + #0a0a0a to white", () => {
    const parsed = presswallConfigSchema.parse({
      ...DEFAULT_PRESSWALL_CONFIG,
      colorMode: "mono",
      backgroundColor: "#0a0a0a",
      textColor: "#fafafa",
    });
    expect(parsed.colorMode).toBe("white");
  });

  test("presswallConfigSchema maps mono + transparent to black", () => {
    const parsed = presswallConfigSchema.parse({
      ...DEFAULT_PRESSWALL_CONFIG,
      colorMode: "mono",
      backgroundColor: "transparent",
    });
    expect(parsed.colorMode).toBe("black");
  });

  test("legacy mono + dark band resolves white logo URLs on real path", () => {
    const catalog = [
      {
        id: "techcrunch",
        name: "TechCrunch",
        category: "Tech",
        websiteUrl: "https://techcrunch.com",
        logoSvg: "",
        logoMonoSvg: "",
      },
    ];
    const config = presswallConfigSchema.parse({
      ...DEFAULT_PRESSWALL_CONFIG,
      colorMode: "mono",
      backgroundColor: "#0a0a0a",
      textColor: "#fafafa",
    });
    expect(config.colorMode).toBe("white");

    const publishers = resolveStorefrontPublishers(
      catalog,
      [{ publisherId: "techcrunch", position: 0 }],
      { colorMode: config.colorMode }
    );
    expect(publishers[0]?.logoImageUrl).toBe(
      "/api/publishers/techcrunch/logo?variant=white"
    );
  });
});

describe("bundledLogoPath", () => {
  test("includes variant query from colorMode", () => {
    expect(bundledLogoPath("forbes", { colorMode: "color" })).toBe(
      "/api/publishers/forbes/logo?variant=color"
    );
    expect(bundledLogoPath("forbes", { colorMode: "white" })).toBe(
      "/api/publishers/forbes/logo?variant=white"
    );
    expect(bundledLogoPath("forbes", { variant: "black" })).toBe(
      "/api/publishers/forbes/logo?variant=black"
    );
  });

  test("absolute urls preserve variant", () => {
    const url = absoluteBundledLogoUrl("cnbc", { colorMode: "color" });
    expect(url).toContain("/api/publishers/cnbc/logo?variant=color");
  });

  test("parseLogoVariant falls back safely", () => {
    expect(parseLogoVariant("white")).toBe("white");
    expect(parseLogoVariant("nope")).toBe("black");
    expect(parseLogoVariant(null)).toBe("black");
  });
});

async function opaqueInkMean(filePath: string): Promise<number> {
  // Mean of RGB among pixels with alpha > 50% (opaque ink only).
  const { spawn } = await import("node:child_process");
  const out = await new Promise<string>((resolve, reject) => {
    const proc = spawn(
      "bash",
      [
        "-c",
        `magick "$1" \\( +clone -alpha extract -threshold 50% \\) -compose CopyOpacity -composite -alpha off -format '%[fx:mean.r]' info:`,
        "magick-mean",
        filePath,
      ],
      { stdio: ["ignore", "pipe", "pipe"] }
    );
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    proc.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`magick failed (${code}): ${stderr || stdout}`));
      }
    });
  });
  return Number.parseFloat(out.trim());
}

async function opaqueChannelMeans(
  filePath: string
): Promise<{ b: number; g: number; r: number }> {
  const { spawn } = await import("node:child_process");
  const out = await new Promise<string>((resolve, reject) => {
    const proc = spawn(
      "bash",
      [
        "-c",
        `magick "$1" \\( +clone -alpha extract -threshold 50% \\) -compose CopyOpacity -composite -alpha off -format '%[fx:mean.r] %[fx:mean.g] %[fx:mean.b]' info:`,
        "magick-rgb",
        filePath,
      ],
      { stdio: ["ignore", "pipe", "pipe"] }
    );
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    proc.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`magick failed (${code}): ${stderr || stdout}`));
      }
    });
  });
  const [r, g, b] = out.trim().split(/\s+/).map(Number);
  return { r, g, b };
}

function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

describe("bundled catalog + variant assets", () => {
  test("catalog has at least 45 outlets", () => {
    expect(BUNDLED_PUBLISHERS.length).toBeGreaterThanOrEqual(45);
  });

  test("readBundledPublisherLogo serves pure black and pure white ink", async () => {
    const samples = ["forbes", "cnbc", "techcrunch"].filter((id) =>
      BUNDLED_PUBLISHERS.some((p) => p.id === id)
    );

    for (const id of samples) {
      const black = await readBundledPublisherLogo(id, "black");
      const white = await readBundledPublisherLogo(id, "white");
      const color = await readBundledPublisherLogo(id, "color");

      expect(black).not.toBeNull();
      expect(white).not.toBeNull();
      expect(color).not.toBeNull();
      expect(black?.contentType).toBe("image/png");
      expect(white?.contentType).toBe("image/png");

      const blackPath = `public/publishers/logos/${id}/black.png`;
      const whitePath = `public/publishers/logos/${id}/white.png`;
      expect(await opaqueInkMean(blackPath)).toBeLessThan(0.02);
      expect(await opaqueInkMean(whitePath)).toBeGreaterThan(0.98);
    }
  });

  test("two different outlets use full-black RGB (consistent intensity)", async () => {
    for (const id of ["forbes", "cnbc"]) {
      const mean = await opaqueInkMean(
        `public/publishers/logos/${id}/black.png`
      );
      expect(mean).toBeLessThan(0.02);
    }
  });

  test("colorful brands serve non-black color assets (CNBC, Guardian)", async () => {
    for (const id of ["cnbc", "the-guardian"]) {
      const color = await readBundledPublisherLogo(id, "color");
      const black = await readBundledPublisherLogo(id, "black");
      expect(color).not.toBeNull();
      expect(black).not.toBeNull();

      // Color PNG bytes must not match pure black silhouette
      expect(sha256(color!.body)).not.toBe(sha256(black!.body));

      const means = await opaqueChannelMeans(
        `public/publishers/logos/${id}/color.png`
      );
      // Opaque ink should not be pure black (sum of channel means > ~0)
      expect(means.r + means.g + means.b).toBeGreaterThan(0.05);
    }
  });
});
