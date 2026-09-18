import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { Neo, Spacing } from '@/constants/theme';

import { NeoSurface } from './neo-surface';
import { NeoText } from './neo-text';

export type NeoInputProps = TextInputProps & {
  label?: string;
  error?: string;
  helper?: string;
  centered?: boolean;
};

export function NeoInput({ label, error, helper, centered, style, ...rest }: NeoInputProps) {
  return (
    <View style={styles.wrap}>
      {label ? <NeoText variant="label">{label}</NeoText> : null}
      <NeoSurface offset={4} radius={Neo.radius.sm} borderColor={error ? Neo.red : Neo.ink}>
        <TextInput
          placeholderTextColor={Neo.muted}
          style={[styles.input, centered && styles.centered, style]}
          maxFontSizeMultiplier={1.3}
          {...rest}
        />
      </NeoSurface>
      {error ? (
        <NeoText variant="small" color={Neo.red}>
          {error}
        </NeoText>
      ) : helper ? (
        <NeoText variant="small">{helper}</NeoText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.two },
  input: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    color: Neo.ink,
  },
  centered: { textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: '800' },
});
