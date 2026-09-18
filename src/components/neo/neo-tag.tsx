import { Pressable, StyleSheet, View } from 'react-native';

import { Neo, Spacing } from '@/constants/theme';

import { NeoText } from './neo-text';

export type NeoTagProps = {
  label: string;
  bg?: string;
  textColor?: string;
  onPress?: () => void;
  selected?: boolean;
};

export function NeoTag({ label, bg = Neo.mutedSurface, textColor = Neo.ink, onPress, selected }: NeoTagProps) {
  const content = (
    <View
      style={[
        styles.tag,
        { backgroundColor: selected ? Neo.ink : bg, borderColor: Neo.ink },
      ]}>
      <NeoText variant="smallBold" color={selected ? '#FFFFFF' : textColor}>
        {label}
      </NeoText>
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} hitSlop={4}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderWidth: 2,
    borderRadius: Neo.radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: 7,
  },
});
