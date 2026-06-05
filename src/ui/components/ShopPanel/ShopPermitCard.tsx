import { use, useCallback, useMemo } from 'react';

import type { PermitDef } from '@/game/PermitsSystem';
import { Card } from '@/ui/components/Card/Card';
import { getShopPermitTexture, shopCardTexturesReady } from '@/ui/shop/shopCardTextures';
import { SHOP_CARD_HEIGHT, SHOP_CARD_WIDTH, SHOP_PERMIT_SCALE } from '@/ui/shop/shopLayout';
import { SHOP_PERMIT_TAB_COLOR } from '@/ui/shop/shopTheme';
import type { ShopAffordabilityInputs } from '@/ui/shop/shopViewModel';
import { resolveShopPermitViewModel } from '@/ui/shop/shopViewModel';

export type ShopPermitCardProps = {
  permit: PermitDef;
  isPrimary: boolean;
  affordability: ShopAffordabilityInputs;
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
  onBuy: (permit: PermitDef, isPrimary: boolean) => void;
};

export function ShopPermitCard({
  permit,
  isPrimary,
  affordability,
  selected,
  onSelectedChange,
  onBuy,
}: ShopPermitCardProps) {
  use(shopCardTexturesReady);

  const width = SHOP_CARD_WIDTH * SHOP_PERMIT_SCALE;
  const height = SHOP_CARD_HEIGHT * SHOP_PERMIT_SCALE;
  const texture = getShopPermitTexture(permit.id);
  const viewModel = useMemo(
    () => resolveShopPermitViewModel(permit, affordability),
    [affordability, permit],
  );

  const onBuyClick = useCallback(() => onBuy(permit, isPrimary), [onBuy, isPrimary, permit]);

  return (
    <Card
      texture={texture}
      width={width}
      height={height}
      displayMode="shop"
      price={viewModel.price}
      buyDisabled={!viewModel.canAfford}
      selected={selected}
      onSelectedChange={onSelectedChange}
      onBuy={onBuyClick}
      primaryActionTabColor={SHOP_PERMIT_TAB_COLOR}
      effect="none"
    />
  );
}
