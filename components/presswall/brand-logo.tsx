import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  size?: number;
  /**
   * solid — dark tile + white mark (app icon / dark UI)
   * outline — transparent tile + dark stroke + black mark
   * mono-light — white tile + black mark (light surfaces)
   */
  variant?: "solid" | "outline" | "mono-light";
}

type LogoVariant = NonNullable<BrandLogoProps["variant"]>;

const TILE: Record<LogoVariant, { fill: string; stroke?: string }> = {
  solid: { fill: "#1F2123" },
  outline: { fill: "transparent", stroke: "#111111" },
  "mono-light": { fill: "#ffffff" },
};

const MARK: Record<LogoVariant, string> = {
  solid: "#ffffff",
  outline: "#111111",
  "mono-light": "#111111",
};

/**
 * Presswall mark: three stacked rounded squares (matches public/brand/*-bg-logo).
 * Geometry normalized from the brand SVG into a 48×48 tile.
 */
export function BrandLogo({
  className,
  size = 40,
  variant = "solid",
}: BrandLogoProps) {
  const tile = TILE[variant];
  const mark = MARK[variant];
  // Static id is fine — at most one brand mark is typically mounted.
  const gradientId = "presswall-brand-stroke";

  return (
    <svg
      aria-label="Presswall"
      className={cn("shrink-0", className)}
      fill="none"
      height={size}
      role="img"
      viewBox="0 0 48 48"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      {variant === "solid" ? (
        <defs>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id={gradientId}
            x1={24}
            x2={24}
            y1={1}
            y2={47}
          >
            <stop stopColor="#2B2D2F" />
            <stop offset={1} stopColor="#131517" />
          </linearGradient>
        </defs>
      ) : null}
      <rect
        fill={tile.fill}
        height={44}
        rx={9.5}
        stroke={
          variant === "solid"
            ? `url(#${gradientId})`
            : (tile.stroke ?? undefined)
        }
        strokeWidth={
          variant === "outline" ? 2 : variant === "solid" ? 1.9 : undefined
        }
        width={44}
        x={2}
        y={2}
      />
      {/* Back plate */}
      <rect
        fill={mark}
        height={20.7}
        opacity={0.2}
        rx={4.15}
        width={20.7}
        x={10.5}
        y={17.2}
      />
      {/* Mid plate */}
      <rect
        fill={mark}
        height={20.7}
        opacity={0.4}
        rx={4.15}
        width={20.7}
        x={14}
        y={13.7}
      />
      {/* Front plate */}
      <rect
        fill={mark}
        height={20.7}
        rx={4.15}
        width={20.7}
        x={17.5}
        y={10.2}
      />
    </svg>
  );
}
