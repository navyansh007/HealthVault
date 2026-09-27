import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Non-secret, device-local app state. Documents and the profile live
 * (encrypted) on the server/IPFS; keys and the session live in SecureStore.
 */
const STORAGE_KEY = 'healthvault:v2';

export interface PersistedState {
  userId: string | null;
  onboardingComplete: boolean;
  pinHash: string | null;
  pinSalt: string | null;
  consentGivenAt: string | null;
}

export const EMPTY_STATE: PersistedState = {
  userId: null,
  onboardingComplete: false,
  pinHash: null,
  pinSalt: null,
  consentGivenAt: null,
};

export async function loadPersistedState(): Promise<PersistedState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    return { ...EMPTY_STATE, ...JSON.parse(raw) };
  } catch {
    return EMPTY_STATE;
  }
}

export async function savePersistedState(state: PersistedState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('[storage] failed to persist app state', error);
  }
}

export async function clearPersistedState(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
}
