import { ANIM } from '@/game/Constants';
import type { DiceEnhancement } from '@/game/types';
import type { DieHandle } from '@/ui/components/Dice/Die';
import { easeOutQuadRaw } from '@/ui/interaction/easing';

export function rollSpinValue(enhancement: DiceEnhancement): number {
  if (enhancement === 'stone') {
    return 0;
  }
  return Math.ceil(Math.random() * 12);
}

export type RollAnimationPhase = 'spinning' | 'bouncing' | 'done';

export type ActiveRollSession = {
  dieIds: string[];
  finalValues: Record<string, number>;
  enhancements: Record<string, DiceEnhancement>;
  startedAt: number;
  lastSpinAt: number;
  spinValues: Record<string, number>;
  phase: RollAnimationPhase;
  bounceStartedAt: number | null;
  landSoundPlayed: boolean;
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
    phase: 'spinning',
    bounceStartedAt: null,
    landSoundPlayed: false,
  };
}

const BOUNCE_SCALE_X = 1.15;
const BOUNCE_SCALE_Y = 0.9;

function applyBounceScale(
  session: ActiveRollSession,
  dieRefs: Map<string, DieHandle | null>,
  progress: number,
): void {
  const eased = easeOutQuadRaw(progress);
  const yoyo = progress < 0.5 ? eased * 2 : (1 - eased) * 2;
  const scaleX = 1 + (BOUNCE_SCALE_X - 1) * yoyo;
  const scaleY = 1 + (BOUNCE_SCALE_Y - 1) * yoyo;

  for (const id of session.dieIds) {
    dieRefs.get(id)?.setFrame({
      rotation: 0,
      scale: 1,
      value: session.finalValues[id] ?? 1,
    });
    dieRefs.get(id)?.setSquishScale(scaleX, scaleY);
  }
}

function setFinalFaces(session: ActiveRollSession, dieRefs: Map<string, DieHandle | null>): void {
  for (const id of session.dieIds) {
    dieRefs.get(id)?.setFrame({
      rotation: 0,
      scale: 1,
      value: session.finalValues[id] ?? 1,
    });
  }
}

/** Returns the current roll animation phase. */
export function stepRollAnimation(session: ActiveRollSession, dieRefs: Map<string, DieHandle | null>): RollAnimationPhase {
  const now = performance.now();

  if (session.phase === 'spinning') {
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
      return 'spinning';
    }

    setFinalFaces(session, dieRefs);
    session.phase = 'bouncing';
    session.bounceStartedAt = now;
    return 'bouncing';
  }

  if (session.phase === 'bouncing') {
    const bounceStart = session.bounceStartedAt ?? now;
    const bounceElapsed = now - bounceStart;
    const bounceProgress = Math.min(bounceElapsed / ANIM.ROLL_BOUNCE_DURATION, 1);

    applyBounceScale(session, dieRefs, bounceProgress);

    if (bounceProgress >= 1) {
      for (const id of session.dieIds) {
        dieRefs.get(id)?.setFrame({
          rotation: 0,
          scale: 1,
          value: session.finalValues[id] ?? 1,
        });
        dieRefs.get(id)?.reset();
        dieRefs.get(id)?.setSquishScale(1, 1);
      }
      session.phase = 'done';
      return 'done';
    }

    return 'bouncing';
  }

  return 'done';
}
