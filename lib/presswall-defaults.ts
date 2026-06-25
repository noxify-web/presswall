import type { PresswallConfig } from "@/lib/presswall-types";

export const DEFAULT_PRESSWALL_CONFIG: PresswallConfig = {
  headingText: "As seen on",
  showHeading: true,
  colorMode: "mono",
  layout: "bar",
  logoHeight: 32,
  gap: 24,
  alignment: "center",
  backgroundColor: "transparent",
  textColor: "#111111",
  borderRadius: 0,
  paddingY: 16,
  paddingX: 16,
  marqueeSpeed: 30,
  grayscaleOpacity: 70,
};
