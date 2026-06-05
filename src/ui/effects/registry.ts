import { arcaneEffect } from '@/ui/effects/definitions/arcane';
import { fireEffect } from '@/ui/effects/definitions/fire';
import { ghostEffect } from '@/ui/effects/definitions/ghost';
import { holyEffect } from '@/ui/effects/definitions/holy';
import type { EffectDefinition, EffectId } from '@/ui/effects/types';

export const EFFECT_DEFINITIONS: EffectDefinition[] = [holyEffect, fireEffect, arcaneEffect, ghostEffect];

const byId = new Map(EFFECT_DEFINITIONS.map((d) => [d.id, d]));

export function getEffectDefinition(id: EffectId): EffectDefinition | undefined {
  if (id === 'none') {
    return undefined;
  }
  return byId.get(id);
}
