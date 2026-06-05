import { HandInfo } from '@/ui/components/HandInfo/HandInfo';
import { useQueryParam } from '@/ui/hooks/useQueryParam';
import type { StoryDefinition } from '@/ui/types/storyTypes';
import { panelButtonClass, panelLabelClass } from '@/ui/styles/panelControls';

const FLAME_MIN = 0;
const FLAME_MAX = 1;
const FLAME_STEP = 0.01;

const BASE_CHIPS = 40;
const BASE_MULT = 4;

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

function HandInfoStory() {
  const [chips, setChips] = useQueryParam('chips', {
    default: BASE_CHIPS,
    parse: parseNonNegativeInt,
    serialize: String,
  });
  const [mult, setMult] = useQueryParam('mult', {
    default: BASE_MULT,
    parse: parseNonNegativeInt,
    serialize: String,
  });
  const [flameIntensity, setFlameIntensity] = useQueryParam('flame', {
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
            setChips(BASE_CHIPS);
            setMult(BASE_MULT);
          }}
        >
          Reset
        </button>
        <button
          type="button"
          className={panelButtonClass}
          onClick={() => {
            setChips(chips + randomIncrement());
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

      <HandInfo handName="Full House" level={1} chips={chips} mult={mult} flameIntensity={flameIntensity} />
    </div>
  );
}

const handInfoStory: StoryDefinition = {
  name: 'HandInfo',
  component: <HandInfoStory />,
};

export default handInfoStory;
