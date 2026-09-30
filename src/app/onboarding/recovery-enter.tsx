import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { NeoButton, NeoInput, NeoText, Screen } from '@/components/neo';
import { useApp } from '@/context/app-context';
import { Neo } from '@/constants/theme';
import { normalizeRecoveryKey } from '@/lib/crypto';

export default function RecoveryEnterScreen() {
  const { restoreWithRecoveryKey, signOut } = useApp();
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const normalized = normalizeRecoveryKey(value);

  const handleRestore = async () => {
    if (!normalized) return;
    setBusy(true);
    setError('');
    try {
      router.replace(await restoreWithRecoveryKey(normalized));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not unlock your vault');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      title="Enter your recovery key"
      subtitle="This device hasn't opened your vault before. Enter the recovery key you saved when you created it."
      footer={
        <NeoButton label="Unlock Vault" size="lg" fullWidth loading={busy} disabled={!normalized} onPress={handleRestore} />
      }>
      <NeoInput
        label="Recovery key"
        placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
        autoCapitalize="characters"
        autoCorrect={false}
        value={value}
        onChangeText={setValue}
        multiline
        autoFocus
        error={error || undefined}
        helper="Dashes and spaces are optional."
      />
      <NeoText
        variant="smallBold"
        color={Neo.red}
        style={styles.center}
        onPress={async () => {
          await signOut();
          router.replace('/onboarding');
        }}>
        Use a different account
      </NeoText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
});
