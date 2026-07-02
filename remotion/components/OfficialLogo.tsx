import { Img, staticFile } from "remotion";

type LogoVariant = "dark" | "light";

const LOGO_SRC: Record<LogoVariant, string> = {
  dark: "brand/black-stokre-transparent.png",
  light: "brand/white-stroke-transparent.png",
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
        height,
        objectFit: "contain",
        width: height,
      }}
    />
  );
}