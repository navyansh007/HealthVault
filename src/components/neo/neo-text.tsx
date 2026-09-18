import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, Neo } from '@/constants/theme';

export type NeoTextVariant =
  | 'display'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'bodyBold'
  | 'small'
  | 'smallBold'
  | 'label'
  | 'mono';

export type NeoTextProps = TextProps & {
  variant?: NeoTextVariant;
  color?: string;
};

export function NeoText({ variant = 'body', color, style, maxFontSizeMultiplier = 1.4, ...rest }: NeoTextProps) {
  return (
    <Text
      style={[styles[variant], color ? { color } : null, style]}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  display: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '900',
    color: Neo.ink,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    color: Neo.ink,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '600',
    color: Neo.muted,
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
    color: Neo.ink,
  },
  bodyBold: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
    color: Neo.ink,
  },
  small: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: Neo.muted,
  },
  smallBold: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    color: Neo.ink,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    color: Neo.ink,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  mono: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    fontFamily: Fonts.mono,
    color: Neo.ink,
  },
});
