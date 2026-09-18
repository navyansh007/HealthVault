import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaxContentWidth, Neo, Spacing } from '@/constants/theme';

import { NeoText } from './neo-text';

export type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  footer?: React.ReactNode;
  contentStyle?: ViewStyle;
};

export function Screen({ children, scroll = true, title, subtitle, onBack, showBack, footer, contentStyle }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.inner}>
        {showBack ? (
          <Pressable
            onPress={onBack ?? (() => router.back())}
            style={styles.backButton}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={22} color={Neo.ink} />
          </Pressable>
        ) : null}
        {title ? (
          <View style={styles.header}>
            <NeoText variant="title">{title}</NeoText>
            {subtitle ? (
              <NeoText variant="subtitle" style={styles.subtitle}>
                {subtitle}
              </NeoText>
            ) : null}
          </View>
        ) : null}
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.scrollContent, contentStyle]}
            keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flexContent, contentStyle]}>{children}</View>
        )}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Neo.bg },
  inner: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  backButton: {
    marginTop: Spacing.two,
    marginLeft: Spacing.three,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, paddingBottom: Spacing.three, gap: Spacing.one },
  subtitle: { marginTop: Spacing.half },
  scrollContent: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.six, gap: Spacing.three, flexGrow: 1 },
  flexContent: { flex: 1, paddingHorizontal: Spacing.four, gap: Spacing.three },
  footer: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.three, paddingTop: Spacing.two },
});
