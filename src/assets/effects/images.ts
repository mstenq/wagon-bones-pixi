import burnImg from "@/assets/effects/burn.png";
import displacementHeatImg from "@/assets/effects/displacement-heat.png.png";
import emberImg from "@/assets/effects/ember.png";
import arcaneNoiseAImg from "@/assets/noise/Perlin/Perlin_14-512x512.png";
import sparkleImg from "@/assets/effects/sparkle.png";

export const EFFECT_IMAGES = {
  burn: burnImg,
  displacementHeat: displacementHeatImg,
  ember: emberImg,
  arcaneNoiseA: arcaneNoiseAImg,
  sparkle: sparkleImg,
} as const;

export type EffectImageKey = keyof typeof EFFECT_IMAGES;
