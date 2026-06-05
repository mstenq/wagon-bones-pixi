import { useCallback, useRef } from 'react';
import { useTick } from '@pixi/react';
import type { Graphics } from 'pixi.js';

import { ShopStockCard } from '@/ui/components/ShopPanel/ShopStockCard';
import { drawShopPanelFace, drawShopPanelShadow } from '@/ui/components/ShopPanel/shopPanelVisuals';
import { Button } from '@/ui/components/Button/Button';
import { hexToPixiColor } from '@/ui/pixi/color';
import { BUTTON_DISABLED_FACE_HEX } from '@/ui/components/Button/buttonVariantColors';
import type { ButtonVariantTheme } from '@/ui/components/Button/buttonTheme';
import type { ShopPanelLayout } from '@/ui/shop/shopLayout';
import type { SelectedShopOffer } from '@/ui/shop/shopSelection';
import { shopOfferKey } from '@/ui/shop/shopSelection';
import type { ShopAffordabilityInputs } from '@/ui/shop/shopViewModel';
import { SHOP_HIT_TRAIL_FACE_COLOR, SHOP_REROLL_FACE_COLOR } from '@/ui/shop/shopTheme';
import type { VisibleStockEntry } from '@/ui/scenes/ShopScene';

const disabledFace = hexToPixiColor(BUTTON_DISABLED_FACE_HEX);

const hitTrailTheme: ButtonVariantTheme = {
  face: SHOP_HIT_TRAIL_FACE_COLOR,
  disabledFace,
};

const rerollTheme: ButtonVariantTheme = {
  face: SHOP_REROLL_FACE_COLOR,
  disabledFace,
};

export type ShopStockRowProps = {
  layout: ShopPanelLayout;
  stock: VisibleStockEntry[];
  affordability: ShopAffordabilityInputs;
  rerollLabel: string;
  canReroll: boolean;
  selectedKey: string | null;
  onSelectedOfferChange: (offer: SelectedShopOffer | null) => void;
  onHitTrail: () => void;
  onReroll: () => void;
  onBuyStock: (stockIndex: number, mode: 'buy' | 'buy_and_use') => void;
};

export function ShopStockRow({
  layout,
  stock,
  affordability,
  rerollLabel,
  canReroll,
  selectedKey,
  onSelectedOfferChange,
  onHitTrail,
  onReroll,
  onBuyStock,
}: ShopStockRowProps) {
  const shadowRef = useRef<Graphics | null>(null);
  const faceRef = useRef<Graphics | null>(null);
  const { stockRow, stockButtons } = layout;

  useTick(() => {
    if (shadowRef.current) {
      drawShopPanelShadow(shadowRef.current, stockRow.width, stockRow.height);
    }
    if (faceRef.current) {
      drawShopPanelFace(faceRef.current, stockRow.width, stockRow.height);
    }
  });

  const onCardSelectedChange = useCallback(
    (stockIndex: number, selected: boolean) => {
      if (selected) {
        onSelectedOfferChange({ kind: 'stock', stockIndex });
        return;
      }
      const key = shopOfferKey({ kind: 'stock', stockIndex });
      if (selectedKey === key) {
        onSelectedOfferChange(null);
      }
    },
    [onSelectedOfferChange, selectedKey],
  );

  return (
    <pixiContainer x={stockRow.x} y={stockRow.y} sortableChildren eventMode="passive">
      <pixiGraphics ref={shadowRef} x={stockRow.width / 2} y={stockRow.height / 2} zIndex={0} eventMode="none" draw={() => {}} />
      <pixiContainer zIndex={1} sortableChildren eventMode="passive">
        <pixiGraphics ref={faceRef} x={stockRow.width / 2} y={stockRow.height / 2} eventMode="none" draw={() => {}} />

        <Button
          variant="primary"
          label="Hit the Trail"
          x={stockButtons.hitTrail.x}
          y={stockButtons.hitTrail.y}
          width={stockButtons.hitTrail.width}
          height={stockButtons.hitTrail.height}
          faceTheme={hitTrailTheme}
          onClick={onHitTrail}
        />
        <Button
          variant="primary"
          label={rerollLabel}
          x={stockButtons.reroll.x}
          y={stockButtons.reroll.y}
          width={stockButtons.reroll.width}
          height={stockButtons.reroll.height}
          disabled={!canReroll}
          faceTheme={rerollTheme}
          onClick={onReroll}
        />

        {stock.map((entry, slotIndex) => {
          const slot = layout.stockCardSlots[slotIndex];
          if (!slot) {
            return null;
          }
          const offerKey = shopOfferKey({ kind: 'stock', stockIndex: entry.stockIndex });
          return (
            <pixiContainer key={`stock-${entry.stockIndex}`} x={slot.x} y={slot.y} sortableChildren eventMode="passive">
              <ShopStockCard
                item={entry.item}
                stockIndex={entry.stockIndex}
                affordability={affordability}
                selected={selectedKey === offerKey}
                onSelectedChange={(selected) => onCardSelectedChange(entry.stockIndex, selected)}
                onBuy={onBuyStock}
              />
            </pixiContainer>
          );
        })}
      </pixiContainer>
    </pixiContainer>
  );
}
