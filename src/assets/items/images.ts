import type { ItemType } from "@/data/items";

import aceInTheHoleImg from "@/assets/items/ace_in_the_hole.png";
import antiqueRevolverImg from "@/assets/items/antique_revolver.png";
import bankNoteImg from "@/assets/items/bank_note.png";
import bargainBinImg from "@/assets/items/bargain_bin.png";
import blessedHerdImg from "@/assets/items/blessed_herd.png";

export const ITEM_IMAGES: Record<ItemType, string> = {
  ace_in_the_hole: aceInTheHoleImg,
  antique_revolver: antiqueRevolverImg,
  bank_note: bankNoteImg,
  bargain_bin: bargainBinImg,
  blessed_herd: blessedHerdImg,
};
