import { NeoSurface } from '@/ui/components/NeoSurface/NeoSurface';
import { WaveBounceChars } from '@/ui/components/WaveBounce/WaveBounceChars';

export type RoundTitleProps = {
  title: string;
  compact?: boolean;
  className?: string;
};

export function RoundTitle({ title, compact = false, className }: RoundTitleProps) {
  const faceClassName = compact
    ? 'flex min-h-9 items-center justify-center px-2 py-2 text-white'
    : 'flex h-full min-h-0 items-center justify-center px-2 py-1.5 text-white lg:px-3 lg:py-2 xl:px-5 xl:py-3.5';

  const titleClassName = compact
    ? 'text-center text-base font-header leading-none tracking-wide'
    : 'text-center text-lg font-header leading-none tracking-wide lg:text-xl xl:text-3xl';

  return (
    <div className={['h-full min-h-0 min-w-0', className].filter(Boolean).join(' ')} aria-label={title}>
      <NeoSurface fullWidth className="h-full" faceTone="primary" faceClassName={faceClassName}>
        <WaveBounceChars
          text={title}
          className={titleClassName}
          renderChar={({ displayChar }) => <span className="inline-block">{displayChar}</span>}
        />
      </NeoSurface>
    </div>
  );
}
