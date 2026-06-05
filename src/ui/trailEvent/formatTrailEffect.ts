import { TRAIL_EVENT, TEXT_COLORS } from '@/game/Constants';
import type { TrailEventEffect } from '@/data/trail_events';
import { gameFacade } from '@/game/facade/gameFacade';
import { resolveEquipmentList } from '@/game/store/resolve';
import type { TrailEventResolveSnapshot } from '@/game/store/types';

export type FormattedTrailEffectLine = {
  text: string;
  color: string;
  negative: boolean;
};

export function findLoseEquipmentChoiceEffect(
  effects: TrailEventEffect[],
  negatesNegatives: boolean,
): TrailEventEffect | undefined {
  return effects.find(
    (effect) =>
      effect.type === 'LOSE_EQUIPMENT_CHOICE' && !(gameFacade.trail.isNegativeEffect(effect) && negatesNegatives),
  );
}

export function buildTrailProtectionText(
  effects: TrailEventEffect[],
  negatedNegativeEffects: boolean | undefined,
  negationSource: TrailEventResolveSnapshot['negationSource'],
): string | null {
  const negatesNegatives = negatedNegativeEffects ?? false;
  const hadNegatedNegative = effects.some(
    (effect) => gameFacade.trail.isNegativeEffect(effect) && negatesNegatives,
  );
  if (!hadNegatedNegative) {
    return null;
  }

  const equipment = resolveEquipmentList();
  const shieldEquip = equipment.find((item) => item.def.id === 'saint_elmos_shield');
  const repairKitEquip = gameFacade.trail.findTrailRepairKit();

  if (negationSource === 'omen_stone') {
    return '✨ Good Omen prevents the bad outcome! ✨';
  }
  if (negationSource === 'saint_elmos_shield' && shieldEquip) {
    return `✨ ${shieldEquip.def.name} protects you! ✨`;
  }
  if (negationSource === 'trail_repair_kit' && repairKitEquip) {
    const xm = repairKitEquip.state.xMult ?? 1;
    return `🔧 ${repairKitEquip.def.name} patches the trail (x${xm.toFixed(2)})`;
  }
  return null;
}

export function formatTrailEffect(
  effect: TrailEventEffect,
  negated: boolean,
  enhancedDiceBeforeCount?: number,
  equipmentBeforeCount?: number,
): FormattedTrailEffectLine | null {
  const negative = gameFacade.trail.isNegativeEffect(effect);
  let color = negative ? TEXT_COLORS.ERROR_RED : TEXT_COLORS.SCORE_GREEN;
  if (negated) {
    color = TEXT_COLORS.MUTED;
  }

  let text = '';
  switch (effect.type) {
    case 'LOSE_MONEY':
      text = `Lost $${effect.amount}`;
      break;
    case 'LOSE_MONEY_PERCENT':
      text = `Lost ${effect.percent}% of money`;
      break;
    case 'GAIN_MONEY':
      text = `Gained $${effect.amount}`;
      break;
    case 'LOSE_DAYS':
      text = `Lost ${effect.amount} day${(effect.amount ?? 1) > 1 ? 's' : ''} next round`;
      break;
    case 'LOSE_REROLLS':
      text = `Lost ${effect.amount} reroll${(effect.amount ?? 1) > 1 ? 's' : ''} next round`;
      break;
    case 'LOSE_REROLLS_PER_DAY':
      text = `Lose ${effect.amount} reroll${(effect.amount ?? 1) > 1 ? 's' : ''} per day next round`;
      break;
    case 'LOSE_HAND_SIZE':
      text = `Hand size reduced by ${effect.amount} next round`;
      break;
    case 'LOSE_RANDOM_DICE': {
      const available = enhancedDiceBeforeCount ?? 0;
      if (available === 0 && !negated) {
        const lostAmount = (effect.count ?? 1) * TRAIL_EVENT.AMOUNT_PER_MISSING_DIE;
        text = `No enhanced dice to sacrifice. Lost $${lostAmount} instead.`;
        color = TEXT_COLORS.ERROR_RED;
      } else {
        const lost = Math.min(effect.count ?? 0, available);
        text = `Lost ${lost} enhanced dice from pouch`;
      }
      break;
    }
    case 'GAIN_DICE':
      text = `Gained ${effect.count} dice`;
      break;
    case 'BOSS_UPGRADE':
      text = `Boss target x${effect.multiplier}`;
      break;
    case 'SCORE_MULTIPLIER':
      text = `Score target x${effect.multiplier} next round`;
      break;
    case 'DISABLE_REROLL_DAY1':
      text = 'No rerolls on Day 1 next round';
      break;
    case 'STANDARD_DICE_DAY1':
      text = 'Only standard dice Day 1 next round';
      break;
    case 'DIAMOND_CRACK_DOUBLED':
      text = 'Diamond crack chance doubled next round';
      break;
    case 'LUCKY_ODDS_HALVED':
      text = 'Lucky odds halved next round';
      break;
    case 'SCORED_DICE_DESTROY_CHANCE':
      text = `${Math.round((effect.chance ?? 0) * 100)}% chance scored dice are destroyed`;
      break;
    case 'SKIP_NEXT_SHOP':
      text = 'Shop skipped this round!';
      break;
    case 'DESTROY_EQUIPMENT':
      text = 'An equipment was destroyed!';
      break;
    case 'ADD_AURA_TO_RANDOM_DICE':
      text = `Added ${effect.aura} aura to a die`;
      break;
    case 'GAIN_RANDOM_EQUIPMENT':
      text = 'Gained a random equipment!';
      break;
    case 'GAIN_TRAIL_GUIDES':
      text = `Gained ${effect.count} trail guide${(effect.count ?? 1) > 1 ? 's' : ''}`;
      break;
    case 'USE_MEDICINE':
      text = 'Used medicine to recover';
      break;
    case 'GAIN_RANDOM_SUPPLY_CARD':
      text = 'Gained a random supply card';
      break;
    case 'GAIN_FRONTIER_ENCOUNTER':
      text = 'Gained a frontier encounter card';
      break;
    case 'GAIN_MEDICINE_CARD':
      text = 'Gained a medicine card';
      break;
    case 'LOSE_ALL_SUPPLY_CARDS':
      text = 'Lost all supply cards!';
      break;
    case 'LOSE_EQUIPMENT_CHOICE':
      if ((equipmentBeforeCount ?? 0) === 0 && !negated) {
        const lostAmount = (effect.count ?? 1) * TRAIL_EVENT.AMOUNT_PER_MISSING_EQUIP;
        text = `No equipment to sacrifice. Lost $${lostAmount} instead.`;
        color = TEXT_COLORS.ERROR_RED;
      } else {
        text = 'Must choose equipment to lose';
      }
      break;
    case 'LOSE_RANDOM_EQUIPMENT':
      if ((equipmentBeforeCount ?? 0) === 0 && !negated) {
        const lostAmount = (effect.count ?? 1) * TRAIL_EVENT.AMOUNT_PER_MISSING_EQUIP;
        text = `No equipment to sacrifice. Lost $${lostAmount} instead.`;
        color = TEXT_COLORS.ERROR_RED;
      } else {
        text = 'Lost a random equipment!';
      }
      break;
    case 'LOSE_MONEY_PER_DAY':
      text = `Lose $${effect.amount} per day next round`;
      break;
    case 'LOSE_ALL_REROLLS':
      text = 'No rerolls next round!';
      break;
    case 'LOSE_EQUIPMENT_SLOT_PERMANENT':
      text = 'Lost an equipment slot permanently!';
      break;
    case 'FLAT_MILES_PENALTY':
      text = `−${effect.amount} miles penalty next round`;
      break;
    case 'GAIN_SPECIFIC_SUPPLY_CARD':
      text = `Gained ${effect.id ?? 'a supply card'}`;
      break;
    case 'LOSE_RANDOM_SUPPLY_CARD':
      text = 'Lost a supply card';
      break;
    default: {
      const unknown = effect as { type: string };
      text = unknown.type.replace(/_/g, ' ').toLowerCase();
      break;
    }
  }

  if (negated) {
    text = `${text} (negated)`;
  }

  return { text, color, negative };
}

export function buildTrailEffectLines(
  effects: TrailEventEffect[],
  negatesNegatives: boolean,
  enhancedDiceBeforeCount: number,
  equipmentBeforeCount: number,
): FormattedTrailEffectLine[] {
  const lines: FormattedTrailEffectLine[] = [];

  for (const effect of effects) {
    const negated = gameFacade.trail.isNegativeEffect(effect) && negatesNegatives;
    const line = formatTrailEffect(effect, negated, enhancedDiceBeforeCount, equipmentBeforeCount);
    if (line) {
      lines.push(line);
    }
  }

  if (lines.length === 0) {
    lines.push({ text: 'Nothing happens.', color: TEXT_COLORS.MUTED, negative: false });
  }

  return lines;
}
