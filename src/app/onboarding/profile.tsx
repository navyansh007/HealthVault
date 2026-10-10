import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { NeoButton, NeoInput, NeoTag, NeoText, Screen } from '@/components/neo';
import { useApp } from '@/context/app-context';
import { Neo, Spacing } from '@/constants/theme';
import { PatientProfile } from '@/lib/types';

const GENDERS: PatientProfile['gender'][] = ['Male', 'Female', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value && d.getTime() <= Date.now();
}

export default function ProfileSetupScreen() {
  const { profile, session, saveProfile } = useApp();

  const [name, setName] = useState(profile?.name ?? session?.name ?? '');
  const [dob, setDob] = useState(profile?.dob ?? '');
  const [gender, setGender] = useState<PatientProfile['gender'] | null>(profile?.gender ?? null);
  const [bloodGroup, setBloodGroup] = useState(profile?.bloodGroup ?? 'Unknown');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [address, setAddress] = useState(profile?.address ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const dobError = dob.length === 10 && !isValidIsoDate(dob) ? 'Enter a valid past date' : undefined;
  const canContinue =
    name.trim().length > 1 && isValidIsoDate(dob) && gender !== null && phone.length === 10;

  const handleContinue = async () => {
    if (!gender) return;
    setBusy(true);
    setError('');
    try {
      await saveProfile({ name: name.trim(), dob, gender, bloodGroup, phone, address: address.trim() });
      router.push('/onboarding/consent');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your profile');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      showBack
      title="About you"
      subtitle="Encrypted on this phone before it's saved. Only you can read it."
      footer={
        <NeoButton label="Continue" size="lg" fullWidth loading={busy} disabled={!canContinue} onPress={handleContinue} />
      }>
      <NeoInput label="Full Name" placeholder="e.g. Priya Sharma" value={name} onChangeText={setName} autoFocus />

      <NeoInput
        label="Date of Birth"
        placeholder="YYYY-MM-DD"
        keyboardType="numbers-and-punctuation"
        value={dob}
        onChangeText={(t) => setDob(t.slice(0, 10))}
        error={dobError}
      />

      <View style={styles.field}>
        <NeoText variant="label">Gender</NeoText>
        <View style={styles.chipWrap}>
          {GENDERS.map((g) => (
            <NeoTag key={g} label={g} selected={gender === g} onPress={() => setGender(g)} />
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <NeoText variant="label">Blood Group</NeoText>
        <View style={styles.chipWrap}>
          {BLOOD_GROUPS.map((b) => (
            <NeoTag key={b} label={b} bg={Neo.surface} selected={bloodGroup === b} onPress={() => setBloodGroup(b)} />
          ))}
        </View>
      </View>

      <NeoInput
        label="Mobile Number"
        placeholder="10-digit mobile number"
        keyboardType="number-pad"
        value={phone}
        onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
        maxLength={10}
      />

      <NeoInput label="City / Address (optional)" placeholder="e.g. Pune, MH" value={address} onChangeText={setAddress} />

      {error ? (
        <NeoText variant="smallBold" color={Neo.red}>
          {error}
        </NeoText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.two },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
