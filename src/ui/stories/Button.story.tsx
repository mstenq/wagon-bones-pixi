import { Application } from "@pixi/react";

import { Button, BUTTON_VARIANTS, type ButtonVariant } from "@/ui/components/Button/Button";
import { ButtonElement } from "@/ui/components/Button/ButtonElement";
import { useQueryParam } from "@/ui/hooks/useQueryParam";
import { PIXI_RENDERER_PREFERENCE } from "@/ui/pixi/appDefaults";
import type { StoryDefinition } from "@/ui/types/storyTypes";
import { panelButtonClass, panelLabelClass, panelSelectClass } from "@/ui/styles/panelControls";
import { UI_BACKGROUND_COLOR } from "../uiConstants";

const DOM_LABELS: Record<ButtonVariant, string> = {
  primary: "Play",
  secondary: "Skip",
  success: "Confirm",
  danger: "Fold",
  warning: "Options",
};

const PIXI_GRID: { variant: ButtonVariant; label: string; x: number; y: number }[] = [
  { variant: "primary", label: "Play", x: 120, y: 120 },
  { variant: "secondary", label: "Skip", x: 320, y: 120 },
  { variant: "success", label: "Confirm", x: 520, y: 120 },
  { variant: "danger", label: "Fold", x: 220, y: 260 },
  { variant: "warning", label: "Options", x: 420, y: 260 },
];

function parseVariant(raw: string): ButtonVariant | undefined {
  return BUTTON_VARIANTS.includes(raw as ButtonVariant) ? (raw as ButtonVariant) : undefined;
}

function parseDisabled(raw: string): boolean | undefined {
  if (raw === "1" || raw === "true") {
    return true;
  }
  if (raw === "0" || raw === "false") {
    return false;
  }
  return undefined;
}

function ButtonStory() {
  const [focusVariant, setFocusVariant] = useQueryParam<ButtonVariant>("variant", {
    default: "primary",
    parse: parseVariant,
  });
  const [customLabel, setCustomLabel] = useQueryParam("label", {
    default: "Roll Dice",
    parse: (raw) => (raw.length > 0 && raw.length <= 24 ? raw : undefined),
  });
  const [disabled, setDisabled] = useQueryParam("disabled", {
    default: false,
    parse: parseDisabled,
    serialize: (value) => (value ? "1" : "0"),
  });

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-wrap justify-center gap-4">
        <label className={panelLabelClass}>
          Focus variant
          <select
            className={panelSelectClass}
            value={focusVariant}
            onChange={(event) => setFocusVariant(event.target.value as ButtonVariant)}
          >
            {BUTTON_VARIANTS.map((variant) => (
              <option key={variant} value={variant}>
                {variant}
              </option>
            ))}
          </select>
        </label>
        <label className={panelLabelClass}>
          Custom label
          <input
            className={panelSelectClass}
            type="text"
            maxLength={24}
            value={customLabel}
            onChange={(event) => setCustomLabel(event.target.value)}
          />
        </label>
        <button
          type="button"
          className={panelButtonClass}
          onClick={() => setDisabled(!disabled)}
        >
          {disabled ? "Enable buttons" : "Disable buttons"}
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-4 p-4">
        {BUTTON_VARIANTS.map((variant) => (
          <ButtonElement
            key={`dom-${variant}`}
            variant={variant}
            label={variant === focusVariant ? customLabel : DOM_LABELS[variant]}
            disabled={disabled}
            onClick={() => console.log(`clicked:dom:${variant}`)}
          />
        ))}
      </div>

      <Application
        width={640}
        height={400}
        background={UI_BACKGROUND_COLOR}
        antialias
        autoDensity
        preference={PIXI_RENDERER_PREFERENCE}
        eventMode="static"
        eventFeatures={{ move: true, globalMove: true, click: true }}
      >
        <pixiContainer sortableChildren eventMode="passive">
          {PIXI_GRID.map(({ variant, label, x, y }) => (
            <Button
              key={variant}
              variant={variant}
              label={variant === focusVariant ? customLabel : label}
              x={x}
              y={y}
              disabled={disabled}
              onClick={() => console.log(`clicked:pixi:${variant}`)}
            />
          ))}
        </pixiContainer>
      </Application>
    </div>
  );
}

const buttonStory: StoryDefinition = {
  name: "Button",
  component: <ButtonStory />,
};

export default buttonStory;
