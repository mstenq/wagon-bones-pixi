export const BUTTON_VARIANTS = ['primary', 'neutral'] as const;

export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

export { BUTTON_DISABLED_FACE_HEX, BUTTON_NEUTRAL_FACE_HEX } from '@/ui/theme/uiTokens';
