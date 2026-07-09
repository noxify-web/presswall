import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  staticFile,
} from "remotion";
import { BrandIntro } from "./components/BrandIntro";
import { ChoiceHeader } from "./components/ChoiceHeader";
import { CtaScreen } from "./components/CtaScreen";
import { DashboardClip } from "./components/DashboardClip";
import { FeaturesScene } from "./components/FeaturesScene";
import { HookScene } from "./components/HookScene";
import { TemplateCard } from "./components/TemplateStrip";
import { GEIST_FONT } from "./fonts";
import { TEMPLATES } from "./template-data";
import { DASHBOARD_VIDEO_FRAMES } from "./video-config";

/**
 * Timeline (60 fps)
 *
 *  Hook          0 – 150     (2.5s)  problem statement
 *  Brand       150 – 270     (2.0s)  logo + name
 *  Features    270 – 480     (3.5s)  3-step value props
 *  Choice      480 – 570     (1.5s)  templates teaser
 *  Templates   570 – 1050    (8.0s)  4 templates × 2s
 *  Dashboard  1050 – 2486   (23.9s)  screen recording
 *  CTA        2486 – 2726    (4.0s)  install CTA
 */
const HOOK = 150;
const BRAND = 120;
const FEATURES = 210;
const CHOICE = 90;
const TEMPLATE_SLOT = 120;
const TEMPLATES_TOTAL = TEMPLATES.length * TEMPLATE_SLOT;
const CTA = 240;

const HOOK_START = 0;
const BRAND_START = HOOK_START + HOOK;
const FEATURES_START = BRAND_START + BRAND;
const CHOICE_START = FEATURES_START + FEATURES;
const TEMPLATES_START = CHOICE_START + CHOICE;
const DASHBOARD_START = TEMPLATES_START + TEMPLATES_TOTAL;
const CTA_START = DASHBOARD_START + DASHBOARD_VIDEO_FRAMES;

export const PROMO_DURATION_FRAMES = CTA_START + CTA;

/** Background music under dialogue-free promo (0–1). */
const BG_MUSIC_VOLUME = 0.4;
const BG_MUSIC_FADE_IN_FRAMES = 60; // 1.0s
const BG_MUSIC_FADE_OUT_FRAMES = 90; // 1.5s

function bgMusicVolume(frame: number): number {
  return interpolate(
    frame,
    [
      0,
      BG_MUSIC_FADE_IN_FRAMES,
      PROMO_DURATION_FRAMES - BG_MUSIC_FADE_OUT_FRAMES,
      PROMO_DURATION_FRAMES,
    ],
    [0, BG_MUSIC_VOLUME, BG_MUSIC_VOLUME, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
}

export function PresswallPromo() {
  return (
    <AbsoluteFill style={{ background: "#0a0a0a", fontFamily: GEIST_FONT }}>
      <Audio src={staticFile("audio/bg-music.mp3")} volume={bgMusicVolume} />

      {/* 1. Hook — press logos + problem statement */}
      <Sequence durationInFrames={HOOK} from={HOOK_START} name="Hook">
        <HookScene durationInFrames={HOOK} />
      </Sequence>

      {/* 2. Brand intro */}
      <Sequence durationInFrames={BRAND} from={BRAND_START} name="Brand">
        <BrandIntro durationInFrames={BRAND} />
      </Sequence>

      {/* 3. How it works */}
      <Sequence
        durationInFrames={FEATURES}
        from={FEATURES_START}
        name="Features"
      >
        <FeaturesScene durationInFrames={FEATURES} />
      </Sequence>

      {/* 4. Templates teaser */}
      <Sequence durationInFrames={CHOICE} from={CHOICE_START} name="Choice">
        <AbsoluteFill style={{ background: "#fafafa" }}>
          <ChoiceHeader durationInFrames={CHOICE} />
        </AbsoluteFill>
      </Sequence>

      {/* 5. Template showcase — hard cuts, one per slot */}
      {TEMPLATES.map((template, index) => {
        const from = TEMPLATES_START + index * TEMPLATE_SLOT;
        return (
          <Sequence
            key={template.id}
            durationInFrames={TEMPLATE_SLOT}
            from={from}
            name={`Template-${template.id}`}
          >
            <AbsoluteFill style={{ background: "#fafafa" }}>
              <TemplateCard
                durationInFrames={TEMPLATE_SLOT}
                template={template}
              />
            </AbsoluteFill>
          </Sequence>
        );
      })}

      {/* 6. Dashboard screen recording */}
      <Sequence
        durationInFrames={DASHBOARD_VIDEO_FRAMES}
        from={DASHBOARD_START}
        name="Dashboard"
      >
        <DashboardClip />
      </Sequence>

      {/* 7. CTA */}
      <Sequence durationInFrames={CTA} from={CTA_START} name="CTA">
        <CtaScreen durationInFrames={CTA} />
      </Sequence>
    </AbsoluteFill>
  );
}
