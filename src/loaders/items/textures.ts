import itemsAtlasData from '@/assets/items/items.json';
import itemsAtlasImage from '@/assets/items/items.png';
import { createSpritesheetLoader } from '@/loaders/shared/spritesheet';
import type { SpritesheetData, Texture } from 'pixi.js';

const itemsLoader = createSpritesheetLoader('items-atlas-image', itemsAtlasImage, itemsAtlasData as SpritesheetData);

/** Await in React with `use(itemTexturesReady)` — no useEffect needed. */
export const itemTexturesReady = itemsLoader.texturesReady;

export function getItemTexture(defId: string): Texture {
  return itemsLoader.getTexture(`${defId}.png`);
}
