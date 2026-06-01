import type { Filter, Texture } from "pixi.js";

export type IsfInputType =
  | "image"
  | "float"
  | "bool"
  | "event"
  | "long"
  | "color"
  | "point2D";

export type IsfInput = {
  NAME: string;
  TYPE: IsfInputType;
  DEFAULT?: number | boolean | number[];
  MIN?: number;
  MAX?: number;
  LABEL?: string;
};

export type IsfPass = {
  TARGET?: string;
  PERSISTENT?: boolean;
  WIDTH?: string;
  HEIGHT?: string;
  FLOAT?: boolean;
};

export type IsfMetadata = {
  DESCRIPTION?: string;
  CREDIT?: string;
  CATEGORIES?: string[];
  INPUTS?: IsfInput[];
  PASSES?: IsfPass[];
  IMPORTED?: Record<string, unknown>;
};

export type ParsedIsf = {
  metadata: IsfMetadata;
  body: string;
  credit?: string;
  description?: string;
  categories: string[];
  inputs: IsfInput[];
  filterType: "filter" | "transition" | "generator";
};

export type IsfTickContext = {
  time: number;
  dt: number;
  width: number;
  height: number;
};

export type IsfPixiFilter = {
  filter: Filter;
  metadata: IsfMetadata;
  inputs: IsfInput[];
  tick: (ctx: IsfTickContext) => void;
  setValue: (name: string, value: number | boolean | readonly number[]) => void;
  setImage: (name: string, texture: Texture | null) => void;
};
