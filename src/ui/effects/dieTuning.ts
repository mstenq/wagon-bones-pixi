import type { AuraMountContext } from "@/ui/effects/types";
import type { BorderBounds } from "@/ui/effects/shared/borderFrame";
import { hostIsDie } from "@/ui/effects/shared/borderFrame";

export const DIE_AURA_PADDING = 12;
export const CARD_AURA_PADDING = 18;

export function dieHalfSize(mount: AuraMountContext): number {
  return Math.min(mount.width, mount.height) / 2;
}

export function isDieMount(mount: AuraMountContext): boolean {
  return hostIsDie(mount.hostKind);
}

/** Die: tight but readable in an 8-dice row. Card: full padded bounds. */
export function auraEffectRadius(mount: AuraMountContext, bounds: BorderBounds): number {
  if (isDieMount(mount)) {
    return dieHalfSize(mount) * 1.14;
  }
  return Math.min(bounds.halfW, bounds.halfH) * 0.96;
}

export function tightDieBounds(mount: AuraMountContext): BorderBounds {
  const r = dieHalfSize(mount) * 0.96;
  return { halfW: r, halfH: r, cornerRadius: 0 };
}

export function dieBlurPadding(mount: AuraMountContext): number {
  return isDieMount(mount) ? 10 : mount.padding;
}

export function dieBlurStrength(mount: AuraMountContext, cardStrength: number): number {
  return isDieMount(mount) ? cardStrength * 0.55 : cardStrength;
}

export function hostParticleScale(mount: AuraMountContext): number {
  return isDieMount(mount) ? 0.72 : 1;
}

export function hostPadding(mount: AuraMountContext): number {
  return isDieMount(mount) ? DIE_AURA_PADDING : CARD_AURA_PADDING;
}
