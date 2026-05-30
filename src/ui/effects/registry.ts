import { arcaneAura } from "@/ui/effects/auras/arcane";
import { cosmicAura } from "@/ui/effects/auras/cosmic";
import { crystalAura } from "@/ui/effects/auras/crystal";
import { dragonAura } from "@/ui/effects/auras/dragon";
import { fireAura } from "@/ui/effects/auras/fire";
import { foilAura } from "@/ui/effects/auras/foil";
import { ghostAura } from "@/ui/effects/auras/ghost";
import { glitchAura } from "@/ui/effects/auras/glitch";
import { holyAura } from "@/ui/effects/auras/holy";
import { hologramAura } from "@/ui/effects/auras/hologram";
import { icyAura } from "@/ui/effects/auras/icy";
import { negativeAura } from "@/ui/effects/auras/negative";
import { polychromeAura } from "@/ui/effects/auras/polychrome";
import { shadowAura } from "@/ui/effects/auras/shadow";
import { stormAura } from "@/ui/effects/auras/storm";
import { voidAura } from "@/ui/effects/auras/void";
import type { AuraDefinition, AuraId } from "@/ui/effects/types";

export const AURA_DEFINITIONS: AuraDefinition[] = [
  holyAura,
  fireAura,
  icyAura,
  ghostAura,
  hologramAura,
  polychromeAura,
  foilAura,
  negativeAura,
  stormAura,
  crystalAura,
  shadowAura,
  cosmicAura,
  glitchAura,
  dragonAura,
  voidAura,
  arcaneAura,
];

const byId = new Map(AURA_DEFINITIONS.map((d) => [d.id, d]));

export function getAuraDefinition(id: AuraId): AuraDefinition | undefined {
  if (id === "none") {
    return undefined;
  }
  return byId.get(id);
}
