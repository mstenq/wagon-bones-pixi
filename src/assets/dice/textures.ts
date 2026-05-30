import { Assets, Texture } from "pixi.js";

import { DICE_TYPES, type DiceType } from "@/data/dice";
import { DICE_IMAGES } from "@/assets/dice/images";

const diceAlias = (type: DiceType) => `dice-${type}`;

let preloadPromise: Promise<void> | null = null;

export function registerDiceAssets(): void {
  for (const type of DICE_TYPES) {
    const alias = diceAlias(type);
    if (!Assets.resolver.hasKey(alias)) {
      Assets.add({ alias, src: DICE_IMAGES[type] });
    }
  }
}

export function preloadDiceTextures(): Promise<void> {
  registerDiceAssets();
  preloadPromise ??= Assets.load(DICE_TYPES.map(diceAlias)).then(() => undefined);
  return preloadPromise;
}

/** Await in React with `use(texturesReady)` — no useEffect needed. */
export const texturesReady = preloadDiceTextures();

export function getDiceTexture(type: DiceType): Texture {
  const alias = diceAlias(type);
  try {
    return Assets.get<Texture>(alias);
  } catch {
    return Texture.from(DICE_IMAGES[type]);
  }
}

export type { DiceType };
