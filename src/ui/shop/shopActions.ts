import { gameFacade } from '@/game/facade/gameFacade';
import { getPackDefById } from '@/game/BoosterPackSystem';
import { getConsumableDefById } from '@/game/ConsumablesSystem';
import { getEquipmentDefById } from '@/game/ItemsSystem';
import { generateShopPermit, getPermitById, type PermitDef } from '@/game/PermitsSystem';
import { serializePackItem } from '@/game/SaveLoad';
import { appendMissingShopStockSlots } from '@/game/store/shopStock';
import { getRunState, runActions } from '@/game/store/runStore';
import { getSceneState, sceneActions } from '@/game/store/sceneStore';
import { resolveEquipmentInstance, resolveEquipmentList } from '@/game/store/resolve';
import { selectShopAffordabilityInputs } from '@/game/store/selectors/sceneSelectors';
import { selectUsedEquipmentSlots } from '@/game/store/selectors/runSelectors';
import { playSfx } from '@/ui/audio/sfx';
import { navigateToRoundSelect } from '@/ui/roundSelect/roundSelectActions';
import { shopBuyFailMessage, shopConsumableFailMessage } from '@/ui/shop/shopFeedback';
import {
  getDiscountedShopCost,
  getPermitCost,
  resolveShopPackViewModel,
  resolveShopStockViewModel,
} from '@/ui/shop/shopViewModel';

export { getDiscountedShopCost, getPermitCost } from '@/ui/shop/shopViewModel';

function playShopFailSfx(): void {
  playSfx('cancel', { volume: 0.5 });
}

function playShopCoinSfx(): void {
  playSfx('coin', { volume: 0.5 });
}

function playShopTarotSfx(volume = 0.5): void {
  playSfx('tarot1', { volume });
}

function playShopPackOpenSfx(): void {
  playSfx('explosionRelease', { volume: 0.5 });
}

export function ensurePrimaryPermitGenerated(): void {
  const run = getRunState();
  if (run.permitPurchasedThisLeg || run.currentLegPermitId) {
    return;
  }
  const permit = generateShopPermit(run.purchasedPermits);
  if (permit) {
    runActions.patch({ currentLegPermitId: permit.id });
  }
}

/** Open or restore the shop visit and navigate to the Shop scene. */
export function navigateToShop(): void {
  prepareShopScene();
}

export function prepareShopScene(): void {
  const sceneShop = getSceneState().shop;
  if (sceneShop) {
    gameFacade.shop.restoreShop(sceneShop);
  } else {
    gameFacade.shop.openShop();
  }
  ensurePrimaryPermitGenerated();
}

export function leaveShop(): void {
  gameFacade.shop.processShopEnd(resolveEquipmentList());
  sceneActions.clearShop();
  navigateToRoundSelect();
}

export function rerollShopStock(): boolean {
  return gameFacade.shop.rerollShop();
}

export function getPrimaryPermit(): PermitDef | null {
  const run = getRunState();
  if (run.permitPurchasedThisLeg || !run.currentLegPermitId) {
    return null;
  }
  return getPermitById(run.currentLegPermitId);
}

export function getBonusPermit(): PermitDef | null {
  const run = getRunState();
  if (!run.bonusShopPermitId) {
    return null;
  }
  return getPermitById(run.bonusShopPermitId);
}

export type ShopBuyHandlers = {
  onMessage: (message: string) => void;
  onStockPurchased: () => void;
};

export function buyShopStockItem(stockIndex: number, mode: 'buy' | 'buy_and_use', handlers: ShopBuyHandlers): void {
  const shop = getSceneState().shop;
  if (!shop) {
    return;
  }
  const item = shop.stock[stockIndex];
  if (!item || item.sold) {
    return;
  }

  const viewModel = resolveShopStockViewModel(item, selectShopAffordabilityInputs());
  if (!viewModel) {
    return;
  }

  if (item.type === 'equipment') {
    const def = getEquipmentDefById(item.defId);
    if (!def) {
      return;
    }
    const run = getRunState();
    if (def.aura?.id !== 'ghost' && selectUsedEquipmentSlots(run) >= run.maxEquipmentSlots) {
      playShopFailSfx();
      handlers.onMessage(shopBuyFailMessage('no_space'));
      return;
    }
    const preview = resolveEquipmentInstance(item.preview, run.purchasedPermits);
    const result = gameFacade.shop.buyEquipment(def, preview, gameFacade.shop.getEquipmentListPrice(def));
    if (!result.ok) {
      playShopFailSfx();
      handlers.onMessage(shopBuyFailMessage(result.reason));
      return;
    }
    playShopCoinSfx();
    sceneActions.markShopStockSold(stockIndex);
    handlers.onStockPurchased();
    return;
  }

  if (item.type === 'consumable') {
    const def = getConsumableDefById(item.defId);
    if (!def) {
      return;
    }
    if (mode === 'buy_and_use') {
      const result = gameFacade.shop.buyAndUseConsumable(def, viewModel.price);
      if (!result.success) {
        playShopFailSfx();
        handlers.onMessage(shopConsumableFailMessage(result.failReason));
        return;
      }
      playShopTarotSfx();
    } else {
      const result = gameFacade.shop.buyConsumable(def, viewModel.price);
      if (!result.ok) {
        playShopFailSfx();
        handlers.onMessage(shopBuyFailMessage(result.reason));
        return;
      }
      playShopCoinSfx();
    }
    sceneActions.markShopStockSold(stockIndex);
    handlers.onStockPurchased();
    return;
  }

  if (item.type === 'dice') {
    const result = gameFacade.shop.buyDie(item.die, viewModel.price);
    if (!result.ok) {
      playShopFailSfx();
      handlers.onMessage(shopBuyFailMessage(result.reason));
      return;
    }
    playShopCoinSfx();
    sceneActions.markShopStockSold(stockIndex);
    handlers.onStockPurchased();
  }
}

export function buyShopPermit(permit: PermitDef, isPrimary: boolean, handlers: ShopBuyHandlers): void {
  const cost = getPermitCost(permit, getRunState().purchasedPermits);
  const result = gameFacade.shop.buyPermit(permit, cost, isPrimary);
  if (!result.ok) {
    playShopFailSfx();
    handlers.onMessage(shopBuyFailMessage(result.reason));
    return;
  }

  playShopTarotSfx(0.6);

  const shop = getSceneState().shop;
  if (shop) {
    const stock = appendMissingShopStockSlots(shop.stock);
    sceneActions.patchShop({ stock });
  }
  handlers.onStockPurchased();
}

export function buyShopPack(packIndex: number, handlers: ShopBuyHandlers): void {
  const shop = getSceneState().shop;
  if (!shop) {
    return;
  }
  const packEntry = shop.packs[packIndex];
  if (!packEntry || packEntry.opened) {
    return;
  }
  const packDef = getPackDefById(packEntry.defId);
  if (!packDef) {
    return;
  }

  const affordability = selectShopAffordabilityInputs();
  const { price } = resolveShopPackViewModel(packDef, affordability);
  const result = gameFacade.shop.buyPack(price);
  if (!result.ok) {
    playShopFailSfx();
    handlers.onMessage(shopBuyFailMessage(result.reason));
    return;
  }

  playShopPackOpenSfx();

  gameFacade.shop.markPackOpened(packIndex);
  sceneActions.markShopPackOpened(packIndex);

  const opened = gameFacade.pack.openPack(packDef);
  sceneActions.enterBoosterPack({
    packDefId: packDef.id,
    returnScene: 'Shop',
    queuedPackDefIds: [],
    contents: opened.contents.map(serializePackItem),
    picksRemaining: opened.picksRemaining,
    effectivePickCount: opened.effectivePickCount,
    usedCardIndices: [],
  });
}
