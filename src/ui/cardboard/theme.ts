/**
 * Cardboard panel — `cardboard-tile.png` (1470×916).
 * Source slice = px sampled from PNG corners/edges (Pixi nine-patch + CSS border-image-slice).
 * Rendered border = on-screen frame thickness (Pixi draw width + CSS border-width).
 */
export const CARDBOARD_CONTAINER_SOURCE_SLICE_PX = 40;
export const CARDBOARD_CONTAINER_RENDERED_BORDER_PX = 40;

/** Gap between frame inner edge and row content (cards/dice). */
export const CARDBOARD_CONTAINER_CONTENT_PADDING_PX = 24;

/** @deprecated Use {@link CARDBOARD_CONTAINER_SOURCE_SLICE_PX} */
export const CARDBOARD_CONTAINER_BORDER = CARDBOARD_CONTAINER_SOURCE_SLICE_PX;

/** @deprecated Use {@link CARDBOARD_CONTAINER_CONTENT_PADDING_PX} */
export const CARDBOARD_CONTAINER_PADDING = CARDBOARD_CONTAINER_CONTENT_PADDING_PX;

/**
 * Cardboard button PNGs (~716×195).
 * Source slice matches `--cardboard-button-slice` in CSS; rendered border is thinner in CSS.
 */
export const CARDBOARD_BUTTON_SOURCE_SLICE_PX = 24;

/** @deprecated Use {@link CARDBOARD_BUTTON_SOURCE_SLICE_PX} */
export const CARDBOARD_BUTTON_SOURCE_BORDER = CARDBOARD_BUTTON_SOURCE_SLICE_PX;
