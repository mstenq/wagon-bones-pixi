import cardboardButton1Img from "@/assets/general/cardboard-button/cardboard-button-1.png";
import cardboardButton2Img from "@/assets/general/cardboard-button/cardboard-button-2.png";
import cardboardButton3Img from "@/assets/general/cardboard-button/cardboard-button-3.png";
import cardboardButton4Img from "@/assets/general/cardboard-button/cardboard-button-4.png";
import cardboardButton5Img from "@/assets/general/cardboard-button/cardboard-button-5.png";

export const CARDBOARD_BUTTON_VARIANTS = ["1", "2", "3", "4", "5"] as const;

export type CardboardButtonVariant = (typeof CARDBOARD_BUTTON_VARIANTS)[number];

export const CARDBOARD_BUTTON_IMAGES: Record<CardboardButtonVariant, string> = {
  "1": cardboardButton1Img,
  "2": cardboardButton2Img,
  "3": cardboardButton3Img,
  "4": cardboardButton4Img,
  "5": cardboardButton5Img,
};
