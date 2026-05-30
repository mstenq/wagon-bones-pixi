/** Spring-driven motion for UI (scale squish, lift, slide, etc.). */

export const STIFFNESS = 220;
export const DAMPING = 16;

export type ScalarSpringState = {
  value: number;
  velocity: number;
  target: number;
};

export function createScalarSpring(initial = 0, target = initial): ScalarSpringState {
  return { value: initial, velocity: 0, target };
}

export function setScalarTarget(state: ScalarSpringState, target: number): void {
  state.target = target;
}

/** Advance scalar spring toward target; `dt` in seconds (~1/60 per tick). */
export function stepScalarSpring(state: ScalarSpringState, dt: number): void {
  const acceleration = (state.target - state.value) * STIFFNESS;
  const damp = Math.exp(-DAMPING * dt);

  state.velocity = (state.velocity + acceleration * dt) * damp;
  state.value += state.velocity * dt;
}

export function isScalarSettled(state: ScalarSpringState, epsilon = 0.004): boolean {
  return (
    Math.abs(state.target - state.value) < epsilon &&
    Math.abs(state.velocity) < epsilon
  );
}

/** 2D scale spring (asymmetric rubber-band squash). */
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
export const SQUISH_GRAB: SquishTargets = { scaleX: 1.03, scaleY: 0.91 };
/** Slightly enlarged while dragging. */
export const SQUISH_DRAG: SquishTargets = { scaleX: 1.07, scaleY: 1.07 };
/** Softer grab/drag for large card sprites. */
export const SQUISH_GRAB_CARD: SquishTargets = { scaleX: 1.02, scaleY: 0.95 };
export const SQUISH_DRAG_CARD: SquishTargets = { scaleX: 1.04, scaleY: 1.04 };
/** Brief squash when a card lifts on click. */
export const SQUISH_LIFT: SquishTargets = { scaleX: 1.02, scaleY: 0.96 };

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

/** Jump scale to target — use for instant grab feedback on pointer down. */
export function snapSquish(state: SquishState, target: SquishTargets): void {
  state.scaleX = target.scaleX;
  state.scaleY = target.scaleY;
  state.velX = 0;
  state.velY = 0;
  setSquishTarget(state, target);
}

/** Advance 2D scale spring toward target; `dt` in seconds (~1/60 per tick). */
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
