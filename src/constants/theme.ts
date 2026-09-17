/**
 * HealthVault design tokens (neubrutalist style): one fixed light palette,
 * thick black borders, flat offset shadows without blur, a warm paper
 * background, and one accent colour per document category.
 */
import { Platform } from 'react-native';

export const Neo = {
  bg: '#F3EEE2',
  surface: '#FFFFFF',
  ink: '#111111',
  border: '#111111',
  muted: '#6B665C',
  mutedSurface: '#E9E2D0',

  primary: '#C6FF3D',
  primaryInk: '#10210A',
  blue: '#5B8DFF',
  pink: '#FF6B8B',
  yellow: '#FFD23D',
  purple: '#B79CFF',
  mint: '#7BE0B0',
  orange: '#FFB27A',
  red: '#FF4D4D',

  borderWidth: 3,
  radius: {
    none: 0,
    sm: 6,
    md: 12,
    lg: 20,
    pill: 999,
  },
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Fonts = Platform.select({
  ios: { mono: 'ui-monospace' },
  default: { mono: 'monospace' },
  web: { mono: 'var(--font-mono, monospace)' },
})!;

export const BottomTabInset = Platform.select({ ios: 34, android: 24, default: 0 }) ?? 0;
export const MaxContentWidth = 560;
