import aceInTheHoleImg from "@/assets/items/ace_in_the_hole.png";
import antiqueRevolverImg from "@/assets/items/antique_revolver.png";
import bankNoteImg from "@/assets/items/bank_note.png";
import bargainBinImg from "@/assets/items/bargain_bin.png";
import blessedHerdImg from "@/assets/items/blessed_herd.png";

/** Max cards shown in the hand row (demo default). */
export const CARD_COUNT = 5;

export const ITEM_TYPES = [
  "ace_in_the_hole",
  "antique_revolver",
  "bank_note",
  "bargain_bin",
  "blessed_herd",
] as const;

export type ItemType = (typeof ITEM_TYPES)[number];

export const ITEM_LABELS: Record<ItemType, string> = {
  ace_in_the_hole: "Ace in the Hole",
  antique_revolver: "Antique Revolver",
  bank_note: "Bank Note",
  bargain_bin: "Bargain Bin",
  blessed_herd: "Blessed Herd",
};

export const ITEM_IMAGES: Record<ItemType, string> = {
  ace_in_the_hole: aceInTheHoleImg,
  antique_revolver: antiqueRevolverImg,
  bank_note: bankNoteImg,
  bargain_bin: bargainBinImg,
  blessed_herd: blessedHerdImg,
};

export function itemTypeForCard(cardId: number): ItemType {
  return ITEM_TYPES[cardId % ITEM_TYPES.length]!;
}
