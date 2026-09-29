import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { NeoButton, NeoInput, NeoText, Screen } from '@/components/neo';
import { useApp } from '@/context/app-context';
import { Neo } from '@/constants/theme';
import { authApi } from '@/lib/api';

export default function SignUpScreen() {
  const { completeSignIn } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = name.trim().length > 1 && emailValid && password.length >= 8;

  const handleSignUp = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await authApi.signUp(email.trim(), password, name.trim());
      if (result.status === 'verification_required') {
        router.push({ pathname: '/onboarding/verify-email', params: { email: email.trim() } });
        return;
      }
      router.replace(await completeSignIn(result));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create your account');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      showBack
      title="Create your account"
      subtitle="Your account lets you reach your encrypted vault from any device."
      footer={
        <NeoButton label="Create Account" size="lg" fullWidth loading={busy} disabled={!canSubmit} onPress={handleSignUp} />
      }>
      <NeoInput label="Full Name" placeholder="e.g. Priya Sharma" value={name} onChangeText={setName} autoFocus />
      <NeoInput
        label="Email"
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        value={email}
        onChangeText={setEmail}
      />
      <NeoInput
        label="Password"
        placeholder="At least 8 characters"
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        value={password}
        onChangeText={setPassword}
        helper="Protects your account. Your files are additionally protected by a recovery key you'll get next."
      />

      {error ? (
        <NeoText variant="smallBold" color={Neo.red}>
          {error}
        </NeoText>
      ) : null}

      <NeoText variant="bodyBold" color={Neo.blue} style={styles.center} onPress={() => router.replace('/onboarding/sign-in')}>
        Already have an account? Sign in →
      </NeoText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
});
