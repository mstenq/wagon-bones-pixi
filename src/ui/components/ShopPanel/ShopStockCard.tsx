import { use, useCallback, useMemo } from 'react';

import { getConsumableDefById } from '@/game/ConsumablesSystem';
import type { StoredShopItem } from '@/game/store/types';
import { Card } from '@/ui/components/Card/Card';
import { Die, DEFAULT_DIE_SIZE } from '@/ui/components/Dice/Die';
import { auraIdToEffectId } from '@/ui/components/CardBar/auraEffectId';
import {
  getCardTemplateTexture,
  getShopConsumableTexture,
  getShopEquipmentTexture,
  shopCardTexturesReady,
} from '@/ui/shop/shopCardTextures';
import { SHOP_CARD_HEIGHT, SHOP_CARD_WIDTH } from '@/ui/shop/shopLayout';
import type { ShopAffordabilityInputs } from '@/ui/shop/shopViewModel';
import { resolveShopStockViewModel } from '@/ui/shop/shopViewModel';

export type ShopStockCardProps = {
  item: StoredShopItem;
  stockIndex: number;
  affordability: ShopAffordabilityInputs;
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
  onBuy: (stockIndex: number, mode: 'buy' | 'buy_and_use') => void;
};

export function ShopStockCard({
  item,
  stockIndex,
  affordability,
  selected,
  onSelectedChange,
  onBuy,
}: ShopStockCardProps) {
  use(shopCardTexturesReady);

  const viewModel = useMemo(
    () => resolveShopStockViewModel(item, affordability),
    [affordability, item],
  );

  const onBuyClick = useCallback(() => onBuy(stockIndex, 'buy'), [onBuy, stockIndex]);
  const onBuyAndUseClick = useCallback(() => onBuy(stockIndex, 'buy_and_use'), [onBuy, stockIndex]);

  if (!viewModel) {
    return null;
  }

  if (item.type === 'dice') {
    const template = getCardTemplateTexture('white-text');
    const dieEffect = auraIdToEffectId(item.die.aura ?? undefined);
    return (
      <pixiContainer eventMode="passive">
        <Card
          texture={template}
          width={SHOP_CARD_WIDTH}
          height={SHOP_CARD_HEIGHT}
          displayMode="shop"
          price={viewModel.price}
          buyDisabled={!viewModel.canAfford}
          selected={selected}
          onSelectedChange={onSelectedChange}
          onBuy={onBuyClick}
          effect="none"
        />
        <pixiContainer y={-12} eventMode="none">
          <Die
            diceType={item.die.enhancement ?? 'standard'}
            size={DEFAULT_DIE_SIZE}
            value={item.die.value}
            effect={dieEffect}
          />
        </pixiContainer>
      </pixiContainer>
    );
  }

  let texture = null;
  let effect = auraIdToEffectId(undefined);

  if (item.type === 'equipment') {
    texture = getShopEquipmentTexture(item.defId);
    effect = auraIdToEffectId(item.preview.auraId ?? undefined);
  } else if (item.type === 'consumable') {
    const def = getConsumableDefById(item.defId);
    if (def) {
      texture = getShopConsumableTexture(item.defId, def.category);
      effect = auraIdToEffectId(def.aura?.id ?? undefined);
    }
  }

  const secondaryAction = viewModel.secondaryAction
    ? {
        label: viewModel.secondaryAction.label,
        onAction: onBuyAndUseClick,
        disabled: viewModel.secondaryAction.disabled,
      }
    : undefined;

  return (
    <Card
      texture={texture}
      width={SHOP_CARD_WIDTH}
      height={SHOP_CARD_HEIGHT}
      displayMode="shop"
      price={viewModel.price}
      buyDisabled={!viewModel.canAfford}
      selected={selected}
      onSelectedChange={onSelectedChange}
      onBuy={onBuyClick}
      secondaryAction={secondaryAction}
      effect={effect}
    />
  );
}
