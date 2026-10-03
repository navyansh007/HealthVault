import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NeoInput, NeoSurface, NeoTag, NeoText } from '@/components/neo';
import { useApp } from '@/context/app-context';
import { MaxContentWidth, Neo, Spacing } from '@/constants/theme';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/category-meta';
import { formatDate, getGreeting } from '@/lib/format';
import { CATEGORY_LABELS, CATEGORY_ORDER, DocumentCategory, VaultDocument } from '@/lib/types';

export default function VaultScreen() {
  const { documents, profile, syncing, syncError, refreshVault } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<DocumentCategory | 'all'>('all');

  const filtered = useMemo(() => {
    return documents
      .filter((d) => category === 'all' || d.category === category)
      .filter((d) => {
        if (!query.trim()) return true;
        const q = query.trim().toLowerCase();
        return d.title.toLowerCase().includes(q) || (d.facility ?? '').toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [documents, category, query]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.inner}>
        <FlatList
          data={filtered}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={syncing} onRefresh={refreshVault} tintColor={Neo.ink} />}
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <View>
                  <NeoText variant="label">Hi{profile ? `, ${profile.name.split(' ')[0]}` : ''}</NeoText>
                  <NeoText variant="title">{getGreeting()}</NeoText>
                </View>
                <View style={styles.countBadge}>
                  <NeoText variant="bodyBold">{documents.length}</NeoText>
                </View>
              </View>

              {syncError ? (
                <NeoSurface offset={3} radius={Neo.radius.sm} bg={Neo.pink}>
                  <Pressable style={styles.syncError} onPress={refreshVault}>
                    <Ionicons name="cloud-offline" size={18} color={Neo.ink} />
                    <NeoText variant="smallBold" style={styles.syncErrorText}>
                      Couldn&apos;t sync your vault. Tap to retry.
                    </NeoText>
                  </Pressable>
                </NeoSurface>
              ) : null}

              <NeoInput
                placeholder="Search documents or facility..."
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
              />

              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={['all', ...CATEGORY_ORDER] as (DocumentCategory | 'all')[]}
                keyExtractor={(c) => c}
                contentContainerStyle={styles.chipRow}
                renderItem={({ item }) => (
                  <NeoTag
                    label={item === 'all' ? 'All' : CATEGORY_LABELS[item]}
                    selected={category === item}
                    bg={item === 'all' ? Neo.mutedSurface : CATEGORY_COLORS[item]}
                    onPress={() => setCategory(item)}
                  />
                )}
              />
            </View>
          }
          renderItem={({ item }) => <DocumentRow doc={item} />}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.three }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="folder-open" size={40} color={Neo.muted} />
              <NeoText variant="bodyBold" style={styles.emptyText}>
                {syncing && documents.length === 0
                  ? 'Decrypting your vault…'
                  : query || category !== 'all'
                    ? 'No documents match'
                    : 'Your vault is empty'}
              </NeoText>
              <NeoText variant="small" style={styles.emptyText}>
                {query || category !== 'all'
                  ? 'Try a different search or filter.'
                  : 'Tap the + button to add your first document.'}
              </NeoText>
            </View>
          }
        />

        <Pressable style={styles.fabWrap} onPress={() => router.push('/upload')} accessibilityLabel="Add document">
          <NeoSurface offset={5} radius={Neo.radius.pill} bg={Neo.primary} innerStyle={styles.fabInner}>
            <Ionicons name="add" size={30} color={Neo.primaryInk} />
          </NeoSurface>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function DocumentRow({ doc }: { doc: VaultDocument }) {
  return (
    <Pressable onPress={() => router.push(`/document/${doc.id}`)}>
      <NeoSurface offset={4} radius={Neo.radius.md} bg={Neo.surface}>
        <View style={styles.row}>
          <View style={[styles.rowIcon, { backgroundColor: CATEGORY_COLORS[doc.category] }]}>
            <Ionicons name={CATEGORY_ICONS[doc.category]} size={20} color={Neo.ink} />
          </View>
          <View style={styles.rowBody}>
            <NeoText variant="bodyBold" numberOfLines={1}>
              {doc.title}
            </NeoText>
            <NeoText variant="small" numberOfLines={1}>
              {CATEGORY_LABELS[doc.category]} · {formatDate(doc.date)}
              {doc.facility ? ` · ${doc.facility}` : ''}
            </NeoText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Neo.muted} />
        </View>
      </NeoSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Neo.bg },
  inner: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  listContent: { paddingHorizontal: Spacing.four, paddingBottom: 140, flexGrow: 1 },
  header: { gap: Spacing.three, paddingTop: Spacing.three, paddingBottom: Spacing.two },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  countBadge: {
    width: 40,
    height: 40,
    borderRadius: Neo.radius.pill,
    borderWidth: Neo.borderWidth,
    borderColor: Neo.ink,
    backgroundColor: Neo.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: { gap: Spacing.two, paddingVertical: Spacing.one },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: Neo.radius.sm,
    borderWidth: Neo.borderWidth,
    borderColor: Neo.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 2 },
  syncError: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two },
  syncErrorText: { flex: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', gap: Spacing.one, paddingTop: Spacing.six, paddingHorizontal: Spacing.four },
  emptyText: { textAlign: 'center' },
  fabWrap: { position: 'absolute', right: Spacing.four, bottom: Spacing.four },
  fabInner: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
});
