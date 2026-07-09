import { Img, staticFile } from "remotion";

/**
 * Official brand mark assets in `public/brand/`:
 * - light → white mark on dark tile (dark backgrounds / intro / CTA)
 * - dark  → black mark on white tile (light backgrounds)
 */
type LogoVariant = "dark" | "light";

const LOGO_SRC: Record<LogoVariant, string> = {
  dark: "brand/white-bg-logo.png",
  light: "brand/black-bg-logo.png",
};

export function OfficialLogo({
  height = 120,
  variant = "dark",
}: {
  height?: number;
  variant?: LogoVariant;
}) {
  return (
    <Img
      src={staticFile(LOGO_SRC[variant])}
      style={{
        // Logo tiles already include rounded corners; keep slight clip soft.
        borderRadius: Math.round(height * 0.18),
        height,
        objectFit: "contain",
        width: height,
      }}
    />
  );
}
