import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { GEIST_FONT } from "../fonts";
import {
  getPublisherLogoSrc,
  getPublisherLogoStyle,
} from "../logo-style";
import { SHOWCASE_PUBLISHERS, type TemplateDefinition } from "../template-data";

const LOGO_HEIGHT = 48;
const LOGO_MAX_WIDTH = 170;
const CONTENT_MAX_WIDTH = 820;

function PublisherLogo({
  id,
  template,
}: {
  id: string;
  template: TemplateDefinition;
}) {
  return (
    <Img
      src={staticFile(getPublisherLogoSrc(id, template))}
      style={{
        height: LOGO_HEIGHT,
        maxWidth: LOGO_MAX_WIDTH,
        objectFit: "contain",
        width: "auto",
        ...getPublisherLogoStyle(template),
      }}
    />
  );
}

function BarLogos({ template }: { template: TemplateDefinition }) {
  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        justifyContent: "space-between",
        width: "100%",
      }}
    >
      {SHOWCASE_PUBLISHERS.map((id) => (
        <div
          key={id}
          style={{
            alignItems: "center",
            display: "flex",
            flex: 1,
            justifyContent: "center",
            minWidth: 0,
            padding: "0 14px",
          }}
        >
          <PublisherLogo id={id} template={template} />
        </div>
      ))}
    </div>
  );
}

function MarqueeLogos({
  speed = 2.5,
  template,
}: {
  speed?: number;
  template: TemplateDefinition;
}) {
  const frame = useCurrentFrame();
  const gap = template.marqueeGap ?? 64;
  const itemWidth = LOGO_MAX_WIDTH + gap;
  const segmentWidth = SHOWCASE_PUBLISHERS.length * itemWidth;
  const offset = (frame * speed) % segmentWidth;
  const logos = [
    ...SHOWCASE_PUBLISHERS,
    ...SHOWCASE_PUBLISHERS,
    ...SHOWCASE_PUBLISHERS,
  ];

  return (
    <div style={{ flex: 1, overflow: "hidden" }}>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap,
          transform: `translateX(-${offset}px)`,
          width: "max-content",
        }}
      >
        {logos.map((id, index) => (
          <div key={`${id}-${index}`} style={{ flexShrink: 0 }}>
            <PublisherLogo id={id} template={template} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TemplateStrip({ template }: { template: TemplateDefinition }) {
  const isMarquee = template.layout === "marquee";
  const usesInlineHeading = isMarquee && template.headingAlignment === "left";
  const isDark = template.backgroundColor === "#0a0a0a";

  return (
    <div
      style={{
        background:
          template.backgroundColor === "transparent"
            ? "#ffffff"
            : template.backgroundColor,
        border:
          template.backgroundColor === "transparent"
            ? "1px solid #e8e8e8"
            : isDark
              ? "1px solid #222"
              : "none",
        borderRadius: 20,
        boxShadow: isDark
          ? "0 28px 80px rgba(0,0,0,0.35)"
          : "0 24px 70px rgba(0,0,0,0.1)",
        margin: "0 auto",
        maxWidth: 1240,
        overflow: "hidden",
        padding: "48px 64px",
        width: "88%",
      }}
    >
      {usesInlineHeading ? (
        <div style={{ alignItems: "center", display: "flex", gap: 40 }}>
          <p
            style={{
              color: template.textColor,
              flexShrink: 0,
              fontFamily: GEIST_FONT,
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "0.12em",
              margin: 0,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            {template.headingText}
          </p>
          <MarqueeLogos speed={template.marqueeSpeed} template={template} />
        </div>
      ) : (
        <>
          <p
            style={{
              color: template.textColor,
              fontFamily: GEIST_FONT,
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "0.12em",
              margin: "0 0 36px",
              textAlign: template.headingAlignment,
              textTransform: "uppercase",
            }}
          >
            {template.headingText}
          </p>
          <div style={{ margin: "0 auto", maxWidth: CONTENT_MAX_WIDTH }}>
            <BarLogos template={template} />
          </div>
        </>
      )}
    </div>
  );
}

export function TemplateCard({
  durationInFrames,
  template,
}: {
  durationInFrames: number;
  template: TemplateDefinition;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    fps,
    frame,
    config: { damping: 16, mass: 0.4, stiffness: 200 },
  });

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 10, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const labelY = interpolate(enter, [0, 1], [16, 0]);
  const stripY = interpolate(enter, [0, 1], [28, 0]);
  const scale = 0.96 + enter * 0.04;

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
        gap: 32,
        height: "100%",
        justifyContent: "center",
        opacity: fadeOut,
        transform: `scale(${scale})`,
        width: "100%",
      }}
    >
      <div style={{ transform: `translateY(${labelY}px)` }}>
        <p
          style={{
            color: "#888",
            fontFamily: GEIST_FONT,
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "0.16em",
            margin: "0 0 10px",
            textAlign: "center",
            textTransform: "uppercase",
          }}
        >
          Template
        </p>
        <h2
          style={{
            color: "#111",
            fontFamily: GEIST_FONT,
            fontSize: 56,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            margin: 0,
            textAlign: "center",
          }}
        >
          {template.name}
        </h2>
      </div>
      <div style={{ transform: `translateY(${stripY}px)`, width: "100%" }}>
        <TemplateStrip template={template} />
      </div>
    </div>
  );
}
