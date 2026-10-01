import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { NeoButton, NeoSurface, NeoText, Screen } from '@/components/neo';
import { useApp } from '@/context/app-context';
import { Neo, Spacing } from '@/constants/theme';

export default function OnboardingDoneScreen() {
  const { completeOnboarding, profile } = useApp();

  return (
    <Screen
      scroll={false}
      footer={<NeoButton label="Enter HealthVault" size="lg" fullWidth onPress={completeOnboarding} />}>
      <View style={styles.center}>
        <NeoSurface offset={6} radius={Neo.radius.lg} bg={Neo.primary}>
          <View style={styles.iconWrap}>
            <Ionicons name="checkmark-circle" size={56} color={Neo.primaryInk} />
          </View>
        </NeoSurface>
        <NeoText variant="display" style={styles.title}>
          You&apos;re all set{profile ? `, ${profile.name.split(' ')[0]}` : ''}!
        </NeoText>
        <NeoText variant="subtitle" style={styles.subtitle}>
          Your encrypted vault is ready and locked behind your PIN.
        </NeoText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, paddingHorizontal: Spacing.three },
  iconWrap: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center' },
});
