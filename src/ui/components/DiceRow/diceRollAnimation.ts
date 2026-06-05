import { ANIM } from '@/game/Constants';
import type { DiceEnhancement } from '@/game/types';
import type { DieHandle } from '@/ui/components/Dice/Die';

export function rollSpinValue(enhancement: DiceEnhancement): number {
  if (enhancement === 'stone') {
    return 0;
  }
  return Math.ceil(Math.random() * 12);
}

export type ActiveRollSession = {
  dieIds: string[];
  finalValues: Record<string, number>;
  enhancements: Record<string, DiceEnhancement>;
  startedAt: number;
  lastSpinAt: number;
  spinValues: Record<string, number>;
};

export function createRollSession(
  dieIds: string[],
  finalValues: Record<string, number>,
  enhancements: Record<string, DiceEnhancement>,
): ActiveRollSession {
  const spinValues: Record<string, number> = {};
  for (const id of dieIds) {
    spinValues[id] = rollSpinValue(enhancements[id] ?? null);
  }
  const now = performance.now();
  return {
    dieIds,
    finalValues,
    enhancements,
    startedAt: now,
    lastSpinAt: now,
    spinValues,
  };
}

/** Returns true when the roll animation has finished. */
export function stepRollAnimation(session: ActiveRollSession, dieRefs: Map<string, DieHandle | null>): boolean {
  const now = performance.now();
  const elapsed = now - session.startedAt;
  const progress = Math.min(elapsed / ANIM.ROLL_DURATION, 1);
  const spinning = progress < 1;

  if (spinning) {
    if (now - session.lastSpinAt >= ANIM.ROLL_INTERVAL) {
      session.lastSpinAt = now;
      for (const id of session.dieIds) {
        session.spinValues[id] = rollSpinValue(session.enhancements[id] ?? null);
      }
    }

    const easeOut = 1 - (1 - progress) ** 3;
    const bounce = 1 + Math.sin(progress * Math.PI * 6) * 0.1 * (1 - progress);

    for (const id of session.dieIds) {
      dieRefs.get(id)?.setFrame({
        rotation: easeOut * Math.PI * 10,
        scale: bounce,
        value: session.spinValues[id] ?? 1,
      });
    }
    return false;
  }

  for (const id of session.dieIds) {
    dieRefs.get(id)?.setFrame({
      rotation: 0,
      scale: 1,
      value: session.finalValues[id] ?? 1,
    });
    dieRefs.get(id)?.reset();
  }

  return true;
}
