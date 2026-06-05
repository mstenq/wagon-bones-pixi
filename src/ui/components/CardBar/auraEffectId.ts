import { EFFECT_IDS, type EffectId } from '@/ui/effects/types';

/**
 * Map stored aura ids to Pixi effect ids.
 * Game data still uses `icy`; the visual layer renamed that aura to `arcane` (see `EFFECT_IDS`).
 */
export function auraIdToEffectId(auraId?: string | null): EffectId {
  if (!auraId) {
    return 'none';
  }
  if (auraId === 'icy') {
    return 'arcane';
  }
  if ((EFFECT_IDS as readonly string[]).includes(auraId)) {
    return auraId as EffectId;
  }
  return 'none';
}
