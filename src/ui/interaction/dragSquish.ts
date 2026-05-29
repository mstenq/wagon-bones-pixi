/** Spring-driven grab scale (rubber-band feel). */
export type SquishState = {
  scaleX: number;
  scaleY: number;
  velX: number;
  velY: number;
  targetX: number;
  targetY: number;
};

export type SquishTargets = {
  scaleX: number;
  scaleY: number;
};

export const SQUISH_IDLE: SquishTargets = { scaleX: 1, scaleY: 1 };
/** Quick compress on pointer down. */
export const SQUISH_GRAB: SquishTargets = { scaleX: 1.06, scaleY: 0.82 };
/** Slightly enlarged while dragging. */
export const SQUISH_DRAG: SquishTargets = { scaleX: 1.14, scaleY: 1.14 };

const STIFFNESS = 220;
const DAMPING = 16;

export function createSquishState(target: SquishTargets = SQUISH_IDLE): SquishState {
  return {
    scaleX: 1,
    scaleY: 1,
    velX: 0,
    velY: 0,
    targetX: target.scaleX,
    targetY: target.scaleY,
  };
}

export function setSquishTarget(state: SquishState, target: SquishTargets): void {
  state.targetX = target.scaleX;
  state.targetY = target.scaleY;
}

/** Advance spring toward target; `dt` in seconds (~1/60 per tick). */
export function stepSquish(state: SquishState, dt: number): void {
  const ax = (state.targetX - state.scaleX) * STIFFNESS;
  const ay = (state.targetY - state.scaleY) * STIFFNESS;
  const damp = Math.exp(-DAMPING * dt);

  state.velX = (state.velX + ax * dt) * damp;
  state.velY = (state.velY + ay * dt) * damp;
  state.scaleX += state.velX * dt;
  state.scaleY += state.velY * dt;
}

export function isSquishSettled(state: SquishState, epsilon = 0.004): boolean {
  return (
    Math.abs(state.targetX - state.scaleX) < epsilon &&
    Math.abs(state.targetY - state.scaleY) < epsilon &&
    Math.abs(state.velX) < epsilon &&
    Math.abs(state.velY) < epsilon
  );
}
