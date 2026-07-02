import {
  interpolate,
  OffthreadVideo,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { GEIST_FONT } from "../fonts";
import { DASHBOARD_VIDEO } from "../video-config";

export function DashboardClip({
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
  const sceneOpacity = interpolate(
    frame,
    [startFrame, startFrame + 12, endFrame - 8, endFrame],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const titleOpacity = interpolate(localFrame, [0, 70, 100], [1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleScale = spring({
    fps,
    frame: localFrame,
    config: { damping: 10, mass: 0.35, stiffness: 300 },
  });

  const frameScale = interpolate(localFrame, [8, 20], [0.97, 1], {
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
        gap: 24,
        height: "100%",
        justifyContent: "center",
        opacity: sceneOpacity,
        padding: "48px 80px 56px",
      }}
    >
      <div
        style={{
          opacity: titleOpacity,
          textAlign: "center",
          transform: `scale(${titleScale})`,
        }}
      >
        <p
          style={{
            color: "#888",
            fontSize: 20,
            fontWeight: 500,
            letterSpacing: "0.16em",
            margin: "0 0 12px",
            textTransform: "uppercase",
          }}
        >
          Full control
        </p>
        <h2
          style={{
            color: "#111",
            fontSize: 52,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          Create your own
        </h2>
        <p
          style={{
            color: "#666",
            fontSize: 24,
            fontWeight: 400,
            margin: "12px 0 0",
          }}
        >
          Customize outlets, layouts, and styling in the admin
        </p>
      </div>

      <div
        style={{
          border: "1px solid #e0e0e0",
          borderRadius: 16,
          boxShadow: "0 24px 80px rgba(0,0,0,0.12)",
          flex: 1,
          maxHeight: 780,
          maxWidth: 1280,
          overflow: "hidden",
          transform: `scale(${frameScale})`,
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            background: "#f4f4f5",
            borderBottom: "1px solid #e0e0e0",
            display: "flex",
            gap: 8,
            padding: "12px 16px",
          }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            <span
              style={{
                background: "#ff5f57",
                borderRadius: "50%",
                display: "block",
                height: 10,
                width: 10,
              }}
            />
            <span
              style={{
                background: "#febc2e",
                borderRadius: "50%",
                display: "block",
                height: 10,
                width: 10,
              }}
            />
            <span
              style={{
                background: "#28c840",
                borderRadius: "50%",
                display: "block",
                height: 10,
                width: 10,
              }}
            />
          </div>
          <span
            style={{
              color: "#888",
              fontSize: 13,
              fontWeight: 500,
              marginLeft: 8,
            }}
          >
            Presswall — Shopify admin
          </span>
        </div>
        <OffthreadVideo
          src={staticFile(DASHBOARD_VIDEO)}
          style={{
            display: "block",
            height: "100%",
            objectFit: "contain",
            width: "100%",
          }}
        />
      </div>
    </div>
  );
}