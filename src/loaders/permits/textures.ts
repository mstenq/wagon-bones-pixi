import permitsAtlasData from '@/assets/permits/permits.json';
import permitsAtlasImage from '@/assets/permits/permits.png';
import { createSpritesheetLoader } from '@/loaders/shared/spritesheet';
import type { SpritesheetData, Texture } from 'pixi.js';

const permitsLoader = createSpritesheetLoader(
  'permits-atlas-image',
  permitsAtlasImage,
  permitsAtlasData as SpritesheetData,
);

export const permitTexturesReady = permitsLoader.texturesReady;

export function getPermitTexture(permitId: string): Texture {
  return permitsLoader.getTexture(`${permitId}.png`);
}
