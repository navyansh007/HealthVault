import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

import { NeoButton, NeoSurface, NeoText, Screen } from '@/components/neo';
import { useApp } from '@/context/app-context';
import { Neo, Spacing } from '@/constants/theme';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/category-meta';
import { formatDate, formatDateTime } from '@/lib/format';
import { CATEGORY_LABELS } from '@/lib/types';

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { documents, removeDocument, openDocumentFile } = useApp();
  const doc = documents.find((d) => d.id === id);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!doc || doc.fileKind !== 'image') return;
    let cancelled = false;
    openDocumentFile(doc)
      .then((uri) => !cancelled && setLocalUri(uri))
      .catch((e) => !cancelled && setLoadError(e instanceof Error ? e.message : 'Could not load this document'));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc?.id]);

  if (!doc) {
    return (
      <Screen showBack title="Document not found">
        <NeoText variant="body">This document may have been removed.</NeoText>
      </Screen>
    );
  }

  const handleDelete = () => {
    Alert.alert('Delete this document?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await removeDocument(doc.id);
            router.back();
          } catch (e) {
            setDeleting(false);
            Alert.alert('Could not delete', e instanceof Error ? e.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  const handleOpen = async () => {
    setOpening(true);
    try {
      const uri = localUri ?? (await openDocumentFile(doc));
      setLocalUri(uri);
      if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device');
      await Sharing.shareAsync(uri, {
        mimeType: doc.mimeType,
        UTI: doc.fileKind === 'pdf' ? 'com.adobe.pdf' : 'public.image',
        dialogTitle: doc.title,
      });
    } catch (e) {
      Alert.alert('Could not open document', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setOpening(false);
    }
  };

  return (
    <Screen showBack title={doc.title} subtitle={CATEGORY_LABELS[doc.category]}>
      <NeoSurface offset={5} radius={Neo.radius.md} bg={Neo.surface}>
        {doc.fileKind === 'image' && localUri ? (
          <Image source={{ uri: localUri }} style={styles.preview} contentFit="cover" />
        ) : doc.fileKind === 'image' ? (
          <View style={[styles.placeholder, { backgroundColor: CATEGORY_COLORS[doc.category] }]}>
            {loadError ? (
              <>
                <Ionicons name="cloud-offline" size={40} color={Neo.ink} />
                <NeoText variant="small" style={styles.placeholderText}>
                  {loadError}
                </NeoText>
              </>
            ) : (
              <>
                <ActivityIndicator color={Neo.ink} />
                <NeoText variant="small" style={styles.placeholderText}>
                  Fetching from IPFS and decrypting…
                </NeoText>
              </>
            )}
          </View>
        ) : (
          <View style={[styles.placeholder, { backgroundColor: CATEGORY_COLORS[doc.category] }]}>
            <Ionicons name="document-text" size={48} color={Neo.ink} />
            <NeoText variant="bodyBold" style={styles.placeholderText}>
              PDF Document
            </NeoText>
          </View>
        )}
      </NeoSurface>

      <NeoSurface offset={4} radius={Neo.radius.md} bg={Neo.surface}>
        <View style={styles.card}>
          <Detail label="Category" value={CATEGORY_LABELS[doc.category]} icon={CATEGORY_ICONS[doc.category]} />
          <Detail label="Document Date" value={formatDate(doc.date)} icon="calendar" />
          {doc.facility ? <Detail label="Facility / Doctor" value={doc.facility} icon="business" /> : null}
          <Detail label="Added to vault" value={formatDateTime(doc.addedAt)} icon="time" />
          <Detail label="IPFS CID (encrypted)" value={doc.cid} icon="globe" mono last />
        </View>
      </NeoSurface>

      {doc.notes ? (
        <NeoSurface offset={4} radius={Neo.radius.md} bg={Neo.mutedSurface}>
          <View style={styles.notes}>
            <NeoText variant="label">Notes</NeoText>
            <NeoText variant="body">{doc.notes}</NeoText>
          </View>
        </NeoSurface>
      ) : null}

      <View style={styles.actions}>
        <NeoButton
          label={doc.fileKind === 'pdf' ? 'Open / Share' : 'Share'}
          variant="secondary"
          onPress={handleOpen}
          loading={opening}
          icon={<Ionicons name="share-outline" size={16} color={Neo.ink} />}
          style={styles.actionButton}
        />
        <NeoButton
          label="Delete"
          variant="danger"
          onPress={handleDelete}
          loading={deleting}
          icon={<Ionicons name="trash-outline" size={16} color="#FFFFFF" />}
          style={styles.actionButton}
        />
      </View>
    </Screen>
  );
}

function Detail({
  label,
  value,
  icon,
  last,
  mono,
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  last?: boolean;
  mono?: boolean;
}) {
  return (
    <View style={[styles.detailRow, !last && styles.detailBorder]}>
      <Ionicons name={icon} size={16} color={Neo.ink} />
      <View style={styles.detailBody}>
        <NeoText variant="small">{label}</NeoText>
        <NeoText variant={mono ? 'mono' : 'bodyBold'} selectable={mono}>
          {value}
        </NeoText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { width: '100%', height: 260, borderRadius: Neo.radius.md - Neo.borderWidth },
  placeholder: { height: 200, alignItems: 'center', justifyContent: 'center', gap: Spacing.one, padding: Spacing.three },
  placeholderText: { textAlign: 'center' },
  card: { padding: Spacing.three },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two, paddingVertical: Spacing.two },
  detailBorder: { borderBottomWidth: 2, borderBottomColor: Neo.mutedSurface },
  detailBody: { flex: 1, gap: 2 },
  notes: { padding: Spacing.three, gap: 4 },
  actions: { flexDirection: 'row', gap: Spacing.two },
  actionButton: { flex: 1 },
});
