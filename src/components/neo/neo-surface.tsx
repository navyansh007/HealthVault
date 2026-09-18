import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { Neo } from '@/constants/theme';

export type NeoSurfaceProps = ViewProps & {
  offset?: number;
  radius?: number;
  bg?: string;
  borderColor?: string;
  pressed?: boolean;
  innerStyle?: StyleProp<ViewStyle>;
};

/**
 * Core Neubrutalist building block: a bordered box sitting on top of a flat,
 * hard-edged "drop shadow" made from a second solid-colour box (no native
 * shadow/blur), so it renders identically on iOS, Android, and web.
 */
export function NeoSurface({
  offset = 5,
  radius = Neo.radius.md,
  bg = Neo.surface,
  borderColor = Neo.ink,
  pressed = false,
  style,
  innerStyle,
  children,
  ...rest
}: NeoSurfaceProps) {
  const shift = pressed ? offset : 0;
  return (
    <View style={[{ paddingRight: offset, paddingBottom: offset }, style]} {...rest}>
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { top: offset, left: offset, right: 0, bottom: 0, backgroundColor: Neo.ink, borderRadius: radius },
        ]}
      />
      <View
        style={[
          {
            borderWidth: Neo.borderWidth,
            borderColor,
            borderRadius: radius,
            backgroundColor: bg,
            transform: [{ translateX: shift }, { translateY: shift }],
          },
          innerStyle,
        ]}>
        {children}
      </View>
    </View>
  );
}
