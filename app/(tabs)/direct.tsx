import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { PlaceAutocomplete } from '@/components/PlaceAutocomplete';
import { Card, Header, PrimaryButton, Screen, SectionTitle } from '@/components/ui';
import { colors } from '@/constants/theme';
import { demoDirectRestaurant, modeLabels } from '@/data/demo';
import { calculateRestaurantCommute } from '@/services/meetpoint-api';
import { useMeetPoint } from '@/state/MeetPointContext';
import type { DirectResponse, Place, TravelMode } from '@/types/meetpoint';

const demoMinutes: Record<TravelMode, number> = { transit: 42, driving: 31, walking: 126, bicycling: 48, electrobike: 36 };

export default function DirectScreen() {
  const state = useMeetPoint();
  const [query, setQuery] = useState('');
  const [restaurant, setRestaurant] = useState<Place>();
  const [result, setResult] = useState<DirectResponse | undefined>(state.directResult);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState('');

  const calculate = async () => {
    const target = restaurant || { ...demoDirectRestaurant, name: query || demoDirectRestaurant.name };
    setLoading(true); setSource('');
    try {
      const data = await calculateRestaurantCommute({ city: state.city, date: state.date, arrivalTime: state.arrivalTime, participants: state.participants, restaurant: target });
      setResult(data); state.setDirectResult(data); setSource('高德路线数据');
    } catch {
      const people = state.participants.map((person, pIndex) => ({ name: person.name, routes: (Object.keys(demoMinutes) as TravelMode[]).map((mode, i) => ({ mode, status: 'ok' as const, displayMinutes: demoMinutes[mode] + pIndex * 4 + i % 2, limitMinutes: person.modes.find((x) => x.mode === mode)?.limitMinutes ?? null })) }));
      const data: DirectResponse = { resultType: 'direct', restaurant: { ...demoDirectRestaurant, name: target.name }, participantResults: people };
      setResult(data); state.setDirectResult(data); setSource('演示数据 · 启动本地服务后可实算');
    } finally { setLoading(false); }
  };

  return (
    <Screen>
      <Header badge="指定测算" />
      <Card style={styles.searchCard}>
        <SectionTitle title="指定一家餐厅" subtitle="为每位成员同时计算 5 种交通方式" />
        <PlaceAutocomplete city={state.city} kind="restaurant-or-address" value={query} placeholder="输入餐厅名称或地址" onChangeText={(text) => { setQuery(text); setRestaurant(undefined); }} onSelect={(place) => { setRestaurant(place); setQuery(place.name); }} />
        <PrimaryButton label={loading ? '正在计算 5 种路线…' : '开始全员通勤测算'} icon="arrow.triangle.branch" onPress={calculate} disabled={loading || !query.trim()} />
        {loading ? <ActivityIndicator color={colors.brand} /> : null}
      </Card>

      {result ? <>
        <View style={styles.hero}><View style={styles.heroIcon}><AppIcon name="checkmark.seal.fill" size={24} color="#FFFFFF" /></View><View style={{ flex: 1 }}><Text style={styles.heroOverline}>单店验证完成</Text><Text style={styles.heroTitle}>{result.restaurant.name}</Text><Text style={styles.heroMeta}>{[result.restaurant.district, result.restaurant.address].filter(Boolean).join(' · ')}</Text></View></View>
        <SectionTitle title="各成员到达耗时" subtitle={source} />
        {result.participantResults.map((person, index) => <Card key={person.name}>
          <View style={styles.personHead}><Text style={styles.personLetter}>{String.fromCharCode(65 + index)}</Text><Text style={styles.personName}>{person.name}</Text></View>
          <View style={styles.routeGrid}>{person.routes.map((route) => <View key={route.mode} style={[styles.route, route.qualifies === false && styles.routeBad]}><Text style={styles.routeMode}>{modeLabels[route.mode]}</Text><Text style={styles.routeTime}>{route.status === 'ok' ? `${route.displayMinutes} 分` : '无法计算'}</Text><Text style={styles.routeNote}>{route.limitMinutes ? (route.qualifies === false ? `超过 ${route.limitMinutes} 分上限` : `${route.limitMinutes} 分上限`) : '未设置上限'}</Text></View>)}</View>
        </Card>)}
      </> : <Card style={styles.empty}><AppIcon name="map" size={31} color={colors.brand} /><Text style={styles.emptyTitle}>先选择餐厅</Text><Text style={styles.emptyBody}>结果会按成员名称展示每个人的 5 种通勤时间。</Text></Card>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchCard: { gap: 13 }, hero: { borderRadius: 23, backgroundColor: colors.brand, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 }, heroIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.18)', alignItems: 'center', justifyContent: 'center' }, heroOverline: { color: '#FFE5D6', fontSize: 10, fontWeight: '700' }, heroTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 3 }, heroMeta: { color: '#FFE5D6', fontSize: 10, marginTop: 4 },
  personHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 11 }, personLetter: { width: 30, height: 30, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.brandSoft, color: colors.brand, fontWeight: '900', fontSize: 12, textAlign: 'center', textAlignVertical: 'center' }, personName: { color: colors.text, fontSize: 14, fontWeight: '800' }, routeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, route: { width: '48.5%', borderRadius: 13, padding: 10, backgroundColor: '#F4F7F6' }, routeBad: { backgroundColor: colors.dangerSoft }, routeMode: { color: colors.muted, fontSize: 10 }, routeTime: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 3 }, routeNote: { color: colors.faint, fontSize: 9, marginTop: 3 },
  empty: { alignItems: 'center', paddingVertical: 35 }, emptyTitle: { color: colors.text, fontWeight: '800', fontSize: 15, marginTop: 10 }, emptyBody: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'center', maxWidth: 270, marginTop: 5 },
});
