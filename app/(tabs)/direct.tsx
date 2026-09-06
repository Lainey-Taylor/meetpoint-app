import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { PlaceAutocomplete } from '@/components/PlaceAutocomplete';
import { PixelAvatar } from '@/components/PixelAvatar';
import { Card, PrimaryButton, Screen } from '@/components/ui';
import { colors } from '@/constants/theme';
import { demoDirectRestaurant, modeLabels } from '@/data/demo';
import { calculateRestaurantCommute } from '@/services/meetpoint-api';
import { useMeetPoint } from '@/state/MeetPointContext';
import type { DirectResponse, Place, TravelMode } from '@/types/meetpoint';

const demoMinutes: Record<TravelMode, number> = { transit: 42, driving: 31, walking: 126, bicycling: 48, electrobike: 36 };
const modeIcons: Record<TravelMode, string> = { transit: '🚇', driving: '🚕', bicycling: '🚲', electrobike: '🛵', walking: '🚶' };

export default function DirectScreen() {
  const state = useMeetPoint();
  const [query, setQuery] = useState('');
  const [restaurant, setRestaurant] = useState<Place>();
  const [result, setResult] = useState<DirectResponse | undefined>(state.directResult);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState('');

  const updatePerson = (id: string, patch: Partial<(typeof state.participants)[number]>) => state.setParticipants(state.participants.map((person) => person.id === id ? { ...person, ...patch } : person));
  const addParticipant = () => {
    if (state.participants.length >= 4) return;
    state.setParticipants([...state.participants, { id: `direct-${Date.now()}`, name: `成员${state.participants.length + 1}`, address: '', modes: [{ mode: 'transit', limitMinutes: 50 }] }]);
  };
  const removeParticipant = (id: string) => state.setParticipants(state.participants.filter((person) => person.id !== id));
  const toggleMode = (id: string, mode: TravelMode) => {
    const person = state.participants.find((item) => item.id === id);
    if (!person) return;
    const active = person.modes.some((item) => item.mode === mode);
    const next = active ? person.modes.filter((item) => item.mode !== mode) : [...person.modes, { mode, limitMinutes: mode === 'transit' ? 50 : 30 }];
    updatePerson(id, { modes: next });
  };
  const changeLimit = (id: string, mode: TravelMode, value: string) => updatePerson(id, { modes: state.participants.find((person) => person.id === id)?.modes.map((item) => item.mode === mode ? { ...item, limitMinutes: Number(value) || 1 } : item) || [] });

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

  return <Screen>
    <View style={styles.pageHead}><View><Text style={styles.title}>指定一家餐厅</Text><Text style={styles.subtitle}>输入目标餐厅，为每位成员同时测算 5 种交通耗时</Text></View></View>
    <Card style={styles.searchCard}><View style={styles.sectionHead}><View style={styles.dot} /><Text style={styles.sectionTitle}>目标餐厅</Text></View><PlaceAutocomplete leadingIcon="mappin.and.ellipse" city={state.city} kind="restaurant-or-address" value={query} placeholder="输入餐厅名称或地址" onChangeText={(text) => { setQuery(text); setRestaurant(undefined); }} onSelect={(place) => { setRestaurant(place); setQuery(place.name); }} /><Text style={styles.history}>历史搜索：　猁xMCC·精酿餐吧　　羲和雅苑烤鸭坊</Text></Card>
    <Card style={styles.membersCard}><View style={styles.sectionHead}><View style={[styles.dot, { backgroundColor: colors.secondary }]} /><Text style={styles.sectionTitle}>成员出发配置</Text><Pressable onPress={addParticipant} disabled={state.participants.length >= 4}><Text style={[styles.add, state.participants.length >= 4 && styles.disabledText]}>♙ 添加成员</Text></Pressable></View>{state.participants.map((person, index) => <View key={person.id} style={[styles.member, index > 0 && styles.memberGap]}><View style={styles.memberTop}><PixelAvatar size={36} variant={index} /><TextInput value={person.name} onChangeText={(name) => updatePerson(person.id, { name })} style={styles.memberNameInput} />{!person.owner ? <Pressable accessibilityRole="button" accessibilityLabel={`删除${person.name}`} onPress={() => removeParticipant(person.id)} hitSlop={9}><AppIcon name="xmark.circle.fill" size={20} color={colors.faint} /></Pressable> : null}</View><View style={styles.memberPlaceSearch}><PlaceAutocomplete leadingIcon="mappin.and.ellipse" city={state.city} value={person.address} placeholder="输入成员出发地" onChangeText={(address) => updatePerson(person.id, { address, selectedPlace: undefined })} onSelect={(place) => state.setParticipantPlace(person.id, place)} /></View><View style={styles.modeLimits}>{(['transit', 'driving', 'bicycling', 'electrobike', 'walking'] as TravelMode[]).map((mode) => { const active = person.modes.find((item) => item.mode === mode); return <View key={mode} style={[styles.modeLimit, !active && styles.modeDisabled]}><Pressable onPress={() => toggleMode(person.id, mode)} style={styles.modeToggle}><Text style={styles.modeEmoji}>{modeIcons[mode]}</Text><Text style={styles.modeLabel}>{modeLabels[mode]}</Text></Pressable>{active ? <View style={styles.limitRow}><TextInput value={String(active.limitMinutes)} onChangeText={(value) => changeLimit(person.id, mode, value)} keyboardType="number-pad" selectTextOnFocus style={styles.limitInput} /><Text style={styles.limitUnit}>分</Text></View> : <Text style={styles.modeValue}>点击开启</Text>}</View>; })}</View></View>)}<PrimaryButton label={loading ? '正在测算 5 种路线…' : '开始全员多交通测算'} icon="route" onPress={calculate} disabled={loading || !query.trim()} />{loading ? <ActivityIndicator color={colors.brand} /> : null}</Card>

    {result ? <Card><View style={styles.sectionHead}><View style={[styles.dot, { backgroundColor: colors.success }]} /><Text style={styles.sectionTitle}>全员 5 种交通测算结果</Text><Text style={styles.source}>{source}</Text></View><View style={styles.restaurant}><View><Text style={styles.restaurantName}>{result.restaurant.name}</Text><Text style={styles.restaurantAddress}>{[result.restaurant.district, result.restaurant.address].filter(Boolean).join(' · ')}</Text></View><Text style={styles.rating}>★ {result.restaurant.rating || '待定'}</Text></View>{result.participantResults.map((person, index) => <View key={person.name} style={styles.resultPerson}><View style={styles.resultName}><PixelAvatar size={36} variant={index} /><Text style={styles.memberName}>{person.name}的通勤耗时</Text></View><View style={styles.resultModes}>{person.routes.map((route) => <View key={route.mode} style={[styles.resultMode, route.qualifies && styles.qualifies]}><Text style={styles.resultModeLabel}>{modeLabels[route.mode]}</Text><Text style={[styles.resultTime, route.qualifies && { color: colors.success }]}>{route.status === 'ok' ? `${route.displayMinutes}分` : '—'}</Text></View>)}</View></View>)}</Card> : null}
  </Screen>;
}

const styles = StyleSheet.create({
  pageHead: { minHeight: 116, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { color: colors.text, fontSize: 30, lineHeight: 36, fontWeight: '900', letterSpacing: -1 }, subtitle: { color: colors.muted, fontSize: 12, marginTop: 6 },
  searchCard: { gap: 15 }, sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 9 }, dot: { width: 13, height: 13, borderRadius: 7, backgroundColor: colors.brand }, sectionTitle: { flex: 1, color: colors.text, fontSize: 17, fontWeight: '900' }, history: { color: colors.faint, fontSize: 10, lineHeight: 17 }, add: { color: colors.brand, fontSize: 10, fontWeight: '800' },
  membersCard: { gap: 14 }, member: { backgroundColor: colors.background, borderRadius: 15, padding: 13, zIndex: 4 }, memberGap: { marginTop: 0 }, memberTop: { flexDirection: 'row', alignItems: 'center', gap: 10 }, memberName: { color: colors.text, fontSize: 13, fontWeight: '900' }, memberNameInput: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '900', padding: 0 }, memberPlaceSearch: { marginTop: 10, zIndex: 5 }, modeLimits: { flexDirection: 'row', marginTop: 13, gap: 5 }, modeLimit: { flex: 1, minWidth: 0, minHeight: 82, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', padding: 4 }, modeDisabled: { opacity: .72 }, modeToggle: { width: '100%', alignItems: 'center' }, modeEmoji: { fontSize: 18, lineHeight: 22 }, modeLabel: { color: colors.muted, fontSize: 8, marginTop: 3, textAlign: 'center' }, modeValue: { color: colors.brand, fontSize: 8, fontWeight: '800', marginTop: 5 }, limitRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 }, limitInput: { width: 28, padding: 0, color: colors.brand, fontSize: 11, fontWeight: '900', textAlign: 'right' }, limitUnit: { color: colors.brand, fontSize: 9, marginLeft: 1 }, disabledText: { opacity: .38 },
  source: { color: colors.faint, fontSize: 8 }, restaurant: { backgroundColor: colors.background, borderRadius: 13, padding: 13, marginTop: 14, flexDirection: 'row', justifyContent: 'space-between' }, restaurantName: { color: colors.text, fontSize: 13, fontWeight: '900' }, restaurantAddress: { color: colors.muted, fontSize: 9, marginTop: 4, maxWidth: 250 }, rating: { color: colors.brandBright, fontSize: 15, fontWeight: '900' }, resultPerson: { borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 13, marginTop: 12 }, resultName: { flexDirection: 'row', alignItems: 'center', gap: 9 }, resultModes: { flexDirection: 'row', gap: 5, marginTop: 11 }, resultMode: { flex: 1, minWidth: 0, backgroundColor: colors.subtle, borderRadius: 10, paddingVertical: 9, alignItems: 'center' }, qualifies: { backgroundColor: colors.successSoft, borderWidth: 1, borderColor: '#B9EEDB' }, resultModeLabel: { color: colors.muted, fontSize: 8 }, resultTime: { color: colors.text, fontSize: 12, fontWeight: '900', marginTop: 4 },
});
