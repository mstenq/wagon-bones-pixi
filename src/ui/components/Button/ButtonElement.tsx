import type { ButtonElementProps, ButtonVariant } from "@/ui/components/Button/buttonTheme";

export type { ButtonElementProps, ButtonVariant } from "@/ui/components/Button/buttonTheme";
export { BUTTON_VARIANTS } from "@/ui/components/Button/buttonTheme";

const variantFaceClass: Record<ButtonVariant, string> = {
  primary: "bg-btn-primary",
  secondary: "bg-btn-secondary",
  success: "bg-btn-success",
  danger: "bg-btn-danger",
  warning: "bg-btn-warning",
};

export function ButtonElement({
  variant,
  label,
  disabled = false,
  onClick,
  className,
  fullWidth = false,
}: ButtonElementProps) {
  const rootClassName = ["btn-neo-root", fullWidth ? "w-full" : "", className]
    .filter(Boolean)
    .join(" ");

  const faceClassName = [
    "btn-neo-face",
    "font-button cursor-pointer text-[1.4rem] leading-none font-normal text-black",
    "flex min-h-10 w-full min-w-0 items-center justify-center px-3 py-2 md:min-h-12 md:px-4 md:py-2.5",
    "disabled:cursor-not-allowed disabled:bg-btn-disabled-face",
    variantFaceClass[variant],
  ].join(" ");

  return (
    <span className={rootClassName}>
      <span className="btn-neo-shadow" aria-hidden="true" />
      <button type="button" className={faceClassName} disabled={disabled} onClick={onClick}>
        {label}
      </button>
    </span>
  );
}
