import { loadFont } from "@remotion/google-fonts/Geist";

export const { fontFamily: GEIST_FONT } = loadFont("normal", {
  subsets: ["latin"],
  weights: ["400", "500", "600", "700", "800"],
});