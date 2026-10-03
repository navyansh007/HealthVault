import { Ionicons } from '@expo/vector-icons';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { ComponentProps } from 'react';
import { Pressable, type PressableProps, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NeoText } from '@/components/neo';
import { MaxContentWidth, Neo, Spacing } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const TAB_ITEMS: { name: string; href: '/' | '/profile'; label: string; icon: IconName }[] = [
  { name: 'vault', href: '/', label: 'Vault', icon: 'albums' },
  { name: 'profile', href: '/profile', label: 'Profile', icon: 'person' },
];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs style={styles.root}>
      <TabSlot style={styles.slot} />
      <View style={[styles.tabList, { paddingBottom: Math.max(insets.bottom, Spacing.two) }]}>
      <TabList style={styles.tabRow}>
        {TAB_ITEMS.map((item) => (
          <TabTrigger key={item.name} name={item.name} href={item.href} asChild>
            <TabButton icon={item.icon} label={item.label} />
          </TabTrigger>
        ))}
      </TabList>
      </View>
    </Tabs>
  );
}

type TabButtonProps = PressableProps & {
  icon: IconName;
  label: string;
  // Injected by TabTrigger's `asChild` merge — not set by callers.
  isFocused?: boolean;
};

function TabButton({ icon, label, isFocused, style: _ignoredStyle, ...rest }: TabButtonProps) {
  return (
    <Pressable {...rest} style={styles.trigger}>
      <View style={styles.triggerInner}>
        <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
          <Ionicons name={icon} size={18} color={isFocused ? '#FFFFFF' : Neo.ink} />
        </View>
        <NeoText variant="label" color={isFocused ? Neo.ink : Neo.muted}>
          {label}
        </NeoText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Neo.bg },
  slot: { flex: 1, minHeight: 0 },
  tabList: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    backgroundColor: Neo.surface,
    borderTopWidth: Neo.borderWidth,
    borderTopColor: Neo.ink,
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.one,
  },
  tabRow: { flexDirection: 'row', flex: 1 },
  trigger: { flex: 1 },
  triggerInner: { alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: Spacing.two },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: Neo.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: Neo.ink },
});
