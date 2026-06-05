import { NeoSurface } from "@/ui/components/NeoSurface/NeoSurface";

export type GameModifierPolarity = "positive" | "negative";

export type GameModifier = {
  id: string;
  polarity: GameModifierPolarity;
};

export type GameModifiersProps = {
  modifiers: GameModifier[];
  compact?: boolean;
  className?: string;
};

function modifierCircleClass(polarity: GameModifierPolarity, compact: boolean): string {
  const colorClass =
    polarity === "positive" ? "bg-ui-modifier-positive" : "bg-ui-modifier-negative";
  const sizeClass = compact ? "size-5" : "size-6 lg:size-7 xl:size-8";

  return ["shrink-0 rounded-full border-2 border-black", colorClass, sizeClass].join(" ");
}

export function GameModifiers({ modifiers, compact = false, className }: GameModifiersProps) {
  const faceClassName = compact
    ? "flex h-full min-h-9 items-center justify-center gap-1 p-1.5"
    : "flex h-full min-h-0 items-center justify-center gap-1.5 p-2 lg:gap-2 lg:p-3 xl:gap-2.5 xl:p-4";

  const emptyClass = compact
    ? "text-center text-[10px] leading-none text-black/50"
    : "text-center text-xs leading-none text-black/50 lg:text-sm xl:text-base";

  const hasModifiers = modifiers.length > 0;

  return (
    <div
      className={["flex min-h-0 min-w-0 flex-col self-stretch", className].filter(Boolean).join(" ")}
      aria-label={hasModifiers ? `${modifiers.length} active modifiers` : "No modifiers"}
    >
      <NeoSurface fullWidth className="h-full" faceClassName={faceClassName}>
        {hasModifiers ? (
          <div className="flex flex-wrap items-center justify-center gap-1 lg:gap-1.5">
            {modifiers.map((modifier) => (
              <span
                key={modifier.id}
                className={modifierCircleClass(modifier.polarity, compact)}
                aria-hidden
              />
            ))}
          </div>
        ) : (
          <p className={emptyClass}>No modifiers</p>
        )}
      </NeoSurface>
    </div>
  );
}
