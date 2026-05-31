import { WaveBounceChars } from "@/ui/components/WaveBounce/WaveBounceChars";
import { useQueryParam } from "@/ui/hooks/useQueryParam";
import type { StoryDefinition } from "@/ui/types/storyTypes";
import { panelLabelClass, panelSelectClass } from "@/ui/styles/panelControls";

const DEFAULT_STAGGER_SECONDS = 0.1;
const STAGGER_MIN = 0;
const STAGGER_MAX = 0.3;
const STAGGER_STEP = 0.005;

function parseStaggerSeconds(raw: string): number | undefined {
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value) || value < STAGGER_MIN || value > STAGGER_MAX) {
    return undefined;
  }
  return value;
}

function WaveBounceCharsStory() {
  const [staggerSeconds, setStaggerSeconds] = useQueryParam("stagger", {
    default: DEFAULT_STAGGER_SECONDS,
    parse: parseStaggerSeconds,
    serialize: (value) => value.toFixed(3),
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <label className={`${panelLabelClass} min-w-64`}>
        staggerSeconds ({staggerSeconds.toFixed(3)}s)
        <input
          type="range"
          className="py-4"
          min={STAGGER_MIN}
          max={STAGGER_MAX}
          step={STAGGER_STEP}
          value={staggerSeconds}
          onChange={(event) => setStaggerSeconds(Number.parseFloat(event.target.value))}
        />
      </label>

      <WaveBounceChars
        text="Full House"
        staggerSeconds={staggerSeconds}
        className="font-score text-3xl leading-none font-bold tracking-wide text-white select-none"
        renderChar={({ char }) => <span className="inline-block">{char}</span>}
      />
    </div>
  );
}

const waveBounceCharsStory: StoryDefinition = {
  name: "WaveBounceChars",
  component: <WaveBounceCharsStory />,
};

export default waveBounceCharsStory;
