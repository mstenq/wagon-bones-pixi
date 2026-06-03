import type { CSSProperties, ReactNode } from "react";

import { CARDBOARD_TILE_IMAGE } from "@/ui/cardboard/assets";

export { CARDBOARD_TILE_IMAGE };

export type CardboardContainerProps = {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

const rootClass = ["cardboard-container", "box-border"].join(" ");

const tileStyle = {
  borderImageSource: `url(${CARDBOARD_TILE_IMAGE})`,
  backgroundImage: `url(${CARDBOARD_TILE_IMAGE})`,
} satisfies CSSProperties;

export function CardboardContainer({
  children,
  className,
  style,
}: CardboardContainerProps) {
  const classNames = [rootClass, className].filter(Boolean).join(" ");

  return (
    <div className={classNames} style={{ ...tileStyle, ...style }}>
      {children}
    </div>
  );
}
