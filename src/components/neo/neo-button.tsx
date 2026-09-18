import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Neo, Spacing } from '@/constants/theme';

import { NeoSurface } from './neo-surface';
import { NeoText } from './neo-text';

export type NeoButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'dark';

const VARIANT_BG: Record<NeoButtonVariant, string> = {
  primary: Neo.primary,
  secondary: Neo.surface,
  danger: Neo.red,
  ghost: Neo.bg,
  dark: Neo.ink,
};

const VARIANT_TEXT: Record<NeoButtonVariant, string> = {
  primary: Neo.primaryInk,
  secondary: Neo.ink,
  danger: '#FFFFFF',
  ghost: Neo.ink,
  dark: '#FFFFFF',
};

export type NeoButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: NeoButtonVariant;
  size?: 'md' | 'lg' | 'sm';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
};

export function NeoButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  style,
}: NeoButtonProps) {
  const isDisabled = disabled || loading;
  const padding = size === 'lg' ? { paddingVertical: 18, paddingHorizontal: 24 } : size === 'sm' ? { paddingVertical: 9, paddingHorizontal: 14 } : { paddingVertical: 14, paddingHorizontal: 20 };

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      style={[fullWidth ? styles.fullWidth : styles.auto, isDisabled && styles.disabled, style]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}>
      {({ pressed }) => (
        <NeoSurface
          offset={size === 'sm' ? 3 : 4}
          radius={Neo.radius.sm}
          bg={VARIANT_BG[variant]}
          pressed={pressed && !isDisabled}
          style={fullWidth ? styles.fullWidth : undefined}
          innerStyle={[styles.inner, padding, fullWidth && styles.centerContent]}>
          {loading ? (
            <ActivityIndicator color={VARIANT_TEXT[variant]} />
          ) : (
            <View style={styles.row}>
              {icon}
              <NeoText variant={size === 'lg' ? 'title' : 'bodyBold'} color={VARIANT_TEXT[variant]} style={size === 'lg' ? styles.lgLabel : undefined}>
                {label}
              </NeoText>
            </View>
          )}
        </NeoSurface>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  auto: { alignSelf: 'flex-start' },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.45 },
  inner: { alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: Spacing.two },
  centerContent: { alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  lgLabel: { fontSize: 18 },
});
