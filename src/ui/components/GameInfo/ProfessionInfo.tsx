import { NeoSurface } from "@/ui/components/NeoSurface/NeoSurface";

export type ProfessionInfoProps = {
  name: string;
  iconSrc?: string;
  compact?: boolean;
  className?: string;
};

export function ProfessionInfo({
  name,
  iconSrc,
  compact = false,
  className,
}: ProfessionInfoProps) {
  const faceClassName = compact
    ? "flex h-full min-h-9 items-center gap-1.5 p-1.5"
    : "flex h-full min-h-0 items-center gap-2 p-2 lg:gap-2.5 lg:p-3 xl:gap-3 xl:p-4";

  const iconWrapClass = compact ? "size-7 shrink-0" : "size-8 shrink-0 lg:size-10 ";

  const nameClass = compact
    ? "min-w-0 font-body truncate text-xs leading-none font-header "
    : "min-w-0 font-body truncate text-base leading-none font-header";

  return (
    <div
      className={["flex min-h-0 min-w-0 flex-col self-stretch", className].filter(Boolean).join(" ")}
      aria-label={`Profession ${name}`}
    >
      <NeoSurface fullWidth className="h-full" faceClassName={faceClassName}>
        <div
          className={[
            "aspect-square rounded-full border-2 border-black bg-black/10",
            iconWrapClass,
          ].join(" ")}
        >
          {iconSrc ? (
            <img src={iconSrc} alt="" className="size-full rounded-full object-cover" />
          ) : null}
        </div>
        <p className={nameClass}>{name}</p>
      </NeoSurface>
    </div>
  );
}
