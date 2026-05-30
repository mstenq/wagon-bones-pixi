import type { Filter } from "pixi.js";

export const AURA_IDS = [
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
  "dragon",
  "void",
  "arcane",
] as const;

export type AuraId = (typeof AURA_IDS)[number];

export type AuraHostKind = "card" | "die";

export type AuraFrameContext = {
  dt: number;
  time: number;
  width: number;
  height: number;
  hostKind: AuraHostKind;
  hovered: boolean;
  dragging: boolean;
  activated: boolean;
  tiltX: number;
  tiltY: number;
  pointerNormX: number;
  pointerNormY: number;
  phase: number;
};

export type AuraMountContext = {
  hostKind: AuraHostKind;
  width: number;
  height: number;
  padding: number;
};

export type AuraLayers = {
  back: import("pixi.js").Container;
  front: import("pixi.js").Container;
};

export type AuraArtTarget = {
  applyFilters: (filters: Filter[] | null) => void;
  setJitter: (dx: number, dy: number) => void;
};

export type AuraRuntime = {
  id: AuraId;
  step: (frame: AuraFrameContext) => void;
  destroy: () => void;
};

export type AuraDefinition = {
  id: Exclude<AuraId, "none">;
  label: string;
  create: (layers: AuraLayers, ctx: AuraMountContext, art: AuraArtTarget) => AuraRuntime;
};
