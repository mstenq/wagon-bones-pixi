import { EFFECT_DEFINITIONS } from '@/ui/effects/registry';
import type { EffectId } from '@/ui/effects/types';

export const EFFECT_OPTIONS: { id: EffectId; label: string }[] = [
  { id: 'none', label: 'none' },
  ...EFFECT_DEFINITIONS.map((d) => ({ id: d.id, label: d.label })),
];
