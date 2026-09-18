import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Neo, Spacing } from '@/constants/theme';

import { NeoText } from './neo-text';

export type NeoCheckboxProps = {
  checked: boolean;
  onToggle: () => void;
  label: string;
};

export function NeoCheckbox({ checked, onToggle, label }: NeoCheckboxProps) {
  return (
    <Pressable onPress={onToggle} style={styles.row} accessibilityRole="checkbox" accessibilityState={{ checked }}>
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
      </View>
      <NeoText variant="body" style={styles.label}>
        {label}
      </NeoText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  box: {
    width: 26,
    height: 26,
    borderRadius: Neo.radius.sm,
    borderWidth: Neo.borderWidth,
    borderColor: Neo.ink,
    backgroundColor: Neo.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  boxChecked: { backgroundColor: Neo.ink },
  label: { flex: 1 },
});
