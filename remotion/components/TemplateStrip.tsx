import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { GEIST_FONT } from "../fonts";
import { getPublisherLogoStyle } from "../logo-style";
import { SHOWCASE_PUBLISHERS, type TemplateDefinition } from "../template-data";

const LOGO_HEIGHT = 44;
const LOGO_MAX_WIDTH = 160;
const CONTENT_MAX_WIDTH = 760;

function PublisherLogo({
  id,
  template,
}: {
  id: string;
  template: TemplateDefinition;
}) {
  return (
    <Img
      src={staticFile(`publishers/logos/${id}.png`)}
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
            padding: "0 12px",
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

  return (
    <div
      style={{
        background:
          template.backgroundColor === "transparent"
            ? "#ffffff"
            : template.backgroundColor,
        border:
          template.backgroundColor === "transparent"
            ? "1px solid #e5e5e5"
            : "none",
        borderRadius: 16,
        boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
        margin: "0 auto",
        maxWidth: 1200,
        overflow: "hidden",
        padding: "40px 56px",
        width: "90%",
      }}
    >
      {usesInlineHeading ? (
        <div style={{ alignItems: "center", display: "flex", gap: 40 }}>
          <p
            style={{
              color: template.textColor,
              flexShrink: 0,
              fontFamily: GEIST_FONT,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.1em",
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
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.1em",
              margin: "0 0 32px",
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
  enterFrame,
  exitFrame,
  template,
}: {
  enterFrame: number;
  exitFrame: number;
  template: TemplateDefinition;
}) {
  const frame = useCurrentFrame();

  if (frame < enterFrame || frame >= exitFrame) {
    return null;
  }

  const localFrame = frame - enterFrame;
  const popScale = interpolate(localFrame, [0, 8], [0.97, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelY = interpolate(localFrame, [0, 10], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
        gap: 28,
        height: "100%",
        justifyContent: "center",
        transform: `scale(${popScale})`,
        width: "100%",
      }}
    >
      <div style={{ transform: `translateY(${labelY}px)` }}>
        <p
          style={{
            color: "#888",
            fontFamily: GEIST_FONT,
            fontSize: 18,
            fontWeight: 500,
            letterSpacing: "0.14em",
            margin: "0 0 8px",
            textAlign: "center",
            textTransform: "uppercase",
          }}
        >
          Ready-made
        </p>
        <h2
          style={{
            color: "#111",
            fontFamily: GEIST_FONT,
            fontSize: 52,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            margin: 0,
            textAlign: "center",
          }}
        >
          {template.name}
        </h2>
      </div>
      <TemplateStrip template={template} />
    </div>
  );
}