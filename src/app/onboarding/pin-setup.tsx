import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { NeoInput, NeoText, Screen } from '@/components/neo';
import { useApp } from '@/context/app-context';
import { Neo, Spacing } from '@/constants/theme';

export default function PinSetupScreen() {
  const { setPin } = useApp();
  const [stage, setStage] = useState<'create' | 'confirm'>('create');
  const [pin, setPinValue] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const handleChangeCreate = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    setPinValue(digits);
    setError('');
    if (digits.length === 4) {
      setStage('confirm');
    }
  };

  const handleChangeConfirm = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    setConfirmPin(digits);
    if (digits.length === 4) {
      if (digits === pin) {
        setPin(digits).then(() => router.push('/onboarding/done'));
      } else {
        setError('PINs do not match — try again');
        setConfirmPin('');
      }
    }
  };

  return (
    <Screen
      showBack
      onBack={() => {
        if (stage === 'confirm') {
          setStage('create');
          setConfirmPin('');
          setError('');
        } else {
          router.back();
        }
      }}
      title="Set a vault PIN"
      subtitle="This adds a lock screen so only you can open HealthVault — even if someone picks up your phone.">
      <View style={styles.wrap}>
        <NeoText variant="label" style={styles.stageLabel}>
          {stage === 'create' ? 'Enter a 4-digit PIN' : 'Confirm your PIN'}
        </NeoText>
        {stage === 'create' ? (
          <NeoInput
            key="create"
            placeholder="••••"
            keyboardType="number-pad"
            secureTextEntry
            value={pin}
            onChangeText={handleChangeCreate}
            maxLength={4}
            centered
            autoFocus
          />
        ) : (
          <NeoInput
            key="confirm"
            placeholder="••••"
            keyboardType="number-pad"
            secureTextEntry
            value={confirmPin}
            onChangeText={handleChangeConfirm}
            maxLength={4}
            centered
            autoFocus
            error={error}
          />
        )}
        <NeoText variant="small" style={styles.hint}>
          You&apos;ll be asked for this PIN every time you open the app or bring it back from the background.
        </NeoText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: Spacing.five, gap: Spacing.three, alignItems: 'stretch' },
  stageLabel: { textAlign: 'center' },
  hint: { textAlign: 'center', color: Neo.muted },
});
