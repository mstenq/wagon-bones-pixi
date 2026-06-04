import { Application } from "@pixi/react";
import { memo, Suspense, useState } from "react";

import { GameScene } from "@/ui/scenes/GameScene";
import { PIXI_RENDERER_PREFERENCE } from "@/ui/pixi/appDefaults";
import { UI_BACKGROUND_COLOR } from "../uiConstants";

export const GameCanvas = memo(function GameCanvas() {
  const [resizeTo, setResizeTo] = useState<HTMLElement | null>(null);

  return (
    <div
      ref={setResizeTo}
      className="h-full min-h-0 w-full min-w-0 [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full"
    >
      {resizeTo ? (
        <Suspense fallback={<p className="m-0 p-6">Loading…</p>}>
          <Application
            resizeTo={resizeTo}
            background={UI_BACKGROUND_COLOR}
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
      ) : (
        <p className="m-0 p-6">Loading…</p>
      )}
    </div>
  );
});
