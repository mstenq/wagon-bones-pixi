import { AURA_DEFINITIONS } from "@/ui/effects/registry";
import type { AuraId } from "@/ui/effects/types";

export const AURA_OPTIONS: { id: AuraId; label: string }[] = [
  { id: "none", label: "none" },
  ...AURA_DEFINITIONS.map((d) => ({ id: d.id, label: d.label })),
];
