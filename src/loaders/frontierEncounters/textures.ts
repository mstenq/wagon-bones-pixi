import frontierAtlasData from '@/assets/frontier-encounters/frontier_encounters.json';
import frontierAtlasImage from '@/assets/frontier-encounters/frontier_encounters.png';
import { createSpritesheetLoader } from '@/loaders/shared/spritesheet';
import type { SpritesheetData, Texture } from 'pixi.js';

const frontierLoader = createSpritesheetLoader(
  'frontier-encounters-atlas-image',
  frontierAtlasImage,
  frontierAtlasData as SpritesheetData,
);

export const frontierTexturesReady = frontierLoader.texturesReady;

export function getFrontierTexture(defId: string): Texture {
  return frontierLoader.getTexture(`${defId}.png`);
}
