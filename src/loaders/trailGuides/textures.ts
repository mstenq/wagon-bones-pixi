import trailGuidesAtlasData from '@/assets/trail-guides/trail_guides.json';
import trailGuidesAtlasImage from '@/assets/trail-guides/trail_guides.png';
import { createSpritesheetLoader } from '@/loaders/shared/spritesheet';
import type { SpritesheetData, Texture } from 'pixi.js';

const trailGuidesLoader = createSpritesheetLoader(
  'trail-guides-atlas-image',
  trailGuidesAtlasImage,
  trailGuidesAtlasData as SpritesheetData,
);

export const trailGuideTexturesReady = trailGuidesLoader.texturesReady;

export function getTrailGuideTexture(defId: string): Texture {
  return trailGuidesLoader.getTexture(`${defId}.png`);
}
