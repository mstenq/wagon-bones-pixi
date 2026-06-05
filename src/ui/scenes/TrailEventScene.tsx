import { Suspense, useMemo } from 'react';

import { gameFacade } from '@/game/facade/gameFacade';
import { useGameRunStore, useGameSceneStore } from '@/game/store/reactHooks';
import { SpyglassTrailPreview } from '@/ui/components/SpyglassTrailPreview/SpyglassTrailPreview';
import { TrailEventPanel } from '@/ui/components/TrailEventPanel/TrailEventPanel';
import {
  TrailEventContinueOnly,
  TrailEventResultView,
} from '@/ui/components/TrailEventResult/TrailEventResultView';
import { resolveTrailChoice } from '@/ui/trailEvent/trailEventActions';
import { computeTrailEventPanelLayout } from '@/ui/trailEvent/trailEventLayout';

export type TrailEventSceneProps = {
  contentW: number;
  contentH: number;
};

function selectHasScoutsSpyglass(run: { equipment: { defId: string }[] }): boolean {
  return run.equipment.some((item) => item.defId === 'scouts_spyglass');
}

export function TrailEventScene({ contentW, contentH }: TrailEventSceneProps) {
  const trailState = useGameSceneStore((state) => state.trailEvent);
  const hasSpyglass = useGameRunStore(selectHasScoutsSpyglass);

  const event = useMemo(() => {
    if (!trailState) {
      return null;
    }
    return gameFacade.trail.getEventById(trailState.eventId) ?? null;
  }, [trailState]);

  if (!trailState || !event) {
    return null;
  }

  const showSpyglass = hasSpyglass && !trailState.spyglassRevealed;
  const showResolved = trailState.resolved;
  const resolveSnapshot = trailState.resolveSnapshot;
  const availableChoices = gameFacade.trail.getAvailableChoices(event);

  const panelLayout = computeTrailEventPanelLayout(
    contentW,
    contentH,
    event.name,
    event.description,
    showResolved ? 0 : availableChoices.length,
  );
  const panelBottomY = panelLayout.panel.centerY + panelLayout.panel.height / 2;

  if (showSpyglass) {
    return (
      <Suspense fallback={null}>
        <SpyglassTrailPreview eventId={event.id} contentW={contentW} contentH={contentH} />
      </Suspense>
    );
  }

  return (
    <pixiContainer sortableChildren eventMode="passive">
      <Suspense fallback={null}>
        <TrailEventPanel
          event={event}
          layout={panelLayout}
          choices={showResolved ? [] : availableChoices}
          choicesDisabled={showResolved}
          onChoice={(choice) => resolveTrailChoice(choice.id)}
        />
      </Suspense>

      {showResolved && resolveSnapshot ? (
        <TrailEventResultView
          snapshot={resolveSnapshot}
          panelBottomY={panelBottomY}
          contentW={contentW}
          contentH={contentH}
        />
      ) : null}

      {showResolved && !resolveSnapshot ? <TrailEventContinueOnly contentW={contentW} contentH={contentH} /> : null}
    </pixiContainer>
  );
}
