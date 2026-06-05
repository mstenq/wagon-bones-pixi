import { getConsumableDefById, canBuyAndUseConsumableInShop, isSecondHelpingsCloneTarget } from '@/game/ConsumablesSystem';
import { canAfford } from '@/game/store/economy';
import { getRunState } from '@/game/store/runStore';
import { getEquipmentDefById } from '@/game/ItemsSystem';
import { getDiscountedShopPrice, getPermitShopDiscount, type PermitDef } from '@/game/PermitsSystem';
import { gameFacade } from '@/game/facade/gameFacade';
import { resolveEquipmentInstance, resolveLastUsedConsumableDef } from '@/game/store/resolve';
import type { selectShopAffordabilityInputs } from '@/game/store/selectors/sceneSelectors';
import type { StoredShopItem } from '@/game/store/types';
import type { PackDefinition } from '@/game/BoosterPackSystem';

export function getPermitCost(
  permit: PermitDef,
  purchasedPermits: readonly string[],
): number {
  const discount = getPermitShopDiscount([...purchasedPermits]);
  return Math.max(1, Math.floor(permit.cost * (1 - discount)));
}

export function getDiscountedShopCost(baseCost: number, purchasedPermits: readonly string[]): number {
  return getDiscountedShopPrice(baseCost, [...purchasedPermits]);
}

const DICE_SHOP_COST = 5;

export type ShopAffordabilityInputs = ReturnType<typeof selectShopAffordabilityInputs>;

export type ShopStockViewModel = {
  price: number;
  canAfford: boolean;
  secondaryAction?: {
    label: string;
    disabled: boolean;
  };
};

export type ShopPermitViewModel = {
  price: number;
  canAfford: boolean;
};

export type ShopPackViewModel = {
  price: number;
  canAfford: boolean;
};

function affordFromBalance(inputs: ShopAffordabilityInputs, price: number): boolean {
  const run = getRunState();
  return canAfford({ ...run, balance: inputs.balance }, price);
}

export function resolveShopStockViewModel(
  item: StoredShopItem,
  inputs: ShopAffordabilityInputs,
): ShopStockViewModel | null {
  if (item.type === 'equipment') {
    const def = getEquipmentDefById(item.defId);
    if (!def) {
      return null;
    }
    const purchasedPermits = [...inputs.purchasedPermits];
    const preview = resolveEquipmentInstance(item.preview, purchasedPermits);
    const listPrice = gameFacade.shop.getEquipmentListPrice(def);
    const price = gameFacade.shop.getEquipmentPurchasePrice(
      def,
      preview.modifiers,
      listPrice,
      purchasedPermits,
    );
    const hasSpace =
      def.aura?.id === 'ghost' || inputs.usedEquipmentSlots < inputs.maxEquipmentSlots;
    return { price, canAfford: affordFromBalance(inputs, price) && hasSpace };
  }

  if (item.type === 'consumable') {
    const def = getConsumableDefById(item.defId);
    if (!def) {
      return null;
    }
    const discounted = getDiscountedShopCost(def.cost, inputs.purchasedPermits);
    const price = gameFacade.shop.consumableCost(def, discounted);
    const canBuyAndUse = canBuyAndUseConsumableInShop(def);
    const viewModel: ShopStockViewModel = {
      price,
      canAfford: affordFromBalance(inputs, price),
    };
    if (canBuyAndUse) {
      const secondaryDisabled =
        def.id === 'second_helpings' && !isSecondHelpingsCloneTarget(resolveLastUsedConsumableDef());
      viewModel.secondaryAction = {
        label: 'BUY\n& USE',
        disabled: secondaryDisabled,
      };
    }
    return viewModel;
  }

  if (item.type === 'dice') {
    const price = getDiscountedShopCost(DICE_SHOP_COST, inputs.purchasedPermits);
    return { price, canAfford: affordFromBalance(inputs, price) };
  }

  return null;
}

export function resolveShopPermitViewModel(
  permit: PermitDef,
  inputs: ShopAffordabilityInputs,
): ShopPermitViewModel {
  const price = getPermitCost(permit, inputs.purchasedPermits);
  return { price, canAfford: affordFromBalance(inputs, price) };
}

export function resolveShopPackViewModel(
  packDef: PackDefinition,
  inputs: ShopAffordabilityInputs,
): ShopPackViewModel {
  const isTrailGuidePack = packDef.category === 'trail_guide' && inputs.trailGuidesFree;
  const price = isTrailGuidePack ? 0 : getDiscountedShopCost(packDef.cost, inputs.purchasedPermits);
  return { price, canAfford: isTrailGuidePack || affordFromBalance(inputs, price) };
}
