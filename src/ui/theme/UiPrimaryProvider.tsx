import { createContext, useCallback, useContext, useMemo, useState, type CSSProperties, type ReactNode } from 'react';

import { primaryPaletteCssProperties } from '@/ui/theme/primaryPalette';
import {
  DEFAULT_UI_PRIMARY_COLOR,
  getPrimaryHex,
  setPixiPrimaryFaceHex,
  UI_PRIMARY_COLORS,
  type UiPrimaryColor,
} from '@/ui/theme/uiTokens';

type UiPrimaryContextValue = {
  primaryColor: UiPrimaryColor;
  setPrimaryColor: (color: UiPrimaryColor) => void;
};

const UiPrimaryContext = createContext<UiPrimaryContextValue | null>(null);

export type UiPrimaryProviderProps = {
  children: ReactNode;
  /** Initial primary; defaults to blue. */
  defaultColor?: UiPrimaryColor;
  className?: string;
  style?: CSSProperties;
};

export function UiPrimaryProvider({
  children,
  defaultColor = DEFAULT_UI_PRIMARY_COLOR,
  className,
  style,
}: UiPrimaryProviderProps) {
  const [primaryColor, setPrimaryColorState] = useState<UiPrimaryColor>(() => {
    setPixiPrimaryFaceHex(getPrimaryHex(defaultColor));
    return defaultColor;
  });

  const setPrimaryColor = useCallback((color: UiPrimaryColor) => {
    if (!UI_PRIMARY_COLORS.includes(color)) {
      return;
    }
    setPrimaryColorState(color);
    setPixiPrimaryFaceHex(getPrimaryHex(color));
  }, []);

  const value = useMemo(() => ({ primaryColor, setPrimaryColor }), [primaryColor, setPrimaryColor]);

  const wrapperStyle: CSSProperties = {
    ...style,
    ...primaryPaletteCssProperties(primaryColor),
  };

  return (
    <UiPrimaryContext.Provider value={value}>
      <div className={className} style={wrapperStyle}>
        {children}
      </div>
    </UiPrimaryContext.Provider>
  );
}

export function useUiPrimary(): UiPrimaryContextValue {
  const context = useContext(UiPrimaryContext);
  if (!context) {
    return {
      primaryColor: DEFAULT_UI_PRIMARY_COLOR,
      setPrimaryColor: () => {},
    };
  }
  return context;
}
