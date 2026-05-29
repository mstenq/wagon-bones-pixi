import boneImg from "@/assets/dice/bone.png";
import diamondImg from "@/assets/dice/diamond.png";
import goldImg from "@/assets/dice/gold.png";
import loadedImg from "@/assets/dice/loaded.png";
import luckyImg from "@/assets/dice/lucky.png";
import standardImg from "@/assets/dice/standard.png";
import steelImg from "@/assets/dice/steel.png";
import stoneImg from "@/assets/dice/stone.png";
import woodenImg from "@/assets/dice/wooden.png";

export const DICE_COUNT = 8;

export const DICE_TYPES = [
  "standard",
  "wooden",
  "stone",
  "steel",
  "gold",
  "bone",
  "diamond",
  "lucky",
  "loaded",
] as const;

export type DiceType = (typeof DICE_TYPES)[number];

export const DICE_LABELS: Record<DiceType, string> = {
  standard: "Standard",
  wooden: "Wooden",
  stone: "Stone",
  steel: "Steel",
  gold: "Gold",
  bone: "Bone",
  diamond: "Diamond",
  lucky: "Lucky",
  loaded: "Loaded",
};

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

export function rollD12(): number {
  return Math.floor(Math.random() * 12) + 1;
}

export function rollMany(count: number): number[] {
  return Array.from({ length: count }, rollD12);
}
