import type { ItemType } from "@/data/items";

import aceInTheHoleImg from "@/assets/items/01.png";
import antiqueRevolverImg from "@/assets/items/02.png";
import bankNoteImg from "@/assets/items/03.png";
import bargainBinImg from "@/assets/items/04.png";
import blessedHerdImg from "@/assets/items/05.png";

export const ITEM_IMAGES: Record<ItemType, string> = {
  ace_in_the_hole: aceInTheHoleImg,
  antique_revolver: antiqueRevolverImg,
  bank_note: bankNoteImg,
  bargain_bin: bargainBinImg,
  blessed_herd: blessedHerdImg,
};
