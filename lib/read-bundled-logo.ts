import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  BUNDLED_LOGO_EXTENSIONS,
  isBundledPublisherId,
} from "@/lib/bundled-publishers";
import { type LogoVariant, parseLogoVariant } from "@/lib/logo-variant";

const LOGO_DIR = path.join(process.cwd(), "public/publishers/logos");

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

async function tryRead(
  filePath: string,
  extension: string
): Promise<{ body: Buffer; contentType: string; extension: string } | null> {
  try {
    const data = await readFile(filePath);
    return {
      body: data,
      contentType: MIME_TYPES[extension] ?? "application/octet-stream",
      extension,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
    return null;
  }
}

/**
 * Read a bundled logo for the given variant.
 * Preference order:
 * 1. `logos/{id}/{variant}.{ext}`
 * 2. For non-black variants: fall back to black variant (mono brands)
 * 3. Legacy flat `logos/{id}.{ext}` (treated as black silhouette)
 */
export async function readBundledPublisherLogo(
  publisherId: string,
  variantInput: string | LogoVariant | null | undefined = "black"
) {
  if (!isBundledPublisherId(publisherId)) {
    return null;
  }

  const variant = parseLogoVariant(
    variantInput == null ? "black" : String(variantInput),
    "black"
  );

  let variantOrder: LogoVariant[];
  if (variant === "black") {
    variantOrder = ["black"];
  } else if (variant === "white") {
    variantOrder = ["white", "black"];
  } else {
    variantOrder = ["color", "black"];
  }

  for (const candidate of variantOrder) {
    for (const extension of BUNDLED_LOGO_EXTENSIONS) {
      const filePath = path.join(
        LOGO_DIR,
        publisherId,
        `${candidate}${extension}`
      );
      const result = await tryRead(filePath, extension);
      if (result) {
        return { ...result, variant: candidate };
      }
    }
  }

  // Legacy flat files (pre-variant layout) — black silhouette only.
  for (const extension of BUNDLED_LOGO_EXTENSIONS) {
    const filePath = path.join(LOGO_DIR, `${publisherId}${extension}`);
    const result = await tryRead(filePath, extension);
    if (result) {
      return { ...result, variant: "black" as const };
    }
  }

  return null;
}
