import burnImg from "@/assets/effects/burn.png";
import displacementHeatImg from "@/assets/effects/displacement-heat.png.png";
import emberImg from "@/assets/effects/ember.png";
import ghostFaceImg from "@/assets/effects/ghost-face.png";
import ghostFaceInvertedImg from "@/assets/effects/ghost-face-inverted.png";
import arcaneNoiseAImg from "@/assets/noise/Perlin/Perlin_14-512x512.png";
import sparkleImg from "@/assets/effects/sparkle.png";
import wispImg from "@/assets/effects/wisp.png";

export const EFFECT_IMAGES = {
  burn: burnImg,
  displacementHeat: displacementHeatImg,
  ember: emberImg,
  ghostFace: ghostFaceImg,
  ghostFaceInverted: ghostFaceInvertedImg,
  arcaneNoiseA: arcaneNoiseAImg,
  sparkle: sparkleImg,
  wisp: wispImg,
} as const;

export type EffectImageKey = keyof typeof EFFECT_IMAGES;
