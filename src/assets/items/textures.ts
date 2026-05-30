import { Assets, Texture } from "pixi.js";

import { ITEM_TYPES, itemTypeForCard, type ItemType } from "@/data/items";
import { ITEM_IMAGES } from "@/assets/items/images";

const itemAlias = (type: ItemType) => `item-${type}`;

let preloadPromise: Promise<void> | null = null;

export function registerItemAssets(): void {
  for (const type of ITEM_TYPES) {
    const alias = itemAlias(type);
    if (!Assets.resolver.hasKey(alias)) {
      Assets.add({ alias, src: ITEM_IMAGES[type] });
    }
  }
}

export function preloadItemTextures(): Promise<void> {
  registerItemAssets();
  preloadPromise ??= Assets.load(ITEM_TYPES.map(itemAlias)).then(() => undefined);
  return preloadPromise;
}

/** Await in React with `use(itemTexturesReady)` — no useEffect needed. */
export const itemTexturesReady = preloadItemTextures();

export function getItemTexture(type: ItemType): Texture {
  const alias = itemAlias(type);
  try {
    return Assets.get<Texture>(alias);
  } catch {
    return Texture.from(ITEM_IMAGES[type]);
  }
}

export function getCardTexture(cardId: number): Texture {
  return getItemTexture(itemTypeForCard(cardId));
}

export type { ItemType };
