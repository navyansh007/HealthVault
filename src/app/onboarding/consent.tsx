import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { NeoButton, NeoCheckbox, NeoSurface, NeoText, Screen } from '@/components/neo';
import { useApp } from '@/context/app-context';
import { Neo, Spacing } from '@/constants/theme';

const PRIVACY_SUMMARY =
  'HealthVault encrypts your documents and profile on this device before upload. Encrypted files are ' +
  'stored on the public IPFS network and encrypted metadata in our database; neither HealthVault nor ' +
  'anyone else can read them without your keys. Deleting a document removes our copy and its key.';

export default function ConsentScreen() {
  const { giveConsent } = useApp();
  const [storeLocally, setStoreLocally] = useState(false);
  const [acceptPolicy, setAcceptPolicy] = useState(false);

  const allChecked = storeLocally && acceptPolicy;

  return (
    <Screen
      showBack
      title="Your data, your control"
      subtitle="We need your consent before setting up your vault."
      footer={
        <NeoButton
          label="I Agree & Continue"
          size="lg"
          fullWidth
          disabled={!allChecked}
          onPress={() => {
            giveConsent();
            router.push('/onboarding/pin-setup');
          }}
        />
      }>
      <NeoSurface offset={5} radius={Neo.radius.md} bg={Neo.surface}>
        <View style={styles.card}>
          <NeoCheckbox
            checked={storeLocally}
            onToggle={() => setStoreLocally((v) => !v)}
            label="Encrypt my documents on this device and store the encrypted copies on IPFS"
          />
          <NeoCheckbox
            checked={acceptPolicy}
            onToggle={() => setAcceptPolicy((v) => !v)}
            label={'I have read and accept the Privacy Policy'}
          />
        </View>
      </NeoSurface>

      <NeoText
        variant="bodyBold"
        color={Neo.blue}
        style={styles.link}
        onPress={() => Alert.alert('Privacy Policy', PRIVACY_SUMMARY)}>
        Read the full Privacy Policy →
      </NeoText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.three, gap: Spacing.four },
  link: { paddingHorizontal: Spacing.one },
});
