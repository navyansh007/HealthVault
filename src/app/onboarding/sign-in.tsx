import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { NeoButton, NeoInput, NeoTag, NeoText, Screen } from '@/components/neo';
import { useApp } from '@/context/app-context';
import { Neo, Spacing } from '@/constants/theme';
import { authApi } from '@/lib/api';

type Method = 'password' | 'code';

const RESEND_SECONDS = 30;

export default function SignInScreen() {
  const { completeSignIn } = useApp();
  const [method, setMethod] = useState<Method>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordSignIn = () =>
    run(async () => {
      const result = await authApi.signIn(email.trim(), password);
      if (result.status === 'verification_required') {
        await authApi.sendOtp(email.trim(), 'email-verification');
        router.push({ pathname: '/onboarding/verify-email', params: { email: email.trim() } });
        return;
      }
      router.replace(await completeSignIn(result));
    });

  const handleSendCode = () =>
    run(async () => {
      await authApi.sendOtp(email.trim(), 'sign-in');
      setCodeSent(true);
      setResendIn(RESEND_SECONDS);
    });

  const handleCodeSignIn = () =>
    run(async () => {
      const result = await authApi.signInWithOtp(email.trim(), otp);
      if (result.status !== 'signed_in') throw new Error('Could not sign in with that code');
      router.replace(await completeSignIn(result));
    });

  const switchMethod = (next: Method) => {
    setMethod(next);
    setError('');
  };

  const footer =
    method === 'password' ? (
      <NeoButton
        label="Sign In"
        size="lg"
        fullWidth
        loading={busy}
        disabled={!emailValid || password.length === 0}
        onPress={handlePasswordSignIn}
      />
    ) : codeSent ? (
      <NeoButton
        label="Verify & Sign In"
        size="lg"
        fullWidth
        loading={busy}
        disabled={otp.length < 6}
        onPress={handleCodeSignIn}
      />
    ) : (
      <NeoButton label="Email Me a Code" size="lg" fullWidth loading={busy} disabled={!emailValid} onPress={handleSendCode} />
    );

  return (
    <Screen showBack title="Sign in" subtitle="Your vault is end-to-end encrypted and tied to your account." footer={footer}>
      <View style={styles.methods}>
        <NeoTag label="Password" selected={method === 'password'} onPress={() => switchMethod('password')} />
        <NeoTag label="Email code" selected={method === 'code'} onPress={() => switchMethod('code')} />
      </View>

      <NeoInput
        label="Email"
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          setCodeSent(false);
        }}
        autoFocus
      />

      {method === 'password' ? (
        <NeoInput
          label="Password"
          placeholder="Your password"
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={emailValid && password ? handlePasswordSignIn : undefined}
        />
      ) : codeSent ? (
        <>
          <NeoInput
            label="6-digit code"
            placeholder="••••••"
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            value={otp}
            onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            centered
            autoFocus
            helper={`We sent a code to ${email.trim()}`}
          />
          <NeoText
            variant="smallBold"
            style={styles.center}
            onPress={resendIn === 0 && !busy ? handleSendCode : undefined}>
            {resendIn > 0 ? `Resend code in 0:${String(resendIn).padStart(2, '0')}` : 'Resend code'}
          </NeoText>
        </>
      ) : null}

      {error ? (
        <NeoText variant="smallBold" color={Neo.red}>
          {error}
        </NeoText>
      ) : null}

      <NeoText variant="bodyBold" color={Neo.blue} style={styles.center} onPress={() => router.replace('/onboarding/sign-up')}>
        New to HealthVault? Create an account →
      </NeoText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  methods: { flexDirection: 'row', gap: Spacing.two },
  center: { textAlign: 'center' },
});
