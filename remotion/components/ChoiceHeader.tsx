import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { GEIST_FONT } from "../fonts";

export function ChoiceHeader({
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
  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 10, endFrame - 8, endFrame],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const titleScale = spring({
    fps,
    frame: localFrame,
    config: { damping: 10, mass: 0.35, stiffness: 300 },
  });

  const subtitleOpacity = interpolate(localFrame, [14, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
        fontFamily: GEIST_FONT,
        height: "100%",
        justifyContent: "center",
        opacity,
        padding: "0 80px",
        textAlign: "center",
      }}
    >
      <p
        style={{
          color: "#888",
          fontSize: 20,
          fontWeight: 500,
          letterSpacing: "0.16em",
          margin: "0 0 20px",
          textTransform: "uppercase",
        }}
      >
        Get started fast
      </p>
      <h2
        style={{
          color: "#111",
          fontSize: 64,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          margin: "0 0 24px",
          transform: `scale(${titleScale})`,
        }}
      >
        4 ready-made templates
      </h2>
      <p
        style={{
          color: "#555",
          fontSize: 32,
          fontWeight: 500,
          margin: 0,
          opacity: subtitleOpacity,
        }}
      >
        — or create your own —
      </p>
    </div>
  );
}