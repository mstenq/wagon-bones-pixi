import suppliesAtlasData from '@/assets/supplies/supplies.json';
import suppliesAtlasImage from '@/assets/supplies/supplies.png';
import { createSpritesheetLoader } from '@/loaders/shared/spritesheet';
import type { SpritesheetData, Texture } from 'pixi.js';

const suppliesLoader = createSpritesheetLoader(
  'supplies-atlas-image',
  suppliesAtlasImage,
  suppliesAtlasData as SpritesheetData,
);

export const supplyTexturesReady = suppliesLoader.texturesReady;

export function getSupplyTexture(defId: string): Texture {
  return suppliesLoader.getTexture(`${defId}.png`);
}
