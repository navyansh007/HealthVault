import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { NeoInput, NeoSurface, NeoText, Screen } from '@/components/neo';
import { useApp } from '@/context/app-context';
import { Neo, Spacing } from '@/constants/theme';

export default function LockScreen() {
  const { unlock, signOut, session } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleChange = async (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    setPin(digits);
    setError('');
    if (digits.length === 4) {
      const ok = await unlock(digits);
      if (!ok) {
        setError('Incorrect PIN — try again');
        setPin('');
      }
    }
  };

  return (
    <Screen scroll={false}>
      <View style={styles.center}>
        <NeoSurface offset={6} radius={Neo.radius.lg} bg={Neo.ink}>
          <View style={styles.iconWrap}>
            <Ionicons name="lock-closed" size={40} color="#FFFFFF" />
          </View>
        </NeoSurface>
        <NeoText variant="title" style={styles.title}>
          Welcome back{session?.name ? `, ${session.name.split(' ')[0]}` : ''}
        </NeoText>
        <NeoText variant="subtitle" style={styles.subtitle}>
          Enter your PIN to unlock HealthVault
        </NeoText>

        <View style={styles.inputWrap}>
          <NeoInput
            placeholder="••••"
            keyboardType="number-pad"
            secureTextEntry
            value={pin}
            onChangeText={handleChange}
            maxLength={4}
            centered
            autoFocus
            error={error}
          />
        </View>

        <NeoText
          variant="smallBold"
          color={Neo.red}
          style={styles.forgot}
          onPress={() =>
            Alert.alert(
              'Forgot your PIN?',
              'Sign out and sign back in to set a new PIN. Your documents stay safe in your vault, but you will need your recovery key on this device.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
              ],
            )
          }>
          Forgot PIN?
        </NeoText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three },
  iconWrap: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  title: { textAlign: 'center', marginTop: Spacing.two },
  subtitle: { textAlign: 'center', marginBottom: Spacing.two },
  inputWrap: { alignSelf: 'stretch', paddingHorizontal: Spacing.four },
  forgot: { marginTop: Spacing.four },
});
