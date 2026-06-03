import { useMemo } from "react";

import { useQueryParam } from "@/ui/hooks/useQueryParam";
import type { StoryDefinition } from "@/ui/types/storyTypes";
import { panelLabelClass, panelSelectClass } from "@/ui/styles/panelControls";

type LoadedStory = StoryDefinition & { id: string };

const storyModules = import.meta.glob<StoryDefinition>("/src/ui/stories/**/*.tsx", {
  eager: true,
  import: "default",
});

function isStoryDefinition(value: unknown): value is StoryDefinition {
  if (!value || typeof value !== "object") {
    return false;
  }
  const entry = value as Partial<StoryDefinition>;
  return typeof entry.name === "string" && "component" in entry;
}

const loadedStories: LoadedStory[] = Object.entries(storyModules)
  .map(([id, story]) => ({ id, story }))
  .filter((entry): entry is { id: string; story: StoryDefinition } =>
    isStoryDefinition(entry.story),
  )
  .map(({ id, story }) => ({ ...story, id }))
  .sort((left, right) => left.name.localeCompare(right.name));

const defaultStoryId = loadedStories[0]?.id ?? "";

export function PlaygroundLayout() {
  const [selectedId, setSelectedId] = useQueryParam("story", {
    default: defaultStoryId,
    parse: (raw) => (loadedStories.some((story) => story.id === raw) ? raw : undefined),
  });

  const selectedStory = useMemo(
    () => loadedStories.find((story) => story.id === selectedId) ?? loadedStories[0] ?? null,
    [selectedId],
  );

  return (
    <main className="flex min-h-screen flex-col gap-4 p-6 bg-background">
      <header>
        <h1 className="m-0 text-2xl font-bold">Playground</h1>
      </header>

      {loadedStories.length ? (
        <>
          <label className={panelLabelClass}>
            Story
            <select
              className={panelSelectClass}
              value={selectedStory?.id ?? ""}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {loadedStories.map((story) => (
                <option key={story.id} value={story.id}>
                  {story.name}
                </option>
              ))}
            </select>
          </label>

          <section
            className="flex h-full w-full flex-1 items-center justify-center"
            key={selectedStory?.id}
          >
            {selectedStory?.component}
          </section>
        </>
      ) : (
        <p className="m-0 text-sm text-zinc-300">
          No stories found in <code>src/stories</code>. Add a <code>.tsx</code> file with a
          default export:
          <br />
          <code>{`{ name: "Card", component: <MyStory /> }`}</code>
        </p>
      )}
    </main>
  );
}
