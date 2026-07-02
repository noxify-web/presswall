import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ChoiceHeader } from "./components/ChoiceHeader";
import { CtaScreen } from "./components/CtaScreen";
import { DashboardClip } from "./components/DashboardClip";
import { OfficialLogo } from "./components/OfficialLogo";
import { TemplateCard } from "./components/TemplateStrip";
import { GEIST_FONT } from "./fonts";
import { TEMPLATES } from "./template-data";
import { DASHBOARD_VIDEO_FRAMES } from "./video-config";

export const FPS = 60;

const INTRO_END = 80;
const CHOICE_START = INTRO_END;
const CHOICE_END = CHOICE_START + 90;
const TEMPLATE_START = CHOICE_END;
const TEMPLATE_SLOT = 120;
const TEMPLATES_END = TEMPLATE_START + TEMPLATES.length * TEMPLATE_SLOT;
const CUSTOM_START = TEMPLATES_END;
const CUSTOM_END = CUSTOM_START + DASHBOARD_VIDEO_FRAMES;
const CTA_START = CUSTOM_END;
const CTA_DURATION = 240;

function IntroScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    fps,
    frame,
    config: { damping: 10, mass: 0.35, stiffness: 280 },
  });

  const taglineOpacity = interpolate(frame, [16, 32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [16, 32], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const sceneOpacity = interpolate(frame, [INTRO_END - 14, INTRO_END], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (frame >= INTRO_END) {
    return null;
  }

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        fontFamily: GEIST_FONT,
        justifyContent: "center",
        opacity: sceneOpacity,
      }}
    >
      <div style={{ transform: `scale(${logoScale})` }}>
        <OfficialLogo height={140} variant="dark" />
      </div>
      <p
        style={{
          color: "#444",
          fontSize: 34,
          fontWeight: 500,
          margin: "24px 0 0",
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
        }}
      >
        &ldquo;As seen on&rdquo; press strips for Shopify
      </p>
    </AbsoluteFill>
  );
}

function TemplatesScene() {
  const frame = useCurrentFrame();

  if (frame < CHOICE_START || frame >= CUSTOM_START) {
    return null;
  }

  return (
    <AbsoluteFill style={{ background: "#fafafa", fontFamily: GEIST_FONT }}>
      <ChoiceHeader endFrame={CHOICE_END} startFrame={CHOICE_START} />
      {TEMPLATES.map((template, index) => {
        const enterFrame = TEMPLATE_START + index * TEMPLATE_SLOT;
        const exitFrame = enterFrame + TEMPLATE_SLOT;

        return (
          <AbsoluteFill key={template.id}>
            <TemplateCard
              enterFrame={enterFrame}
              exitFrame={exitFrame}
              template={template}
            />
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
}

function CustomScene() {
  const frame = useCurrentFrame();

  if (frame < CUSTOM_START || frame >= CTA_START) {
    return null;
  }

  return (
    <AbsoluteFill style={{ background: "#fafafa", fontFamily: GEIST_FONT }}>
      <DashboardClip endFrame={CUSTOM_END} startFrame={CUSTOM_START} />
    </AbsoluteFill>
  );
}

function CtaScene() {
  const frame = useCurrentFrame();

  if (frame < CTA_START) {
    return null;
  }

  return (
    <AbsoluteFill>
      <CtaScreen
        endFrame={CTA_START + CTA_DURATION}
        startFrame={CTA_START}
      />
    </AbsoluteFill>
  );
}

export function PresswallPromo() {
  return (
    <AbsoluteFill style={{ background: "#0a0a0a", fontFamily: GEIST_FONT }}>
      <IntroScene />
      <TemplatesScene />
      <CustomScene />
      <CtaScene />
    </AbsoluteFill>
  );
}

export const PROMO_DURATION_FRAMES = CTA_START + CTA_DURATION;