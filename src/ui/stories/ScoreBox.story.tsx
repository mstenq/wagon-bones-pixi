import { ScoreBox } from "@/ui/components/ScoreBox/ScoreBox";
import { useQueryParam } from "@/ui/hooks/useQueryParam";
import type { StoryDefinition } from "@/ui/types/storyTypes";
import { panelButtonClass, panelLabelClass } from "@/ui/styles/panelControls";

const FLAME_MIN = 0;
const FLAME_MAX = 1;
const FLAME_STEP = 0.01;

function randomIncrement(): number {
  return Math.floor(Math.random() * 20) + 1;
}

function parseNonNegativeInt(raw: string): number | undefined {
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

function parseFlameIntensity(raw: string): number | undefined {
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value) || value < FLAME_MIN || value > FLAME_MAX) {
    return undefined;
  }
  return value;
}

function ScoreBoxStory() {
  const [points, setPoints] = useQueryParam("points", {
    default: 86,
    parse: parseNonNegativeInt,
    serialize: String,
  });
  const [mult, setMult] = useQueryParam("mult", {
    default: 6,
    parse: parseNonNegativeInt,
    serialize: String,
  });
  const [flameIntensity, setFlameIntensity] = useQueryParam("flame", {
    default: 0.65,
    parse: parseFlameIntensity,
    serialize: (value) => value.toFixed(2),
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-4">
        <button
          type="button"
          className={panelButtonClass}
          onClick={() => {
            setPoints(0);
            setMult(0);
          }}
        >
          Reset
        </button>
        <button
          type="button"
          className={panelButtonClass}
          onClick={() => {
            setPoints(points + randomIncrement());
            setMult(mult + randomIncrement());
          }}
        >
          Increment
        </button>
      </div>

      <label className={`${panelLabelClass} min-w-64`}>
        flameIntensity ({flameIntensity.toFixed(2)})
        <input
          type="range"
          className="py-4"
          min={FLAME_MIN}
          max={FLAME_MAX}
          step={FLAME_STEP}
          value={flameIntensity}
          onChange={(event) => setFlameIntensity(Number.parseFloat(event.target.value))}
        />
      </label>

      <div className="flex items-center gap-2.5">
        <ScoreBox variant="points" value={points} flameIntensity={flameIntensity} />
        <span
          className="font-score text-2xl leading-none font-bold text-red-500 select-none"
          aria-hidden
        >
          x
        </span>
        <ScoreBox variant="mult" value={mult} flameIntensity={flameIntensity} />
      </div>
    </div>
  );
}

const scoreBoxStory: StoryDefinition = {
  name: "ScoreBox",
  component: <ScoreBoxStory />,
};

export default scoreBoxStory;
