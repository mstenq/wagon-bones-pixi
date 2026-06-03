import type { Filter } from "pixi.js";

export const EFFECT_IDS = [
  "none",
  "holy",
  "fire",
  "icy",
  "ghost",
  "hologram",
  "polychrome",
  "foil",
  "negative",
  "storm",
  "crystal",
  "shadow",
  "cosmic",
  "glitch",
  "circuit",
  "retroDither",
  "dragon",
  "void",
  "arcane",
  "water",
  "squigglePen",
] as const;

export type EffectId = (typeof EFFECT_IDS)[number];

export type EffectHostKind = "card" | "die";

export type EffectFrameContext = {
  dt: number;
  time: number;
  width: number;
  height: number;
  hostKind: EffectHostKind;
  hovered: boolean;
  dragging: boolean;
  activated: boolean;
  tiltX: number;
  tiltY: number;
  pointerNormX: number;
  pointerNormY: number;
  phase: number;
  hideHalo?: boolean;
  surfaceCorners: [
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number },
  ];
};

export type EffectMountContext = {
  hostKind: EffectHostKind;
  width: number;
  height: number;
  padding: number;
  hideHalo?: boolean;
};

export type EffectLayers = {
  back: import("pixi.js").Container;
  front: import("pixi.js").Container;
};

export type EffectArtTarget = {
  applyFilters: (filters: Filter[] | null) => void;
  setJitter: (dx: number, dy: number) => void;
};

export type EffectRuntime = {
  id: EffectId;
  step: (frame: EffectFrameContext) => void;
  destroy: () => void;
};

export type EffectDefinition = {
  id: Exclude<EffectId, "none">;
  label: string;
  create: (layers: EffectLayers, ctx: EffectMountContext, art: EffectArtTarget) => EffectRuntime;
};
