import { Application } from "@pixi/react";
import { memo, Suspense } from "react";

import { GameScene } from "@/ui/scenes/GameScene";

export const GameCanvas = memo(function GameCanvas() {
  return (
    <div className="game-canvas-host">
      <Suspense fallback={<p className="game-loading">Loading…</p>}>
        <Application
          resizeTo={typeof window !== "undefined" ? window : undefined}
          background="#1a1a24"
          antialias
          autoDensity
          eventMode="static"
          eventFeatures={{ move: true, globalMove: true, click: true }}
          onInit={(app) => {
            app.stage.eventMode = "static";
            app.stage.sortableChildren = true;
          }}
          resolution={typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1}
        >
          <GameScene />
        </Application>
      </Suspense>
    </div>
  );
});
