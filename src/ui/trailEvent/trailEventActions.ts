// ─── Trail event facade actions (No Phaser imports) ───

import { getItemDisplayContext } from '@/game/displayContext';
import { gameFacade } from '@/game/facade/gameFacade';
import { prepareTrailEventScene } from '@/game/trailEventEntry';
import type { EquipmentInstance } from '@/game/ItemsSystem';
import { rngFloat } from '@/game/RunRng';
import { getRunState, runActions } from '@/game/store/runStore';
import { resolveEquipmentList } from '@/game/store/resolve';
import { getSceneState, sceneActions } from '@/game/store/sceneStore';
import type { TrailEventResolveSnapshot } from '@/game/store/types';
import {
  filterEquipmentEligibleForTrailSacrifice,
  getScoutsSpyglassInvestigateMiles,
} from '@/game/TrailEventsSystem';
import { buildTrailProtectionText } from '@/ui/trailEvent/formatTrailEffect';
import { navigateToRoundSelect } from '@/ui/roundSelect/roundSelectActions';

function requireTrailEventState() {
  const state = getSceneState().trailEvent;
  if (!state) {
    throw new Error('Trail event scene state missing');
  }
  return state;
}

export function navigateToTrailEvent(): void {
  prepareTrailEventScene();
  sceneActions.setActiveScene('TrailEvent');
}

export function getSpyglassInvestigateLabel(): string {
  const miles = getScoutsSpyglassInvestigateMiles(getItemDisplayContext());
  return `Investigate (+${miles} miles)`;
}

export function avoidTrailEventWithSpyglass(): void {
  gameFacade.trail.applySpyglassAvoid();
  proceedAfterTrailEvent();
}

export function investigateTrailEventWithSpyglass(): void {
  const trailState = requireTrailEventState();
  const committed = gameFacade.trail.getEventById(trailState.eventId);
  if (!committed) {
    throw new Error('Spyglass preview missing trail event');
  }

  gameFacade.trail.applySpyglassInvestigate();
  runActions.patch({ pendingTrailEventId: null });
  sceneActions.patchTrailEvent({ spyglassRevealed: true, eventId: committed.id });
}

function captureResolveTrailChoiceContext(): Pick<
  TrailEventResolveSnapshot,
  'enhancedDiceBeforeCount' | 'equipmentBeforeResolve'
> {
  const run = getRunState();
  return {
    enhancedDiceBeforeCount: run.dice.filter(
      (d) => d.enhancement !== null || d.sticker !== null || d.aura !== null,
    ).length,
    equipmentBeforeResolve: [...resolveEquipmentList(run)],
  };
}

export function resolveTrailChoice(choiceId: string): void {
  const trailState = requireTrailEventState();
  const event = gameFacade.trail.getEventById(trailState.eventId);
  if (!event) {
    throw new Error(`Unknown trail event: ${trailState.eventId}`);
  }

  const context = captureResolveTrailChoiceContext();
  const result = gameFacade.trail.resolveChoice(event, choiceId, () => rngFloat('trail'));

  runActions.patch({
    trailEventModifiers: result.modifiers,
    ...(result.modifiers.skipNextShop ? { skipNextShop: true } : {}),
  });

  sceneActions.patchTrailEvent({
    resolved: true,
    selectedChoiceId: choiceId,
    resolveSnapshot: {
      choiceId: result.choiceId,
      outcomeIndex: result.outcomeIndex,
      effects: result.effects,
      message: result.message,
      negatedNegativeEffects: result.negatedNegativeEffects,
      negationSource: result.negationSource,
      protectionText: buildTrailProtectionText(result.effects, result.negatedNegativeEffects, result.negationSource),
      enhancedDiceBeforeCount: context.enhancedDiceBeforeCount,
      equipmentBeforeResolve: context.equipmentBeforeResolve,
    },
  });
}

export function destroyTrailSacrificeEquipment(index: number): void {
  gameFacade.trail.destroyEquipment(index);
}

export function getEligibleSacrificeEquipment(
  equipmentBeforeResolve: EquipmentInstance[],
): { index: number; name: string }[] {
  const equipment = resolveEquipmentList();
  const eligible = filterEquipmentEligibleForTrailSacrifice(equipmentBeforeResolve, equipment);
  const eligibleSet = new Set(eligible);

  return equipment
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => eligibleSet.has(item) && !gameFacade.trail.isEquipmentCursed(item))
    .map(({ item, index }) => ({ index, name: item.def.name }));
}

export function proceedAfterTrailEvent(): void {
  const skipShop = getRunState().skipNextShop;
  sceneActions.clearTrailEvent();
  runActions.patch({ pendingTrailEventId: null, ...(skipShop ? { skipNextShop: false } : {}) });

  if (skipShop) {
    navigateToRoundSelect();
    return;
  }

  sceneActions.setActiveScene('Shop');
}
