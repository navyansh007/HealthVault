import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { NeoButton, NeoInput, NeoText, Screen } from '@/components/neo';
import { useApp } from '@/context/app-context';
import { Neo } from '@/constants/theme';
import { authApi } from '@/lib/api';

const RESEND_SECONDS = 30;

export default function VerifyEmailScreen() {
  const { email = '' } = useLocalSearchParams<{ email: string }>();
  const { completeSignIn } = useApp();
  const [otp, setOtp] = useState('');
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const handleVerify = async () => {
    setBusy(true);
    setError('');
    try {
      const verified = await authApi.verifyEmail(email, otp);
      // Depending on project settings Neon Auth may not sign in on verification;
      // fall back to a one-time sign-in code in that case.
      if (verified.status === 'signed_in') {
        router.replace(await completeSignIn(verified));
      } else {
        await authApi.sendOtp(email, 'sign-in');
        router.replace('/onboarding/sign-in');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That code did not work');
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    setResendIn(RESEND_SECONDS);
    setError('');
    try {
      await authApi.sendOtp(email, 'email-verification');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not resend the code');
    }
  };

  return (
    <Screen
      showBack
      title="Verify your email"
      subtitle={`Enter the 6-digit code we sent to ${email}`}
      footer={<NeoButton label="Verify" size="lg" fullWidth loading={busy} disabled={otp.length < 6} onPress={handleVerify} />}>
      <NeoInput
        placeholder="••••••"
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        value={otp}
        onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
        maxLength={6}
        centered
        autoFocus
        error={error || undefined}
      />
      <NeoText variant="smallBold" style={styles.center} onPress={resendIn === 0 ? handleResend : undefined}>
        {resendIn > 0 ? `Resend code in 0:${String(resendIn).padStart(2, '0')}` : 'Resend code'}
      </NeoText>
      <NeoText variant="small" color={Neo.muted} style={styles.center}>
        Can&apos;t find it? Check your spam folder.
      </NeoText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
});
