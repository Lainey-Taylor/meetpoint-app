import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { AmapMap } from '@/components/AmapMap';
import { Card, Chip, PrimaryButton } from '@/components/ui';
import { colors } from '@/constants/theme';
import { modeLabels } from '@/data/demo';
import { useMeetPoint } from '@/state/MeetPointContext';
import type { RestaurantResult } from '@/types/meetpoint';

export default function ResultsScreen() {
  const state = useMeetPoint();
  const relaxed = state.recommendation.resultType === 'relaxed';
  const [sort, setSort] = useState<'rating' | 'time' | 'price'>(relaxed ? 'time' : 'rating');
  const results = useMemo(() => [...state.recommendation.results].sort((a, b) => sort === 'rating'
    ? (b.rating || 0) - (a.rating || 0)
    : sort === 'price'
      ? (a.cost ?? 99999) - (b.cost ?? 99999)
      : relaxed
        ? (a.maxOverrunSeconds ?? 999999) - (b.maxOverrunSeconds ?? 999999)
        : worst(a) - worst(b)), [relaxed, sort, state.recommendation.results]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}><Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/choose')} style={styles.circle}><AppIcon name="chevron.left" size={17} color={colors.text} /></Pressable><View style={{ flex: 1 }}><Text style={styles.title}>{relaxed ? '最少超时方案' : '符合要求的餐厅名单'}</Text><Text style={styles.subtitle}>{state.city} · {state.participants.length} 人 · {state.arrivalTime} 到达</Text></View><Pressable style={styles.circle}><AppIcon name="square.and.arrow.up" size={17} color={colors.text} /></Pressable></View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={[styles.diagnosis, relaxed && styles.diagnosisRelaxed]}>
          <AppIcon name={relaxed ? 'exclamationmark.triangle.fill' : 'checkmark.seal.fill'} size={27} color="#fff" />
          <View style={{ flex: 1 }}>{relaxed ? <Text style={styles.diagEyebrow}>暂无完全符合的餐厅</Text> : null}<Text style={styles.diagTitle}>{relaxed ? '以下是最少超时方案' : `找到 ${results.length} 家大家都能按时到达的餐厅`}</Text>{relaxed ? <Text style={styles.diagBody}>仅在没有严格合格餐厅时展示，超时情况会明确标出</Text> : null}</View>
        </View>
        <View style={styles.sortRow}><Text style={styles.sortLabel}>排序</Text>{relaxed ? <Chip label="超时最少" active={sort === 'time'} onPress={() => setSort('time')} /> : <><Chip label="评分优先" active={sort === 'rating'} onPress={() => setSort('rating')} /><Chip label="耗时最短" active={sort === 'time'} onPress={() => setSort('time')} /></>}<Chip label="人均低到高" active={sort === 'price'} onPress={() => setSort('price')} /></View>
        <AmapMap
          members={(state.recommendation.participants || []).map((person) => ({ label: person.name, location: person.location }))}
          restaurants={results.map((restaurant) => ({ label: restaurant.name, location: restaurant.location }))}
        />
        {results.map((restaurant, index) => <RestaurantCard key={restaurant.id || restaurant.name} item={restaurant} rank={index + 1} relaxed={relaxed} />)}
      </ScrollView>
    </SafeAreaView>
  );
}

function worst(item: RestaurantResult) { return Math.max(...item.participantResults.flatMap((p) => p.routes.filter((r) => r.status === 'ok').map((r) => r.displayMinutes || 999))); }
function RestaurantCard({ item, rank, relaxed }: { item: RestaurantResult; rank: number; relaxed: boolean }) {
  const [added, setAdded] = useState(false);
  return <Card style={styles.restaurant}>
    <View style={styles.restHead}><View style={styles.rank}><Text style={styles.rankText}>{rank}</Text></View><View style={{ flex: 1 }}><Text style={styles.restName}>{item.name}</Text><Text style={styles.restMeta}>{[item.district, item.address].filter(Boolean).join(' · ')}</Text></View><View><Text style={styles.rating}>★ {item.rating || '待定'}</Text><Text style={styles.cost}>{item.cost ? `¥${item.cost}/人` : '价格待确认'}</Text></View></View>
    {relaxed && item.maxOverrunSeconds ? <Text style={styles.overrun}>最大超时约 {Math.ceil(item.maxOverrunSeconds / 60)} 分钟</Text> : null}
    <View style={styles.people}>{item.participantResults.map((person) => { const route = person.routes.find((r) => r.qualifies) || person.routes[0]; const bad = route?.qualifies === false; return <View key={person.name} style={[styles.person, bad && styles.personBad]}><Text numberOfLines={1} style={styles.personName}>{person.name}</Text><Text style={[styles.personTime, bad && { color: colors.danger }]}>{route?.displayMinutes ?? '—'} 分</Text><Text style={styles.personMode}>{route ? modeLabels[route.mode] : '无法计算'}</Text></View>; })}</View>
    <View style={styles.actions}><View style={{ flex: 1 }}><PrimaryButton label="查看餐厅与路线" icon="map.fill" /></View><Pressable accessibilityRole="button" accessibilityLabel={added ? `取消添加${item.name}` : `添加${item.name}`} accessibilityState={{ selected: added }} onPress={() => setAdded((current) => !current)} style={[styles.addRestaurant, added && styles.addRestaurantSelected]}><AppIcon name={added ? 'checkmark.seal.fill' : 'plus'} size={15} color={added ? '#fff' : colors.brand} /><Text style={[styles.addRestaurantText, added && styles.addRestaurantTextSelected]}>{added ? '已加' : '添加'}</Text></Pressable></View>
  </Card>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, header: { minHeight: 58, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }, circle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.subtle, alignItems: 'center', justifyContent: 'center' }, title: { color: colors.text, fontSize: 16, fontWeight: '900' }, subtitle: { color: colors.muted, fontSize: 10, marginTop: 2 },
  scroll: { flex: 1 }, body: { padding: 16, paddingBottom: 28, gap: 12 }, diagnosis: { backgroundColor: colors.success, borderRadius: 21, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 11 }, diagnosisRelaxed: { backgroundColor: colors.brand }, diagEyebrow: { color: 'rgba(255,255,255,.75)', fontSize: 9, fontWeight: '700' }, diagTitle: { color: '#fff', fontSize: 15, lineHeight: 20, fontWeight: '900', marginTop: 2 }, diagBody: { color: 'rgba(255,255,255,.82)', fontSize: 10, marginTop: 3 },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 6 }, sortLabel: { color: colors.muted, fontSize: 10 },
  restaurant: { gap: 11 }, restHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 }, rank: { width: 29, height: 29, borderRadius: 10, backgroundColor: colors.brand, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, rankText: { color: '#fff', textAlign: 'center', fontWeight: '900', fontSize: 12, lineHeight: 15 }, restName: { color: colors.text, fontSize: 14, fontWeight: '900' }, restMeta: { color: colors.muted, fontSize: 10, marginTop: 4 }, rating: { color: colors.warning, fontSize: 11, fontWeight: '900', textAlign: 'right' }, cost: { color: colors.muted, fontSize: 9, textAlign: 'right', marginTop: 4 }, overrun: { color: colors.danger, backgroundColor: colors.dangerSoft, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 9, overflow: 'hidden', fontSize: 10, fontWeight: '700' },
  people: { flexDirection: 'row', gap: 7 }, person: { flex: 1, minWidth: 94, backgroundColor: '#F5F8F7', borderRadius: 12, padding: 8, alignItems: 'center' }, personBad: { backgroundColor: colors.dangerSoft }, personName: { color: colors.brand, fontSize: 11, fontWeight: '800', maxWidth: '100%' }, personTime: { color: colors.text, fontSize: 14, fontWeight: '900', marginTop: 4 }, personMode: { color: colors.faint, fontSize: 8, marginTop: 2 }, actions: { flexDirection: 'row', gap: 8 }, addRestaurant: { width: 58, borderRadius: 16, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center', gap: 2 }, addRestaurantSelected: { backgroundColor: colors.brand }, addRestaurantText: { color: colors.brand, fontSize: 9, fontWeight: '800' }, addRestaurantTextSelected: { color: '#fff' },
});
