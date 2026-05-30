import { useMemo, useState } from "react";

import type { StoryDefinition } from "@/ui/types/storyTypes";

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

export function PlaygroundLayout() {
  const [selectedId, setSelectedId] = useState<string>(loadedStories[0]?.id ?? "");

  const selectedStory = useMemo(
    () => loadedStories.find((story) => story.id === selectedId) ?? loadedStories[0] ?? null,
    [selectedId],
  );

  return (
    <main className="playground-page">
      <header className="playground-header">
        <h1 className="playground-title">Playground</h1>
      </header>

      {loadedStories.length ? (
        <>
          <label className="playground-select-label">
            Story
            <select
              className="playground-select"
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

          <section className="playground-stage" key={selectedStory?.id}>
            {selectedStory?.component}
          </section>
        </>
      ) : (
        <p className="playground-help">
          No stories found in <code>src/stories</code>. Add a <code>.tsx</code> file with a
          default export:
          <br />
          <code>{`{ name: "Card", component: <MyStory /> }`}</code>
        </p>
      )}
    </main>
  );
}
