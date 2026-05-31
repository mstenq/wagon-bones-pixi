import burnImg from "@/assets/effects/burn.png";
import cloudPuffImg from "@/assets/effects/cloud-puff.png";
import displacementHeatImg from "@/assets/effects/displacement-heat.png.png";
import emberImg from "@/assets/effects/ember.png";
import ghostFaceImg from "@/assets/effects/ghost-face.png";
import ghostFaceInvertedImg from "@/assets/effects/ghost-face-inverted.png";
import lightningBoltImg from "@/assets/effects/lightning-bolt.png";
import snowflakeImg from "@/assets/effects/snowflake.png";
import sparkleImg from "@/assets/effects/sparkle.png";
import wispImg from "@/assets/effects/wisp.png";

export const EFFECT_IMAGES = {
  burn: burnImg,
  cloudPuff: cloudPuffImg,
  displacementHeat: displacementHeatImg,
  ember: emberImg,
  ghostFace: ghostFaceImg,
  ghostFaceInverted: ghostFaceInvertedImg,
  lightningBolt: lightningBoltImg,
  snowflake: snowflakeImg,
  sparkle: sparkleImg,
  wisp: wispImg,
} as const;

export type EffectImageKey = keyof typeof EFFECT_IMAGES;
