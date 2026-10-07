import { Ionicons } from '@expo/vector-icons';
import { Alert, StyleSheet, View } from 'react-native';

import { NeoButton, NeoSurface, NeoText, Screen } from '@/components/neo';
import { useApp } from '@/context/app-context';
import { Neo, Spacing } from '@/constants/theme';
import { formatDate, formatDateTime, initials, maskPhone } from '@/lib/format';

export default function ProfileScreen() {
  const { profile, session, documents, consentGivenAt, signOut, lockNow, syncing, syncError } = useApp();

  if (!profile) {
    return (
      <Screen title="Profile" subtitle={syncing ? 'Loading your encrypted profile…' : (syncError ?? 'No profile found.')}>
        <NeoButton label="Sign Out" variant="danger" onPress={() => signOut()} />
      </Screen>
    );
  }

  const imageDocs = documents.filter((d) => d.fileKind === 'image').length;
  const pdfDocs = documents.filter((d) => d.fileKind === 'pdf').length;

  return (
    <Screen>
      <View style={styles.hero}>
        <NeoSurface offset={5} radius={Neo.radius.pill} bg={Neo.yellow}>
          <View style={styles.avatar}>
            <NeoText variant="title">{initials(profile.name)}</NeoText>
          </View>
        </NeoSurface>
        <NeoText variant="title" style={styles.name}>
          {profile.name}
        </NeoText>
      </View>

      <View style={styles.statsRow}>
        <NeoSurface offset={4} radius={Neo.radius.md} bg={Neo.mint} style={styles.statCard}>
          <View style={styles.statInner}>
            <NeoText variant="display" style={styles.statNumber}>
              {imageDocs}
            </NeoText>
            <NeoText variant="label">Photos & Scans</NeoText>
          </View>
        </NeoSurface>
        <NeoSurface offset={4} radius={Neo.radius.md} bg={Neo.blue} style={styles.statCard}>
          <View style={styles.statInner}>
            <NeoText variant="display" style={styles.statNumber}>
              {pdfDocs}
            </NeoText>
            <NeoText variant="label">PDFs</NeoText>
          </View>
        </NeoSurface>
      </View>

      <Section title="Personal Details">
        <Row label="Date of Birth" value={formatDate(profile.dob)} />
        <Row label="Gender" value={profile.gender} />
        <Row label="Blood Group" value={profile.bloodGroup} />
        <Row label="Mobile Number" value={maskPhone(profile.phone)} />
        <Row label="Address" value={profile.address || '—'} last />
      </Section>

      <Section title="Account">
        <Row label="Email" value={session?.email ?? '—'} />
        <Row label="Encryption" value="End-to-end" icon="key" />
        <Row label="Storage" value="IPFS (encrypted)" icon="globe" last />
      </Section>

      <Section title="Security">
        <Row label="Vault PIN Lock" value="Enabled" icon="lock-closed" />
        <Row label="Auto-lock on background" value="Enabled" icon="eye-off" last />
        <NeoButton
          label="Lock Vault Now"
          variant="secondary"
          onPress={lockNow}
          icon={<Ionicons name="lock-closed-outline" size={16} color={Neo.ink} />}
          style={styles.sectionButton}
        />
      </Section>

      <Section title="Data & Privacy">
        <Row label="Consent given" value={consentGivenAt ? formatDateTime(consentGivenAt) : '—'} last />
        <NeoButton
          label="Sign Out"
          variant="danger"
          style={styles.sectionButton}
          onPress={() =>
            Alert.alert(
              'Sign out?',
              'Your documents stay in your encrypted vault. To open them on this device again you will need your password (or an email code) and your recovery key.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
              ],
            )
          }
        />
      </Section>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <NeoText variant="label" style={styles.sectionTitle}>
        {title}
      </NeoText>
      <NeoSurface offset={4} radius={Neo.radius.md} bg={Neo.surface}>
        <View style={styles.card}>{children}</View>
      </NeoSurface>
    </View>
  );
}

function Row({
  label,
  value,
  last,
  mono,
  icon,
}: {
  label: string;
  value: string;
  last?: boolean;
  mono?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <NeoText variant="small">{label}</NeoText>
      <View style={styles.rowValueWrap}>
        {icon ? <Ionicons name={icon} size={14} color={Neo.ink} /> : null}
        <NeoText variant={mono ? 'mono' : 'bodyBold'}>{value}</NeoText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.three },
  avatar: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  name: { textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: Spacing.three },
  statCard: { flex: 1 },
  statInner: { padding: Spacing.three, gap: 2 },
  statNumber: { fontSize: 32, lineHeight: 34 },
  section: { gap: Spacing.two, marginTop: Spacing.one },
  sectionTitle: { paddingHorizontal: Spacing.one },
  card: { padding: Spacing.three, gap: Spacing.one },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.two },
  rowBorder: { borderBottomWidth: 2, borderBottomColor: Neo.mutedSurface },
  rowValueWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionButton: { marginTop: Spacing.two, alignSelf: 'stretch' },
});
