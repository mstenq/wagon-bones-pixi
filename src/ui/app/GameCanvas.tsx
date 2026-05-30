import { Application } from "@pixi/react";
import { memo, Suspense } from "react";

import { GameScene } from "@/ui/scenes/GameScene";
import { PIXI_RENDERER_PREFERENCE } from "@/ui/pixi/appDefaults";

export const GameCanvas = memo(function GameCanvas() {
  return (
    <div className="min-h-screen w-full [&_canvas]:block">
      <Suspense fallback={<p className="m-0 p-6">Loading…</p>}>
        <Application
          resizeTo={typeof window !== "undefined" ? window : undefined}
          background="#1a1a24"
          antialias
          autoDensity
          preference={PIXI_RENDERER_PREFERENCE}
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
