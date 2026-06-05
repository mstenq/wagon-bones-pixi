import type { ButtonElementProps, ButtonVariant } from '@/ui/components/Button/buttonTheme';

export type { ButtonElementProps, ButtonVariant } from '@/ui/components/Button/buttonTheme';
export { BUTTON_VARIANTS } from '@/ui/components/Button/buttonTheme';

const variantFaceClass: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-black',
  neutral: 'bg-white text-black',
};

export function ButtonElement({
  variant,
  label,
  disabled = false,
  onClick,
  className,
  fullWidth = false,
}: ButtonElementProps) {
  const rootClassName = ['neo-surface-root', fullWidth ? 'w-full' : '', className].filter(Boolean).join(' ');

  const faceClassName = [
    'neo-surface-face neo-surface-face--interactive',
    'font-body cursor-pointer leading-none text-black',
    'flex min-h-8 w-full min-w-0 items-center justify-center px-1.5 py-0.5 text-xs lg:min-h-8 lg:px-2 lg:py-1 lg:text-sm xl:min-h-12 xl:px-4 xl:py-2.5 xl:text-[1.4rem]',
    'disabled:cursor-not-allowed disabled:bg-ui-disabled',
    variantFaceClass[variant],
  ].join(' ');

  return (
    <span className={rootClassName}>
      <span className="neo-surface-shadow" aria-hidden="true" />
      <button type="button" className={faceClassName} disabled={disabled} onClick={onClick}>
        {label}
      </button>
    </span>
  );
}
