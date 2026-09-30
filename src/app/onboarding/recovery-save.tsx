import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import { NeoButton, NeoCheckbox, NeoSurface, NeoText, Screen } from '@/components/neo';
import { useApp } from '@/context/app-context';
import { Neo, Spacing } from '@/constants/theme';

export default function RecoverySaveScreen() {
  const { pendingRecoveryKey, confirmRecoveryKeySaved } = useApp();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!pendingRecoveryKey) {
    return (
      <Screen title="Nothing to show" subtitle="Your recovery key has already been set up.">
        <NeoButton label="Continue" onPress={() => router.replace('/onboarding')} />
      </Screen>
    );
  }

  const handleContinue = async () => {
    setBusy(true);
    setError('');
    try {
      router.replace(await confirmRecoveryKeySaved());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your vault key');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      title="Save your recovery key"
      subtitle="Your documents are encrypted with a key only you hold. You'll need this to open your vault on a new phone."
      footer={
        <NeoButton label="Continue" size="lg" fullWidth loading={busy} disabled={!saved} onPress={handleContinue} />
      }>
      <NeoSurface offset={5} radius={Neo.radius.md} bg={Neo.yellow}>
        <View style={styles.keyBox}>
          <NeoText variant="label">Recovery key</NeoText>
          <NeoText variant="mono" selectable style={styles.key}>
            {pendingRecoveryKey}
          </NeoText>
        </View>
      </NeoSurface>

      <NeoButton
        label="Save to Password Manager / Notes"
        variant="secondary"
        icon={<Ionicons name="share-outline" size={16} color={Neo.ink} />}
        onPress={() => Share.share({ message: `HealthVault recovery key: ${pendingRecoveryKey}` }).catch(() => {})}
      />

      <NeoSurface offset={4} radius={Neo.radius.md} bg={Neo.mutedSurface}>
        <View style={styles.warning}>
          <Ionicons name="warning" size={20} color={Neo.ink} />
          <NeoText variant="body" style={styles.flex}>
            HealthVault never sees this key and cannot reset it. If you lose it and this phone, your documents cannot
            be recovered by anyone.
          </NeoText>
        </View>
      </NeoSurface>

      <NeoCheckbox checked={saved} onToggle={() => setSaved((v) => !v)} label="I have stored my recovery key somewhere safe" />

      {error ? (
        <NeoText variant="smallBold" color={Neo.red}>
          {error}
        </NeoText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyBox: { padding: Spacing.four, gap: Spacing.two, alignItems: 'center' },
  key: { fontSize: 18, lineHeight: 28, textAlign: 'center', letterSpacing: 1 },
  warning: { flexDirection: 'row', gap: Spacing.two, padding: Spacing.three, alignItems: 'flex-start' },
  flex: { flex: 1 },
});
