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
      <View style={styles.header}><Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/choose')} style={styles.circle}><AppIcon name="chevron.left" size={17} color={colors.text} /></Pressable><View style={{ flex: 1 }}><Text style={styles.title}>{relaxed ? '最少超时方案' : '符合要求的餐厅'}</Text><Text style={styles.subtitle}>{state.city} · {state.participants.length} 人聚会 · 约定 {state.arrivalTime} 到达</Text></View><Pressable style={styles.circle}><AppIcon name="square.and.arrow.up" size={17} color={colors.text} /></Pressable><Pressable style={styles.circle}><AppIcon name="sliders" size={17} color={colors.text} /></Pressable></View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={[styles.diagnosis, relaxed && styles.diagnosisRelaxed]}>
          <View style={styles.diagnosisIcon}>{relaxed ? <AppIcon name="exclamationmark.triangle.fill" size={20} color={colors.brand} /> : <SuccessMark />}</View>
          <View style={{ flex: 1 }}>{relaxed ? <Text style={styles.diagEyebrow}>暂无完全符合的餐厅</Text> : null}<Text style={styles.diagTitle}>{relaxed ? '以下是最少超时方案' : `找到 ${results.length} 家大家均可接受的餐厅`}</Text>{relaxed ? <Text style={styles.diagBody}>超时情况会在每家餐厅中明确标出</Text> : null}</View>
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
function SuccessMark() { return <View style={styles.checkMark}><View style={styles.checkStem} /><View style={styles.checkArm} /></View>; }
function RestaurantCard({ item, rank, relaxed }: { item: RestaurantResult; rank: number; relaxed: boolean }) {
  const [added, setAdded] = useState(false);
  return <Card style={styles.restaurant}>
    <View style={styles.restHead}><View style={styles.rank}><Text style={styles.rankText}>{rank}</Text></View><View style={{ flex: 1 }}><Text style={styles.restName}>{item.name}</Text><Text style={styles.foodMeta}>★ {item.rating || '待定'}　·　{item.type || item.tag || '餐厅'}　·　{item.cost ? `¥${item.cost}/人` : '价格待确认'}</Text></View></View>
    <View style={styles.addressRow}><AppIcon name="mappin.and.ellipse" size={14} color="#5C403D" /><Text numberOfLines={1} style={styles.restMeta}>{[item.district, item.address].filter(Boolean).join(' · ')}</Text></View>
    {relaxed && item.maxOverrunSeconds ? <Text style={styles.overrun}>最大超时约 {Math.ceil(item.maxOverrunSeconds / 60)} 分钟</Text> : null}
    <View style={styles.people}>{item.participantResults.map((person) => { const route = person.routes.find((r) => r.qualifies) || person.routes[0]; const bad = route?.qualifies === false; return <View key={person.name} style={[styles.person, bad && styles.personBad]}><Text numberOfLines={1} style={styles.personName}>{person.name}</Text><Text style={[styles.personTime, bad && { color: colors.danger }]}>{route?.displayMinutes ?? '—'} 分</Text><Text style={styles.personMode}>{route ? modeLabels[route.mode] : '无法计算'}</Text></View>; })}</View>
    <View style={styles.actions}><View style={{ flex: 1 }}><PrimaryButton label="查看餐厅与导航路线" icon="scope" /></View><Pressable accessibilityRole="button" accessibilityLabel={added ? `取消候选${item.name}` : `设为候选${item.name}`} accessibilityState={{ selected: added }} onPress={() => setAdded((current) => !current)} style={[styles.addRestaurant, added && styles.addRestaurantSelected]}><AppIcon name={added ? 'checkmark.seal.fill' : 'plus'} size={15} color={added ? '#fff' : colors.text} /><Text style={[styles.addRestaurantText, added && styles.addRestaurantTextSelected]}>{added ? '已选' : '候选'}</Text></Pressable></View>
  </Card>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, header: { minHeight: 62, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }, circle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.subtle, alignItems: 'center', justifyContent: 'center' }, title: { color: colors.text, fontSize: 16, fontWeight: '900' }, subtitle: { color: colors.text, fontSize: 9, marginTop: 2, fontWeight: '600' },
  scroll: { flex: 1 }, body: { padding: 16, paddingBottom: 28, gap: 12 }, diagnosis: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 }, diagnosisRelaxed: { backgroundColor: colors.brandSoft }, diagnosisIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' }, checkMark: { width: 24, height: 24, position: 'relative' }, checkStem: { position: 'absolute', left: 5, top: 12, width: 4, height: 10, borderRadius: 2, backgroundColor: colors.brand, transform: [{ rotate: '-45deg' }] }, checkArm: { position: 'absolute', left: 14, top: 4, width: 4, height: 19, borderRadius: 2, backgroundColor: colors.brand, transform: [{ rotate: '45deg' }] }, diagEyebrow: { color: colors.brand, fontSize: 9, fontWeight: '700' }, diagTitle: { color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: '900', marginTop: 2 }, diagBody: { color: colors.muted, fontSize: 10, marginTop: 3 },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 6 }, sortLabel: { color: colors.muted, fontSize: 10 },
  restaurant: { gap: 11 }, restHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 }, rank: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.brand, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, rankText: { color: '#fff', textAlign: 'center', fontWeight: '900', fontSize: 11, lineHeight: 14 }, restName: { color: colors.text, fontSize: 14, fontWeight: '900' }, foodMeta: { color: '#5C403D', fontSize: 9, marginTop: 5, fontWeight: '700' }, addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6 }, restMeta: { flex: 1, color: colors.muted, fontSize: 9 }, overrun: { color: colors.danger, backgroundColor: colors.dangerSoft, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 9, overflow: 'hidden', fontSize: 10, fontWeight: '700' },
  people: { flexDirection: 'row', gap: 7, backgroundColor: colors.background, borderRadius: 12, padding: 10 }, person: { flex: 1, minWidth: 94, backgroundColor: '#fff', borderRadius: 10, padding: 8, alignItems: 'center' }, personBad: { backgroundColor: colors.dangerSoft }, personName: { color: colors.blue, fontSize: 11, fontWeight: '800', maxWidth: '100%' }, personTime: { color: colors.text, fontSize: 14, fontWeight: '900', marginTop: 4 }, personMode: { color: colors.faint, fontSize: 8, marginTop: 2 }, actions: { flexDirection: 'row', gap: 8 }, addRestaurant: { width: 67, borderRadius: 25, backgroundColor: colors.subtle, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 }, addRestaurantSelected: { backgroundColor: colors.brand }, addRestaurantText: { color: colors.text, fontSize: 10, fontWeight: '800' }, addRestaurantTextSelected: { color: '#fff' },
});
