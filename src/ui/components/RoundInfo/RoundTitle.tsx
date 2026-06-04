import { NeoSurface } from "@/ui/components/NeoSurface/NeoSurface";
import { WaveBounceChars } from "@/ui/components/WaveBounce/WaveBounceChars";

export type RoundTitleProps = {
  title: string;
  className?: string;
};

export function RoundTitle({ title, className }: RoundTitleProps) {
  return (
    <div
      className={["h-full min-h-0 min-w-0", className].filter(Boolean).join(" ")}
      aria-label={title}
    >
      <NeoSurface
        fullWidth
        className="h-full"
        faceTone="primary"
        faceClassName="flex h-full min-h-0 items-center justify-center px-4 py-3 text-white md:px-5 md:py-3.5"
      >
        <WaveBounceChars
          text={title}
          className="text-center text-2xl font-header leading-none tracking-wide md:text-3xl"
          renderChar={({ displayChar }) => <span className="inline-block">{displayChar}</span>}
        />
      </NeoSurface>
    </div>
  );
}
