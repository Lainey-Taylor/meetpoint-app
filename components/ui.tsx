import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, shadows } from '@/constants/theme';
import { AppIcon } from '@/components/AppIcon';

export function Screen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Header({ badge = 'MeetPoint', action }: { badge?: string; action?: ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <View style={styles.logo}><AppIcon name="fork.knife" size={15} color="#FDBA74" /></View>
        <View style={styles.brandTextRow}>
          <Text style={styles.brand}>聚点聚餐</Text>
          <Text style={styles.badge}>{badge}</Text>
        </View>
      </View>
      {action}
    </View>
  );
}

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function Chip({ label, active, tone = 'brand', onPress }: { label: string; active?: boolean; tone?: 'brand' | 'danger'; onPress?: () => void }) {
  const activeBackground = tone === 'danger' ? colors.dangerSoft : colors.brand;
  const activeText = tone === 'danger' ? colors.danger : '#FFFFFF';
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, active && { backgroundColor: activeBackground, borderColor: activeBackground }, pressed && { opacity: .72 }]}>
      <Text style={[styles.chipText, active && { color: activeText, fontWeight: '700' }]}>{label}</Text>
    </Pressable>
  );
}

export function PrimaryButton({ label, icon = 'arrow.right', onPress, disabled }: { label: string; icon?: string; onPress?: () => void; disabled?: boolean }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primary, disabled && { opacity: .55 }, pressed && { transform: [{ scale: .99 }] }]}>
      <AppIcon name={icon} color="#FFFFFF" size={17} />
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return <Card style={styles.empty}><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyBody}>{body}</Text></Card>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32, gap: 14 },
  header: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#172033', alignItems: 'center', justifyContent: 'center' },
  brandTextRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  brand: { fontSize: 17, color: colors.text, fontWeight: '800', letterSpacing: -.3 },
  badge: { fontSize: 10, color: '#9A421D', backgroundColor: '#FFEDD5', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5, overflow: 'hidden', fontWeight: '600' },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 15, ...shadows.card },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -.25 },
  sectionSubtitle: { color: colors.muted, fontSize: 12, marginTop: 2 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.subtle, borderWidth: 1, borderColor: colors.subtle },
  chipText: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  primary: { minHeight: 50, borderRadius: 17, backgroundColor: colors.brand, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#6C2E16', shadowOpacity: .16, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  empty: { alignItems: 'center', paddingVertical: 26 },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  emptyBody: { color: colors.muted, fontSize: 12, marginTop: 5, textAlign: 'center' },
});

