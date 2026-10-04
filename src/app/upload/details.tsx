import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';

import { NeoButton, NeoInput, NeoSurface, NeoTag, NeoText, Screen } from '@/components/neo';
import { useApp } from '@/context/app-context';
import { Neo, Spacing } from '@/constants/theme';
import { CATEGORY_COLORS } from '@/lib/category-meta';
import { todayIso } from '@/lib/format';
import { CATEGORY_LABELS, CATEGORY_ORDER, DocumentCategory } from '@/lib/types';

export default function UploadDetailsScreen() {
  const { uploadDraft, addDocument, setUploadDraft } = useApp();

  const [title, setTitle] = useState(uploadDraft?.fileName?.replace(/\.[a-zA-Z0-9]+$/, '') ?? '');
  const [category, setCategory] = useState<DocumentCategory>('other');
  const [date, setDate] = useState(todayIso());
  const [facility, setFacility] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!uploadDraft) {
    return (
      <Screen showBack title="No file selected" subtitle="Go back and pick a document to continue.">
        <NeoButton label="Choose a document" onPress={() => router.replace('/upload')} />
      </Screen>
    );
  }

  const canSave = title.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date);

  const handleSave = async () => {
    setSaving(true);
    try {
      await addDocument(uploadDraft, {
        title: title.trim(),
        category,
        date,
        fileKind: uploadDraft.fileKind,
        mimeType: uploadDraft.mimeType,
        fileName: uploadDraft.fileName,
        facility: facility.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setUploadDraft(null);
      router.replace('/upload/success');
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      showBack
      title="Add Details"
      subtitle="A few details help you find this later."
      footer={<NeoButton
          label={saving ? 'Encrypting & Uploading…' : 'Save to Vault'}
          size="lg"
          fullWidth
          loading={saving}
          disabled={!canSave || saving}
          onPress={handleSave}
        />}>
      <NeoSurface offset={4} radius={Neo.radius.md} bg={Neo.surface}>
        {uploadDraft.fileKind === 'image' ? (
          <Image source={{ uri: uploadDraft.uri }} style={styles.preview} contentFit="cover" />
        ) : (
          <View style={styles.pdfPreview}>
            <Ionicons name="document-text" size={40} color={Neo.ink} />
            <NeoText variant="bodyBold" numberOfLines={1} style={styles.pdfName}>
              {uploadDraft.fileName ?? 'document.pdf'}
            </NeoText>
          </View>
        )}
      </NeoSurface>

      <NeoInput label="Title" placeholder="e.g. Blood Test Report" value={title} onChangeText={setTitle} autoFocus />

      <View style={styles.field}>
        <NeoText variant="label">Category</NeoText>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORY_ORDER}
          keyExtractor={(c) => c}
          contentContainerStyle={styles.chipRow}
          renderItem={({ item }) => (
            <NeoTag
              label={CATEGORY_LABELS[item]}
              bg={CATEGORY_COLORS[item]}
              selected={category === item}
              onPress={() => setCategory(item)}
            />
          )}
        />
      </View>

      <NeoInput
        label="Document Date"
        placeholder="YYYY-MM-DD"
        value={date}
        onChangeText={setDate}
        helper="The date on the document, not today's date"
      />

      <NeoInput
        label="Facility / Doctor (optional)"
        placeholder="e.g. Apollo Hospitals"
        value={facility}
        onChangeText={setFacility}
      />

      <NeoInput
        label="Notes (optional)"
        placeholder="Anything worth remembering about this document"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        style={styles.notesInput}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { width: '100%', height: 200, borderRadius: Neo.radius.md - Neo.borderWidth },
  pdfPreview: { height: 160, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, padding: Spacing.three },
  pdfName: { maxWidth: '90%' },
  field: { gap: Spacing.two },
  chipRow: { gap: Spacing.two, paddingVertical: 2 },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
});
