import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AppProvider, useApp } from '@/context/app-context';
import '@/global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AppProvider>
  );
}

function RootNavigator() {
  const { hydrated, onboardingComplete, locked } = useApp();

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync();
  }, [hydrated]);

  if (!hydrated) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!onboardingComplete}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>

      <Stack.Protected guard={onboardingComplete && locked}>
        <Stack.Screen name="lock" />
      </Stack.Protected>

      <Stack.Protected guard={onboardingComplete && !locked}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="upload" options={{ presentation: 'modal' }} />
        <Stack.Screen name="document/[id]" options={{ presentation: 'modal' }} />
      </Stack.Protected>
    </Stack>
  );
}
