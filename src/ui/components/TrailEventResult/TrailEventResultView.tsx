import { useMemo, useState } from 'react';

import { useGameRunStore } from '@/game/store/reactHooks';
import type { TrailEventResolveSnapshot } from '@/game/store/types';
import { Button } from '@/ui/components/Button/Button';
import {
  buildTrailEffectLines,
  findLoseEquipmentChoiceEffect,
} from '@/ui/trailEvent/formatTrailEffect';
import { computeTrailEventResultLayout } from '@/ui/trailEvent/trailEventLayout';
import {
  trailEventEffectTextStyle,
  trailEventProtectionTextStyle,
  trailEventResultMessageTextStyle,
  trailEventSacrificePromptTextStyle,
} from '@/ui/trailEvent/trailEventTheme';
import { hexToPixiColor } from '@/ui/pixi/color';
import {
  destroyTrailSacrificeEquipment,
  getEligibleSacrificeEquipment,
  proceedAfterTrailEvent,
} from '@/ui/trailEvent/trailEventActions';

export type TrailEventResultViewProps = {
  snapshot: TrailEventResolveSnapshot;
  panelBottomY: number;
  contentW: number;
  contentH: number;
};

export function TrailEventResultView({
  snapshot,
  panelBottomY,
  contentW,
  contentH,
}: TrailEventResultViewProps) {
  const negatesNegatives = snapshot.negatedNegativeEffects ?? false;
  const equipmentBeforeCount = snapshot.equipmentBeforeResolve.length;

  const effectLines = useMemo(
    () =>
      buildTrailEffectLines(
        snapshot.effects,
        negatesNegatives,
        snapshot.enhancedDiceBeforeCount,
        equipmentBeforeCount,
      ),
    [equipmentBeforeCount, negatesNegatives, snapshot.effects, snapshot.enhancedDiceBeforeCount],
  );

  const loseEquipEffect = useMemo(
    () => findLoseEquipmentChoiceEffect(snapshot.effects, negatesNegatives),
    [negatesNegatives, snapshot.effects],
  );
  const sacrificeCount = loseEquipEffect?.count ?? 1;

  const equipmentRevision = useGameRunStore((run) => run.equipment.map((item) => item.defId).join('|'));
  const eligibleEquipment = useMemo(
    () => getEligibleSacrificeEquipment(snapshot.equipmentBeforeResolve),
    [equipmentRevision, snapshot.equipmentBeforeResolve],
  );

  const [remainingSacrifices, setRemainingSacrifices] = useState(() =>
    Math.min(sacrificeCount, eligibleEquipment.length),
  );
  const [sacrificeComplete, setSacrificeComplete] = useState(() => remainingSacrifices <= 0);

  const layout = useMemo(
    () =>
      computeTrailEventResultLayout(
        contentW,
        contentH,
        panelBottomY,
        effectLines.length,
        snapshot.protectionText != null,
        !!snapshot.message,
      ),
    [contentH, contentW, effectLines.length, panelBottomY, snapshot.message, snapshot.protectionText],
  );

  const messageStyle = useMemo(() => trailEventResultMessageTextStyle(), []);
  const protectionStyle = useMemo(() => trailEventProtectionTextStyle(), []);
  const sacrificeStyle = useMemo(() => trailEventSacrificePromptTextStyle(), []);

  const showSacrificePicker = !sacrificeComplete && remainingSacrifices > 0 && eligibleEquipment.length > 0;
  const showContinue = !showSacrificePicker;

  let yOffset = layout.resultStartY;
  if (snapshot.protectionText) {
    yOffset += 4;
  }

  const handleSacrifice = (index: number) => {
    destroyTrailSacrificeEquipment(index);
    setRemainingSacrifices((prev) => {
      const next = prev - 1;
      if (next <= 0) {
        setSacrificeComplete(true);
      }
      return next;
    });
  };

  return (
    <pixiContainer sortableChildren eventMode="passive">
      {snapshot.protectionText ? (
        <pixiText
          text={snapshot.protectionText}
          style={protectionStyle}
          anchor={{ x: 0.5, y: 0 }}
          x={layout.contentCX}
          y={layout.resultStartY - 24}
          eventMode="none"
        />
      ) : null}

      {snapshot.message ? (
        <pixiText
          text={`"${snapshot.message}"`}
          style={messageStyle}
          anchor={{ x: 0.5, y: 0 }}
          x={layout.contentCX}
          y={yOffset}
          eventMode="none"
        />
      ) : null}

      {effectLines.map((line, index) => {
        const lineY = yOffset + (snapshot.message ? 30 : 0) + index * 24;
        const style = trailEventEffectTextStyle(hexToPixiColor(line.color));
        return (
          <pixiText
            key={`${line.text}-${index}`}
            text={line.text}
            style={style}
            anchor={{ x: 0.5, y: 0 }}
            x={layout.contentCX}
            y={lineY}
            eventMode="none"
          />
        );
      })}

      {showSacrificePicker ? (
        <>
          <pixiText
            text={`Choose ${remainingSacrifices} equipment to sacrifice:`}
            style={sacrificeStyle}
            anchor={{ x: 0.5, y: 0 }}
            x={layout.contentCX}
            y={layout.continueButtonY - 72}
            eventMode="none"
          />
          {eligibleEquipment.map((item, slot) => {
            const spacing = 150;
            const totalW = (eligibleEquipment.length - 1) * spacing;
            const startX = layout.contentCX - totalW / 2;
            return (
              <Button
                key={`${item.index}-${item.name}`}
                variant="neutral"
                label={item.name}
                x={startX + slot * spacing}
                y={layout.continueButtonY - 24}
                width={140}
                height={40}
                onClick={() => handleSacrifice(item.index)}
              />
            );
          })}
        </>
      ) : null}

      {showContinue ? (
        <Button
          variant="primary"
          label="Continue"
          x={layout.contentCX}
          y={layout.continueButtonY}
          width={layout.buttonWidth}
          height={layout.buttonHeight}
          onClick={proceedAfterTrailEvent}
        />
      ) : null}
    </pixiContainer>
  );
}

export type TrailEventContinueOnlyProps = {
  contentW: number;
  contentH: number;
};

/** Restored save where the event was already resolved — outcome lines are not stored. */
export function TrailEventContinueOnly({ contentW, contentH }: TrailEventContinueOnlyProps) {
  return (
    <Button
      variant="primary"
      label="Continue"
      x={contentW / 2}
      y={contentH - 48}
      width={220}
      height={44}
      onClick={proceedAfterTrailEvent}
    />
  );
}
