import { useState } from "react";

import {
  CardboardButton,
  CARDBOARD_BUTTON_VARIANTS,
} from "@/ui/components/CardboardButton/CardboardButton";
import type { StoryDefinition } from "@/ui/types/storyTypes";
import { panelLabelClass, panelSelectClass } from "@/ui/styles/panelControls";

function CardboardButtonStory() {
  const [label, setLabel] = useState("Roll Dice");

  return (
    <div className="flex flex-col items-center gap-8">
      <label className={panelLabelClass}>
        Label
        <input
          className={panelSelectClass}
          type="text"
          maxLength={32}
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />
      </label>

      <div className="flex w-full max-w-5xl flex-wrap justify-center gap-8 rounded-xl bg-ui-panel p-8">
        {CARDBOARD_BUTTON_VARIANTS.map((variant) => (
          <div key={variant} className="flex flex-col items-center gap-2">
            <CardboardButton
              variant={variant}
              label={label}
              onClick={() => console.log(`clicked:variant=${variant}`)}
            />
            <span className="text-sm text-white/70">variant=&quot;{variant}&quot;</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const cardboardButtonStory: StoryDefinition = {
  name: "CardboardButton",
  component: <CardboardButtonStory />,
};

export default cardboardButtonStory;
