import type { ConsumableCategory } from '@/game/ConsumablesSystem';
import { getConsumableAtlasKey } from '@/game/ConsumablesSystem';
import { getFrontierTexture } from '@/loaders/frontierEncounters/textures';
import { getItemTexture } from '@/loaders/items/textures';
import { getPackTexture } from '@/loaders/packs/textures';
import { getPermitTexture } from '@/loaders/permits/textures';
import { getSupplyTexture } from '@/loaders/supplies/textures';
import { getTrailGuideTexture } from '@/loaders/trailGuides/textures';
import { itemTexturesReady } from '@/loaders/items/textures';
import { supplyTexturesReady } from '@/loaders/supplies/textures';
import { trailGuideTexturesReady } from '@/loaders/trailGuides/textures';
import { frontierTexturesReady } from '@/loaders/frontierEncounters/textures';
import { permitTexturesReady } from '@/loaders/permits/textures';
import { packTexturesReady } from '@/loaders/packs/textures';
import { cardTemplateTexturesReady } from '@/loaders/cardTemplates/textures';
import type { Texture } from 'pixi.js';

export const shopCardTexturesReady = Promise.all([
  itemTexturesReady,
  supplyTexturesReady,
  trailGuideTexturesReady,
  frontierTexturesReady,
  permitTexturesReady,
  packTexturesReady,
  cardTemplateTexturesReady,
]).then(() => undefined);

function getConsumableTexture(defId: string, category: ConsumableCategory): Texture {
  const atlasKey = getConsumableAtlasKey(category);
  if (atlasKey === 'supplies') {
    return getSupplyTexture(defId);
  }
  if (atlasKey === 'trail_guides') {
    return getTrailGuideTexture(defId);
  }
  return getFrontierTexture(defId);
}

export function getShopEquipmentTexture(defId: string): Texture {
  return getItemTexture(defId);
}

export function getShopConsumableTexture(defId: string, category: ConsumableCategory): Texture {
  return getConsumableTexture(defId, category);
}

export function getShopPermitTexture(permitId: string): Texture {
  return getPermitTexture(permitId);
}

export function getShopPackTexture(packDefId: string): Texture {
  return getPackTexture(packDefId);
}

export { getCardTemplateTexture } from '@/loaders/cardTemplates/textures';
