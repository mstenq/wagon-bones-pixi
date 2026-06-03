import { Color, TextStyle } from "pixi.js";

import {
  CARDBOARD_BUTTON_LABEL_FONT_SIZE,
  CARDBOARD_BUTTON_TEXT_DISABLED_HEX,
  CARDBOARD_BUTTON_TEXT_HEX,
  CARDBOARD_BUTTON_TEXT_SHADOW_HEX,
} from "@/ui/cardboard/buttonTheme";

export function cardboardButtonLabelStyle(disabled: boolean): TextStyle {
  return new TextStyle({
    fontFamily: '"Jersey 10", sans-serif',
    fontSize: CARDBOARD_BUTTON_LABEL_FONT_SIZE,
    fill: disabled
      ? new Color(CARDBOARD_BUTTON_TEXT_DISABLED_HEX).toNumber()
      : new Color(CARDBOARD_BUTTON_TEXT_HEX).toNumber(),
    align: "center",
    dropShadow: disabled
      ? undefined
      : {
          alpha: 0.23,
          angle: Math.PI / 2,
          blur: 0,
          color: new Color(CARDBOARD_BUTTON_TEXT_SHADOW_HEX).toNumber(),
          distance: 2,
        },
  });
}
