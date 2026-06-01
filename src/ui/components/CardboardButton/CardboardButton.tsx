import {
  CARDBOARD_BUTTON_IMAGES,
  type CardboardButtonVariant,
} from "@/ui/components/CardboardButton/cardboardButtonTheme";

export type { CardboardButtonVariant } from "@/ui/components/CardboardButton/cardboardButtonTheme";
export {
  CARDBOARD_BUTTON_IMAGES,
  CARDBOARD_BUTTON_VARIANTS,
} from "@/ui/components/CardboardButton/cardboardButtonTheme";

export type CardboardButtonProps = {
  variant: CardboardButtonVariant;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
};

const rootClass = [
  "cardboard-button",
  "font-score",
  "inline-flex",
  "min-w-28",
  "cursor-pointer",
  "items-center",
  "justify-center",
  "px-6",
  "py-1",
  "text-3xl",
  "leading-none",
  "text-cardboard-button-text",
  "select-none",
  "text-shadow-[1px_2px_0_var(--color-cardboard-button-text-shadow)]",
  "transition-transform",
  "active:translate-y-0.5",
  "disabled:cursor-not-allowed",
  "disabled:opacity-55",
  "disabled:active:scale-100",
].join(" ");

export function CardboardButton({
  variant,
  label,
  disabled = false,
  onClick,
  className,
  type = "button",
}: CardboardButtonProps) {
  const classNames = [rootClass, className].filter(Boolean).join(" ");

  return (
    <button
      type={type}
      className={classNames}
      disabled={disabled}
      onClick={onClick}
      style={{ borderImageSource: `url(${CARDBOARD_BUTTON_IMAGES[variant]})` }}
    >
      {label}
    </button>
  );
}
