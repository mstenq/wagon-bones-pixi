import { useCallback, useRef } from 'react';
import { useTick } from '@pixi/react';
import type { Graphics } from 'pixi.js';

import { ShopPackCard } from '@/ui/components/ShopPanel/ShopPackCard';
import { ShopPermitCard } from '@/ui/components/ShopPanel/ShopPermitCard';
import { drawShopPanelFace, drawShopPanelShadow } from '@/ui/components/ShopPanel/shopPanelVisuals';
import type { ShopPanelLayout } from '@/ui/shop/shopLayout';
import type { SelectedShopOffer } from '@/ui/shop/shopSelection';
import { shopOfferKey } from '@/ui/shop/shopSelection';
import type { ShopAffordabilityInputs } from '@/ui/shop/shopViewModel';
import { shopPermitLabelTextStyle } from '@/ui/shop/shopTheme';
import type { PermitSlotEntry, VisiblePackEntry } from '@/ui/scenes/ShopScene';

export type ShopPermitsPacksRowProps = {
  layout: ShopPanelLayout;
  permitSlots: PermitSlotEntry[];
  packs: VisiblePackEntry[];
  affordability: ShopAffordabilityInputs;
  selectedKey: string | null;
  onSelectedOfferChange: (offer: SelectedShopOffer | null) => void;
  onBuyPermit: (permit: PermitSlotEntry['permit'], isPrimary: boolean) => void;
  onBuyPack: (packIndex: number) => void;
};

export function ShopPermitsPacksRow({
  layout,
  permitSlots,
  packs,
  affordability,
  selectedKey,
  onSelectedOfferChange,
  onBuyPermit,
  onBuyPack,
}: ShopPermitsPacksRowProps) {
  const shadowRef = useRef<Graphics | null>(null);
  const faceRef = useRef<Graphics | null>(null);
  const { permitsPacksRow } = layout;
  const permitLabelStyle = shopPermitLabelTextStyle();

  useTick(() => {
    if (shadowRef.current) {
      drawShopPanelShadow(shadowRef.current, permitsPacksRow.width, permitsPacksRow.height);
    }
    if (faceRef.current) {
      drawShopPanelFace(faceRef.current, permitsPacksRow.width, permitsPacksRow.height);
    }
  });

  const onPermitSelectedChange = useCallback(
    (entry: PermitSlotEntry, selected: boolean) => {
      if (selected) {
        onSelectedOfferChange({
          kind: 'permit',
          permitId: entry.permit.id,
          isPrimary: entry.isPrimary,
        });
        return;
      }
      const key = shopOfferKey({
        kind: 'permit',
        permitId: entry.permit.id,
        isPrimary: entry.isPrimary,
      });
      if (selectedKey === key) {
        onSelectedOfferChange(null);
      }
    },
    [onSelectedOfferChange, selectedKey],
  );

  const onPackSelectedChange = useCallback(
    (packIndex: number, selected: boolean) => {
      if (selected) {
        onSelectedOfferChange({ kind: 'pack', packIndex });
        return;
      }
      const key = shopOfferKey({ kind: 'pack', packIndex });
      if (selectedKey === key) {
        onSelectedOfferChange(null);
      }
    },
    [onSelectedOfferChange, selectedKey],
  );

  return (
    <pixiContainer x={permitsPacksRow.x} y={permitsPacksRow.y} sortableChildren eventMode="passive">
      <pixiGraphics
        ref={shadowRef}
        x={permitsPacksRow.width / 2}
        y={permitsPacksRow.height / 2}
        zIndex={0}
        eventMode="none"
        draw={() => {}}
      />
      <pixiContainer zIndex={1} sortableChildren eventMode="passive">
        <pixiGraphics
          ref={faceRef}
          x={permitsPacksRow.width / 2}
          y={permitsPacksRow.height / 2}
          eventMode="none"
          draw={() => {}}
        />

        {permitSlots.map((entry, slotIndex) => {
          const slot = layout.permitSlots[slotIndex];
          if (!slot) {
            return null;
          }
          const offerKey = shopOfferKey({
            kind: 'permit',
            permitId: entry.permit.id,
            isPrimary: entry.isPrimary,
          });
          return (
            <pixiContainer key={offerKey} x={slot.x} y={slot.y} sortableChildren eventMode="passive">
              {entry.label ? (
                <pixiText
                  text={entry.label}
                  x={entry.labelX}
                  y={permitsPacksRow.centerY}
                  anchor={0.5}
                  rotation={-Math.PI / 2}
                  style={permitLabelStyle}
                  alpha={0.85}
                  eventMode="none"
                />
              ) : null}
              <ShopPermitCard
                permit={entry.permit}
                isPrimary={entry.isPrimary}
                affordability={affordability}
                selected={selectedKey === offerKey}
                onSelectedChange={(selected) => onPermitSelectedChange(entry, selected)}
                onBuy={onBuyPermit}
              />
            </pixiContainer>
          );
        })}

        {packs.map((entry, slotIndex) => {
          const slot = layout.packSlots[slotIndex];
          if (!slot) {
            return null;
          }
          const offerKey = shopOfferKey({ kind: 'pack', packIndex: entry.packIndex });
          return (
            <pixiContainer key={offerKey} x={slot.x} y={slot.y} eventMode="passive">
              <ShopPackCard
                packDef={entry.packDef}
                packIndex={entry.packIndex}
                affordability={affordability}
                selected={selectedKey === offerKey}
                onSelectedChange={(selected) => onPackSelectedChange(entry.packIndex, selected)}
                onBuy={onBuyPack}
              />
            </pixiContainer>
          );
        })}
      </pixiContainer>
    </pixiContainer>
  );
}
