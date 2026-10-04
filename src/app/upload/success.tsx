import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { NeoButton, NeoSurface, NeoText, Screen } from '@/components/neo';
import { Neo, Spacing } from '@/constants/theme';

export default function UploadSuccessScreen() {
  return (
    <Screen
      scroll={false}
      footer={
        <NeoButton label="Done" size="lg" fullWidth onPress={() => router.dismissTo('/')} />
      }>
      <View style={styles.center}>
        <NeoSurface offset={6} radius={Neo.radius.lg} bg={Neo.mint}>
          <View style={styles.iconWrap}>
            <Ionicons name="checkmark-circle" size={56} color={Neo.ink} />
          </View>
        </NeoSurface>
        <NeoText variant="title" style={styles.title}>
          Saved to your vault
        </NeoText>
        <NeoText variant="subtitle" style={styles.subtitle}>
          It was encrypted on your phone and pinned to IPFS. Only you can open it.
        </NeoText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, paddingHorizontal: Spacing.three },
  iconWrap: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center' },
});
