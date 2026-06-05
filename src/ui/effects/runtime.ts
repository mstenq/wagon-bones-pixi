import type { EffectArtTarget, EffectId, EffectLayers, EffectMountContext, EffectRuntime } from '@/ui/effects/types';
import { getEffectDefinition } from '@/ui/effects/registry';

export function createEffectRuntime(
  id: EffectId,
  layers: EffectLayers,
  ctx: EffectMountContext,
  art: EffectArtTarget,
): EffectRuntime | null {
  if (id === 'none') {
    return null;
  }
  const def = getEffectDefinition(id);
  if (!def) {
    return null;
  }
  return def.create(layers, ctx, art);
}

export function stepEffect(runtime: EffectRuntime, frame: import('@/ui/effects/types').EffectFrameContext): void {
  runtime.step(frame);
}

export function destroyEffect(runtime: EffectRuntime): void {
  runtime.destroy();
}
