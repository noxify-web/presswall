import { withDerivedSpacing } from "@/lib/presswall-spacing";
import type { PresswallConfig } from "@/lib/presswall-types";

const BASE_PRESSWALL_CONFIG = {
  headingText: "As seen on",
  showHeading: true,
  headingFontSize: 12,
  colorMode: "black",
  layout: "bar",
  logoHeight: 28,
  logosPerRowDesktop: 4,
  logosPerRowMobile: 2,
  headingAlignment: "center",
  logoAlignment: "center",
  backgroundColor: "transparent",
  textColor: "#111111",
  borderRadius: 0,
  paddingY: 40,
  paddingX: 24,
  contentMaxWidth: 840,
  marqueeSpeed: 30,
  grayscaleOpacity: 70,
  logoSpacing: "space-between",
} satisfies Omit<PresswallConfig, "gap" | "headingSpacing">;

export const DEFAULT_PRESSWALL_CONFIG: PresswallConfig = withDerivedSpacing(
  BASE_PRESSWALL_CONFIG as PresswallConfig
);
