import type { SpritesheetData, Texture } from 'pixi.js';

import type { DiceType } from '@/data/dice';
import diceAtlasData from '@/assets/dice/dice.json';
import diceAtlasImage from '@/assets/dice/dice.png';
import { createSpritesheetLoader } from '@/loaders/shared/spritesheet';

const STONE_FACE_FRAME = 'stone.png';

const diceLoader = createSpritesheetLoader('dice-atlas-image', diceAtlasImage, diceAtlasData as SpritesheetData);

/** Await in React with `use(texturesReady)` — no useEffect needed. */
export const texturesReady = diceLoader.texturesReady;

export function getDiceFaceTexture(type: DiceType, face: number): Texture {
  if (type === 'stone') {
    return diceLoader.getTexture(STONE_FACE_FRAME);
  }
  const clamped = Math.min(12, Math.max(1, Math.round(face)));
  const frame = `${type}-${String(clamped).padStart(2, '0')}.png`;
  return diceLoader.getTexture(frame);
}

export type { DiceType };
