// ─── Trail event scene entry (No Phaser / React imports) ───

import { gameFacade } from './facade/gameFacade';
import type { TrailEventDef } from './TrailEventsSystem';
import { getRunState, runActions } from './store/runStore';
import { getSceneState, sceneActions } from './store/sceneStore';
import type { TrailEventSceneState } from './store/types';

function syncTrailToStore(slice: TrailEventSceneState): void {
  if (getSceneState().trailEvent) {
    sceneActions.patchTrailEvent(slice);
  } else {
    sceneActions.enterTrailEvent(slice);
  }

  if (gameFacade.trail.hasScoutsSpyglass() && !slice.spyglassRevealed) {
    runActions.patch({ pendingTrailEventId: slice.eventId });
  } else {
    runActions.patch({ pendingTrailEventId: null });
  }
}

function resolvePendingOrSelectEvent(): TrailEventDef {
  const sceneTrail = getSceneState().trailEvent;
  if (sceneTrail) {
    const event = gameFacade.trail.getEventById(sceneTrail.eventId);
    if (!event) {
      throw new Error(`Unknown trail event: ${sceneTrail.eventId}`);
    }
    return event;
  }

  if (gameFacade.trail.hasScoutsSpyglass()) {
    const pendingId = getRunState().pendingTrailEventId;
    if (pendingId) {
      const pending = gameFacade.trail.getEventById(pendingId);
      if (!pending) {
        throw new Error(`Unknown trail event: ${pendingId}`);
      }
      return pending;
    }
  }

  const event = gameFacade.trail.selectEvent();
  gameFacade.trail.markSeen(event.id);
  return event;
}

/** Prepare trail-event scene state — call from handlers, not during render. */
export function prepareTrailEventScene(): void {
  const existing = getSceneState().trailEvent;
  if (existing) {
    const event = gameFacade.trail.getEventById(existing.eventId);
    if (event) {
      gameFacade.trail.markSeen(event.id);
    }
    syncTrailToStore(existing);
    return;
  }

  const event = resolvePendingOrSelectEvent();
  syncTrailToStore({
    eventId: event.id,
    resolved: false,
    spyglassRevealed: false,
  });
}
