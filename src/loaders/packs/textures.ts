import packsAtlasData from '@/assets/packs/packs.json';
import packsAtlasImage from '@/assets/packs/packs.png';
import { createSpritesheetLoader } from '@/loaders/shared/spritesheet';
import type { SpritesheetData, Texture } from 'pixi.js';

const packsLoader = createSpritesheetLoader(
  'packs-atlas-image',
  packsAtlasImage,
  packsAtlasData as SpritesheetData,
);

export const packTexturesReady = packsLoader.texturesReady;

export function getPackTexture(packDefId: string): Texture {
  return packsLoader.getTexture(`${packDefId}.png`);
}
