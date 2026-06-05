import { Suspense, useCallback, useMemo, useRef, useState } from 'react';

import { getPackDefById } from '@/game/BoosterPackSystem';
import { useGameRunStore, useGameSceneStore } from '@/game/store/reactHooks';
import { runStore } from '@/game/store/runStore';
import {
  selectShopAffordabilityInputs,
  selectShopAffordabilityRevision,
  selectShopState,
  selectShopStockRevision,
} from '@/game/store/selectors/sceneSelectors';
import type { PermitDef } from '@/game/PermitsSystem';
import type { StoredShopItem } from '@/game/store/types';
import { ShopStockRow } from '@/ui/components/ShopPanel/ShopStockRow';
import { ShopPermitsPacksRow } from '@/ui/components/ShopPanel/ShopPermitsPacksRow';
import {
  buyShopPack,
  buyShopPermit,
  buyShopStockItem,
  getBonusPermit,
  getPrimaryPermit,
  leaveShop,
  rerollShopStock,
} from '@/ui/shop/shopActions';
import { computeShopPanelLayout } from '@/ui/shop/shopLayout';
import type { SelectedShopOffer } from '@/ui/shop/shopSelection';
import { shopOfferKey } from '@/ui/shop/shopSelection';
import { shopToastTextStyle } from '@/ui/shop/shopTheme';
import type { ShopAffordabilityInputs } from '@/ui/shop/shopViewModel';

export type ShopSceneProps = {
  contentW: number;
  contentH: number;
};

export type VisibleStockEntry = {
  item: StoredShopItem;
  stockIndex: number;
};

export type VisiblePackEntry = {
  packDef: NonNullable<ReturnType<typeof getPackDefById>>;
  packIndex: number;
};

export type PermitSlotEntry = {
  permit: PermitDef;
  isPrimary: boolean;
  label: string | null;
  labelX: number;
};

export function ShopScene({ contentW, contentH }: ShopSceneProps) {
  const shop = useGameSceneStore(selectShopState);
  const stockRevision = useGameSceneStore(selectShopStockRevision);
  const affordabilityRevision = useGameRunStore(selectShopAffordabilityRevision);
  const affordability = useMemo(
    () => selectShopAffordabilityInputs(runStore.getState()),
    [affordabilityRevision],
  );

  const [selectedOffer, setSelectedOffer] = useState<SelectedShopOffer | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showMessage = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimeoutRef.current != null) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 2200);
  }, []);

  const onPurchased = useCallback(() => {
    setSelectedOffer(null);
  }, []);

  const buyHandlers = useMemo(
    () => ({
      onMessage: showMessage,
      onStockPurchased: onPurchased,
    }),
    [onPurchased, showMessage],
  );

  const onSelectedOfferChange = useCallback((offer: SelectedShopOffer | null) => {
    setSelectedOffer(offer);
  }, []);

  const onBuyStock = useCallback(
    (stockIndex: number, mode: 'buy' | 'buy_and_use') => {
      buyShopStockItem(stockIndex, mode, buyHandlers);
    },
    [buyHandlers],
  );

  const onBuyPermit = useCallback(
    (permit: PermitDef, isPrimary: boolean) => {
      buyShopPermit(permit, isPrimary, buyHandlers);
    },
    [buyHandlers],
  );

  const onBuyPack = useCallback(
    (packIndex: number) => {
      buyShopPack(packIndex, buyHandlers);
    },
    [buyHandlers],
  );

  const onReroll = useCallback(() => {
    if (!rerollShopStock()) {
      showMessage('Not enough money');
      return;
    }
    setSelectedOffer(null);
  }, [showMessage]);

  const shopView = useMemo(() => {
    if (!shop) {
      return null;
    }

    const visibleStock = shop.stock
      .map((item, stockIndex) => ({ item, stockIndex }))
      .filter(({ item }) => !item.sold);

    const visiblePacks = shop.packs
      .map((pack, packIndex) => {
        const packDef = getPackDefById(pack.defId);
        if (!packDef || pack.opened) {
          return null;
        }
        return { packDef, packIndex };
      })
      .filter((entry): entry is VisiblePackEntry => entry != null);

    const primaryPermit = getPrimaryPermit();
    const bonusPermit = getBonusPermit();
    const permitCount = (primaryPermit ? 1 : 0) + (bonusPermit ? 1 : 0);
    const layout = computeShopPanelLayout(
      contentW,
      contentH,
      visibleStock.length,
      visiblePacks.length,
      permitCount,
    );

    const permitSlots: PermitSlotEntry[] = [];
    let slotIndex = 0;
    if (primaryPermit) {
      const slot = layout.permitSlots[slotIndex];
      slotIndex += 1;
      if (slot) {
        permitSlots.push({
          permit: primaryPermit,
          isPrimary: true,
          label: 'FRONTIER PERMIT',
          labelX: layout.primaryPermitLabelX,
        });
      }
    }
    if (bonusPermit) {
      const slot = layout.permitSlots[slotIndex];
      slotIndex += 1;
      if (slot) {
        permitSlots.push({
          permit: bonusPermit,
          isPrimary: false,
          label: layout.bonusPermitLabelX != null ? 'BONUS PERMIT' : null,
          labelX: layout.bonusPermitLabelX ?? layout.primaryPermitLabelX,
        });
      }
    }

    return {
      layout,
      visibleStock,
      visiblePacks,
      permitSlots,
      rerollLabel: affordability.shopRerollCost === 0 ? 'Reroll\nFREE' : `Reroll\n$${affordability.shopRerollCost}`,
      canReroll: affordability.canRerollShop,
      trailGuidesFree: affordability.trailGuidesFree,
    };
  }, [affordability, contentH, contentW, shop, stockRevision]);

  if (!shop || !shopView) {
    return null;
  }

  const selectedKey = selectedOffer ? shopOfferKey(selectedOffer) : null;

  return (
    <pixiContainer sortableChildren eventMode="passive">
      <Suspense fallback={null}>
        <ShopStockRow
          layout={shopView.layout}
          stock={shopView.visibleStock}
          affordability={affordability}
          rerollLabel={shopView.rerollLabel}
          canReroll={shopView.canReroll}
          selectedKey={selectedKey}
          onSelectedOfferChange={onSelectedOfferChange}
          onHitTrail={leaveShop}
          onReroll={onReroll}
          onBuyStock={onBuyStock}
        />
        <ShopPermitsPacksRow
          layout={shopView.layout}
          permitSlots={shopView.permitSlots}
          packs={shopView.visiblePacks}
          affordability={affordability}
          selectedKey={selectedKey}
          onSelectedOfferChange={onSelectedOfferChange}
          onBuyPermit={onBuyPermit}
          onBuyPack={onBuyPack}
        />
      </Suspense>

      {toastMessage ? (
        <pixiText
          text={toastMessage}
          x={contentW / 2}
          y={24}
          anchor={0.5}
          style={shopToastTextStyle()}
          eventMode="none"
          zIndex={1000}
        />
      ) : null}
    </pixiContainer>
  );
}

export type { ShopAffordabilityInputs };
