import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';

import { NeoSurface, NeoText, Screen } from '@/components/neo';
import { useApp } from '@/context/app-context';
import { Neo, Spacing } from '@/constants/theme';

function showPermissionAlert(what: string) {
  Alert.alert(`${what} access needed`, `Please allow ${what.toLowerCase()} access in Settings to continue.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Open Settings', onPress: () => Linking.openSettings() },
  ]);
}

export default function UploadSourceScreen() {
  const { setUploadDraft, setAutoLockSuspended } = useApp();

  const withPicker = async <T,>(fn: () => Promise<T>) => {
    setAutoLockSuspended(true);
    try {
      return await fn();
    } finally {
      setAutoLockSuspended(false);
    }
  };

  const handleCamera = async () => {
    const perm = await withPicker(() => ImagePicker.requestCameraPermissionsAsync());
    if (!perm.granted) return showPermissionAlert('Camera');
    const result = await withPicker(() => ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 }));
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploadDraft({
      uri: asset.uri,
      fileKind: 'image',
      mimeType: asset.mimeType ?? 'image/jpeg',
      fileName: asset.fileName ?? undefined,
    });
    router.push('/upload/details');
  };

  const handleGallery = async () => {
    const perm = await withPicker(() => ImagePicker.requestMediaLibraryPermissionsAsync());
    if (!perm.granted) return showPermissionAlert('Photo library');
    const result = await withPicker(() => ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 }));
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploadDraft({
      uri: asset.uri,
      fileKind: 'image',
      mimeType: asset.mimeType ?? 'image/jpeg',
      fileName: asset.fileName ?? undefined,
    });
    router.push('/upload/details');
  };

  const handlePdf = async () => {
    const result = await withPicker(() => DocumentPicker.getDocumentAsync({ type: 'application/pdf' }));
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploadDraft({ uri: asset.uri, fileKind: 'pdf', mimeType: asset.mimeType ?? 'application/pdf', fileName: asset.name });
    router.push('/upload/details');
  };

  return (
    <Screen showBack onBack={() => router.back()} title="Add a Document" subtitle="Choose how you'd like to add it to your vault.">
      <SourceOption
        icon="camera"
        label="Take a Photo"
        desc="Use your camera to capture a document"
        bg={Neo.blue}
        onPress={handleCamera}
      />
      <SourceOption
        icon="images"
        label="Choose from Gallery"
        desc="Pick an existing photo or scan"
        bg={Neo.mint}
        onPress={handleGallery}
      />
      <SourceOption
        icon="document-text"
        label="Choose a PDF File"
        desc="Attach a PDF from your device"
        bg={Neo.yellow}
        onPress={handlePdf}
      />
    </Screen>
  );
}

function SourceOption({
  icon,
  label,
  desc,
  bg,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  desc: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <NeoSurface offset={5} radius={Neo.radius.md} bg={Neo.surface}>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: bg }]}>
            <Ionicons name={icon} size={26} color={Neo.ink} />
          </View>
          <View style={styles.textWrap}>
            <NeoText variant="bodyBold">{label}</NeoText>
            <NeoText variant="small">{desc}</NeoText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Neo.muted} />
        </View>
      </NeoSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.four },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: Neo.radius.md,
    borderWidth: Neo.borderWidth,
    borderColor: Neo.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1, gap: 2 },
});
