import { arcaneEffect } from "@/ui/effects/definitions/arcane";
import { cosmicEffect } from "@/ui/effects/definitions/cosmic";
import { crystalEffect } from "@/ui/effects/definitions/crystal";
import { dragonEffect } from "@/ui/effects/definitions/dragon";
import { fireEffect } from "@/ui/effects/definitions/fire";
import { foilEffect } from "@/ui/effects/definitions/foil";
import { ghostEffect } from "@/ui/effects/definitions/ghost";
import { circuitEffect } from "@/ui/effects/definitions/circuit";
import { glitchEffect } from "@/ui/effects/definitions/glitch";
import { holyEffect } from "@/ui/effects/definitions/holy";
import { hologramEffect } from "@/ui/effects/definitions/hologram";
import { icyEffect } from "@/ui/effects/definitions/icy";
import { negativeEffect } from "@/ui/effects/definitions/negative";
import { polychromeEffect } from "@/ui/effects/definitions/polychrome";
import { retroDitherEffect } from "@/ui/effects/definitions/retroDither";
import { shadowEffect } from "@/ui/effects/definitions/shadow";
import { stormEffect } from "@/ui/effects/definitions/storm";
import { voidEffect } from "@/ui/effects/definitions/void";
import { waterEffect } from "@/ui/effects/definitions/water";
import type { EffectDefinition, EffectId } from "@/ui/effects/types";

export const EFFECT_DEFINITIONS: EffectDefinition[] = [
  holyEffect,
  fireEffect,
  icyEffect,
  ghostEffect,
  hologramEffect,
  polychromeEffect,
  foilEffect,
  negativeEffect,
  stormEffect,
  crystalEffect,
  shadowEffect,
  cosmicEffect,
  glitchEffect,
  circuitEffect,
  retroDitherEffect,
  dragonEffect,
  voidEffect,
  arcaneEffect,
  waterEffect,
];

const byId = new Map(EFFECT_DEFINITIONS.map((d) => [d.id, d]));

export function getEffectDefinition(id: EffectId): EffectDefinition | undefined {
  if (id === "none") {
    return undefined;
  }
  return byId.get(id);
}
