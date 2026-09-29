import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { NeoButton, NeoSurface, NeoText, Screen } from '@/components/neo';
import { useApp } from '@/context/app-context';
import { Neo, Spacing } from '@/constants/theme';

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; label: string; bg: string }[] = [
  { icon: 'shield-checkmark', label: 'End-to-end encrypted: only you hold the keys', bg: Neo.mint },
  { icon: 'folder-open', label: 'Prescriptions, lab reports, and scans in one place', bg: Neo.yellow },
  { icon: 'globe', label: 'Stored on IPFS, not locked inside one company\'s server', bg: Neo.blue },
];

export default function WelcomeScreen() {
  const { session, resumeOnboarding, signOut } = useApp();
  const [resuming, setResuming] = useState(false);

  const handleResume = async () => {
    setResuming(true);
    try {
      const step = await resumeOnboarding();
      router.push(step ?? '/onboarding/sign-in');
    } catch {
      // The session is no longer valid, or the device is offline: start again from sign-in.
      await signOut();
      router.push('/onboarding/sign-in');
    } finally {
      setResuming(false);
    }
  };

  return (
    <Screen
      scroll={false}
      footer={
        <View style={styles.footer}>
          {session ? (
            <>
              <NeoButton label="Continue Setup" size="lg" fullWidth loading={resuming} onPress={handleResume} />
              <NeoText variant="small" style={styles.disclaimer}>
                Signed in as {session.email}
              </NeoText>
            </>
          ) : (
            <>
              <NeoButton label="Create Account" size="lg" fullWidth onPress={() => router.push('/onboarding/sign-up')} />
              <NeoButton
                label="I Already Have an Account"
                variant="secondary"
                size="lg"
                fullWidth
                onPress={() => router.push('/onboarding/sign-in')}
              />
            </>
          )}
        </View>
      }>
      <View style={styles.hero}>
        <NeoSurface offset={6} radius={Neo.radius.lg} bg={Neo.primary} style={styles.logo}>
          <View style={styles.logoInner}>
            <Ionicons name="pulse" size={40} color={Neo.primaryInk} />
          </View>
        </NeoSurface>
        <NeoText variant="display">HealthVault</NeoText>
        <NeoText variant="subtitle" style={styles.tagline}>
          Every medical record you own, in one secure vault.
        </NeoText>
      </View>

      <View style={styles.features}>
        {FEATURES.map((f) => (
          <NeoSurface key={f.label} offset={4} radius={Neo.radius.md} bg={Neo.surface}>
            <View style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: f.bg }]}>
                <Ionicons name={f.icon} size={20} color={Neo.ink} />
              </View>
              <NeoText variant="bodyBold" style={styles.featureLabel}>
                {f.label}
              </NeoText>
            </View>
          </NeoSurface>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingTop: Spacing.six, paddingBottom: Spacing.five, gap: Spacing.two },
  logo: { marginBottom: Spacing.two },
  logoInner: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  tagline: { textAlign: 'center', paddingHorizontal: Spacing.four },
  features: { gap: Spacing.three, flex: 1, justifyContent: 'center' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: Neo.radius.sm,
    borderWidth: Neo.borderWidth,
    borderColor: Neo.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: { flex: 1 },
  footer: { gap: Spacing.two },
  disclaimer: { textAlign: 'center' },
});
