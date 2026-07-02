import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { GEIST_FONT } from "../fonts";
import { OfficialLogo } from "./OfficialLogo";

export function CtaScreen({
  endFrame,
  startFrame,
}: {
  endFrame: number;
  startFrame: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < startFrame || frame >= endFrame) {
    return null;
  }

  const localFrame = frame - startFrame;

  const logoScale = spring({
    fps,
    frame: localFrame,
    config: { damping: 10, mass: 0.35, stiffness: 280 },
  });

  const headlineY = interpolate(localFrame, [8, 22], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subtitleOpacity = interpolate(localFrame, [18, 32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaScale = spring({
    fps,
    frame: localFrame - 28,
    config: { damping: 12, mass: 0.35, stiffness: 300 },
  });

  const featuresOpacity = interpolate(localFrame, [36, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        background: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        fontFamily: GEIST_FONT,
        justifyContent: "center",
        padding: "0 80px",
        textAlign: "center",
      }}
    >
      <div style={{ transform: `scale(${logoScale})` }}>
        <OfficialLogo height={120} variant="light" />
      </div>

      <h2
        style={{
          color: "#ffffff",
          fontSize: 72,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          margin: "32px 0 16px",
          transform: `translateY(${headlineY}px)`,
        }}
      >
        Build trust on your storefront
      </h2>

      <p
        style={{
          color: "rgba(255,255,255,0.7)",
          fontSize: 30,
          fontWeight: 400,
          margin: "0 0 40px",
          maxWidth: 720,
          opacity: subtitleOpacity,
        }}
      >
        Install Presswall from the Shopify App Store
      </p>

      <div
        style={{
          background: "#ffffff",
          borderRadius: 12,
          color: "#111",
          fontSize: 26,
          fontWeight: 700,
          marginBottom: 48,
          padding: "18px 40px",
          transform: `scale(${ctaScale})`,
        }}
      >
        Get started free
      </div>

      <div
        style={{
          color: "rgba(255,255,255,0.45)",
          display: "flex",
          fontSize: 18,
          fontWeight: 500,
          gap: 32,
          letterSpacing: "0.04em",
          opacity: featuresOpacity,
        }}
      >
        <span>90+ publishers</span>
        <span>·</span>
        <span>4 templates</span>
        <span>·</span>
        <span>Fully customizable</span>
      </div>
    </AbsoluteFill>
  );
}