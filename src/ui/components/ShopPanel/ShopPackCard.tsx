import { use, useCallback, useMemo } from 'react';

import type { PackDefinition } from '@/game/BoosterPackSystem';
import { Card } from '@/ui/components/Card/Card';
import { getShopPackTexture, shopCardTexturesReady } from '@/ui/shop/shopCardTextures';
import { SHOP_CARD_HEIGHT } from '@/ui/shop/shopLayout';
import type { ShopAffordabilityInputs } from '@/ui/shop/shopViewModel';
import { resolveShopPackViewModel } from '@/ui/shop/shopViewModel';

export type ShopPackCardProps = {
  packDef: PackDefinition;
  packIndex: number;
  affordability: ShopAffordabilityInputs;
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
  onBuy: (packIndex: number) => void;
};

export function ShopPackCard({
  packDef,
  packIndex,
  affordability,
  selected,
  onSelectedChange,
  onBuy,
}: ShopPackCardProps) {
  use(shopCardTexturesReady);

  const texture = getShopPackTexture(packDef.id);
  const viewModel = useMemo(
    () => resolveShopPackViewModel(packDef, affordability),
    [affordability, packDef],
  );

  const scale = SHOP_CARD_HEIGHT / 301;
  const width = 202 * scale;
  const height = SHOP_CARD_HEIGHT;

  const onBuyClick = useCallback(() => onBuy(packIndex), [onBuy, packIndex]);

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
      effect="none"
    />
  );
}
