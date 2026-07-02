import { Composition } from "remotion";
import { PROMO_DURATION_FRAMES, PresswallPromo } from "./PresswallPromo";

export const FPS = 60;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION_IN_FRAMES = PROMO_DURATION_FRAMES;

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        component={PresswallPromo}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        height={HEIGHT}
        id="PresswallPromo"
        width={WIDTH}
      />
    </>
  );
};