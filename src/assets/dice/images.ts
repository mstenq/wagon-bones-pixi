import type { DiceType } from "@/data/dice";

import boneImg from "@/assets/dice/bone.png";
import diamondImg from "@/assets/dice/diamond.png";
import goldImg from "@/assets/dice/gold.png";
import loadedImg from "@/assets/dice/loaded.png";
import luckyImg from "@/assets/dice/lucky.png";
import standardImg from "@/assets/dice/standard.png";
import steelImg from "@/assets/dice/steel.png";
import stoneImg from "@/assets/dice/stone.png";
import woodenImg from "@/assets/dice/wooden.png";

export const DICE_IMAGES: Record<DiceType, string> = {
  standard: standardImg,
  wooden: woodenImg,
  stone: stoneImg,
  steel: steelImg,
  gold: goldImg,
  bone: boneImg,
  diamond: diamondImg,
  lucky: luckyImg,
  loaded: loadedImg,
};
