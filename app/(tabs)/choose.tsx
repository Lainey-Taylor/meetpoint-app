import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmapMap } from '@/components/AmapMap';
import { AppIcon } from '@/components/AppIcon';
import { CustomDatePicker } from '@/components/CustomDatePicker';
import { PlaceAutocomplete } from '@/components/PlaceAutocomplete';
import { PixelAvatar } from '@/components/PixelAvatar';
import { Card, Chip, PrimaryButton, SectionTitle } from '@/components/ui';
import { colors } from '@/constants/theme';
import { modeLabels } from '@/data/demo';
import { recommendRestaurants } from '@/services/meetpoint-api';
import { useMeetPoint } from '@/state/MeetPointContext';
import type { Participant, TravelMode } from '@/types/meetpoint';

const budgetOptions = [0, 100, 150, 200];
const cuisines = ['江浙菜', '川湘菜', '烤肉', '日料', '火锅'];
const exclusions = ['海鲜', '辛辣', '重油'];
const availableModes: TravelMode[] = ['transit', 'driving', 'walking', 'bicycling', 'electrobike'];
const cityOptions = ['北京', '上海', '广州', '深圳'];

function toLocalDate(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function ChooseScreen() {
  const state = useMeetPoint();
  const { height } = useWindowDimensions();
  const collapsedY = Math.max(170, Math.min(360, height * .42));
  const drawerY = useRef(new Animated.Value(collapsedY)).current;
  const drawerOffset = useRef(collapsedY);
  const dragStart = useRef(collapsedY);
  const [drawerScrollEnabled, setDrawerScrollEnabled] = useState(false);
  const [budget, setBudget] = useState(0);
  const [include, setInclude] = useState<string[]>([]);
  const [exclude, setExclude] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const dateOptions = [{ label: '今天', value: toLocalDate(0) }, { label: '明天', value: toLocalDate(1) }];
  const customDateActive = !dateOptions.some(({ value }) => value === state.date);

  const snapDrawer = (target: number) => {
    drawerOffset.current = target;
    setDrawerScrollEnabled(target === 0);
    Animated.spring(drawerY, { toValue: target, useNativeDriver: true, damping: 24, stiffness: 220, mass: .8 }).start();
  };
  const drawerPan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
    onPanResponderGrant: () => { dragStart.current = drawerOffset.current; },
    onPanResponderMove: (_, gesture) => drawerY.setValue(Math.max(0, Math.min(collapsedY, dragStart.current + gesture.dy))),
    onPanResponderRelease: (_, gesture) => {
      const current = Math.max(0, Math.min(collapsedY, dragStart.current + gesture.dy));
      snapDrawer(gesture.vy < -.35 || gesture.dy < -60 ? 0 : gesture.vy > .35 || gesture.dy > 60 ? collapsedY : current < collapsedY / 2 ? 0 : collapsedY);
    },
  }), [collapsedY, drawerY]);

  const updatePerson = (id: string, patch: Partial<Participant>) => state.setParticipants(state.participants.map((person) => person.id === id ? { ...person, ...patch } : person));
  const toggleMode = (person: Participant, mode: TravelMode) => {
    const exists = person.modes.some((item) => item.mode === mode);
    const modes = exists ? person.modes.filter((item) => item.mode !== mode) : [...person.modes, { mode, limitMinutes: mode === 'transit' ? 50 : 30 }];
    if (modes.length) updatePerson(person.id, { modes });
  };
  const changeLimit = (person: Participant, mode: TravelMode, value: string) => updatePerson(person.id, { modes: person.modes.map((item) => item.mode === mode ? { ...item, limitMinutes: Number(value) || 1 } : item) });
  const addPerson = () => state.participants.length < 4 && state.setParticipants([...state.participants, { id: `p-${Date.now()}`, name: `成员${state.participants.length + 1}`, address: '', modes: [{ mode: 'transit', limitMinutes: 50 }] }]);

  const calculate = async () => {
    setLoading(true); setNotice('');
    try {
      const result = await recommendRestaurants({ city: state.city, date: state.date, arrivalTime: state.arrivalTime, participants: state.participants, budget: budget || undefined, includeCuisines: include, excludeCuisines: exclude });
      state.setRecommendation(result); router.push('/results');
    } catch (error) {
      setNotice(`暂时无法生成真实餐厅：${error instanceof Error ? error.message : '请求失败'}`);
    } finally { setLoading(false); }
  };

  const mapMembers = (state.recommendation.participants || state.participants.map((person) => ({ name: person.name, location: person.selectedPlace?.location }))).map((person) => ({ label: person.name, location: person.location }));

  return <SafeAreaView style={styles.safe} edges={['top']}>
    <AmapMap allowEmpty members={mapMembers} restaurants={[]} style={styles.fullMap} />
    <View style={styles.mapHeader}><View><Text style={styles.mapEyebrow}>MEETPOINT</Text><Text style={styles.mapTitle}>聚餐选址</Text></View><View style={styles.mapStatus}><View style={styles.liveDot} /><Text style={styles.mapStatusText}>真实高德地图</Text></View></View>
    <Animated.View style={[styles.drawer, { height: Math.max(500, height - 88), transform: [{ translateY: drawerY }] }]}>
      <View {...drawerPan.panHandlers} style={styles.handleArea}><Pressable onPress={() => snapDrawer(drawerOffset.current === 0 ? collapsedY : 0)} hitSlop={10}><View style={styles.handle} /></Pressable></View>
      <ScrollView style={styles.drawerScroll} contentContainerStyle={styles.drawerContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" nestedScrollEnabled scrollEnabled={drawerScrollEnabled}>
        <SectionTitle title="聚餐配置" subtitle={drawerScrollEnabled ? '下滑收起配置栏' : '上滑展开并编辑全部条件'} />
        <Card style={styles.eventCard}><View style={styles.eventRow}><Text style={styles.eventLabel}>聚餐城市</Text><View style={styles.eventControl}>{cityOptions.map((city) => <Chip key={city} label={city} active={state.city === city} onPress={() => state.setCity(city)} />)}</View></View><View style={[styles.eventRow, styles.divider]}><Text style={styles.eventLabel}>聚餐日期</Text><View style={styles.eventControl}>{dateOptions.map(({ label, value }) => <Chip key={label} label={label} active={state.date === value} onPress={() => state.setDate(value)} />)}<CustomDatePicker value={state.date} active={customDateActive} onChange={state.setDate} /></View></View><View style={[styles.eventRow, styles.divider]}><Text style={styles.eventLabel}>期望到达</Text><View style={styles.timeControl}><TextInput value={state.arrivalTime} onChangeText={state.setArrivalTime} style={styles.timeInput} keyboardType="numbers-and-punctuation" /><AppIcon name="clock" size={16} color={colors.brand} /></View></View></Card>

        <SectionTitle title="成员出发配置" action={state.participants.length < 4 ? <Pressable onPress={addPerson}><Text style={styles.invite}>＋ 邀请成员（{state.participants.length}/4）</Text></Pressable> : null} />
        {state.participants.map((person, index) => <Card key={person.id} style={styles.personCard}><View style={styles.personHead}><View style={styles.personIdentity}><PixelAvatar size={34} variant={index} /><TextInput value={person.name} onChangeText={(name) => updatePerson(person.id, { name })} style={styles.personName} /></View>{!person.owner ? <Pressable onPress={() => state.setParticipants(state.participants.filter((item) => item.id !== person.id))}><AppIcon name="xmark.circle.fill" size={20} color={colors.faint} /></Pressable> : null}</View><PlaceAutocomplete leadingIcon="mappin.and.ellipse" city={state.city} value={person.address} placeholder="输入地址或地标" onChangeText={(address) => updatePerson(person.id, { address, selectedPlace: undefined })} onSelect={(place) => state.setParticipantPlace(person.id, place)} /><Text style={styles.fieldLabel}>可接受的交通方式与上限时间</Text><View style={styles.modeWrap}>{availableModes.map((mode) => { const active = person.modes.find((item) => item.mode === mode); return <View key={mode} style={[styles.mode, active && styles.modeActive]}><Pressable onPress={() => toggleMode(person, mode)}><Text style={[styles.modeText, active && styles.modeTextActive]}>{modeLabels[mode]}</Text></Pressable>{active ? <><TextInput value={String(active.limitMinutes)} onChangeText={(value) => changeLimit(person, mode, value)} keyboardType="number-pad" selectTextOnFocus style={styles.limit} /><Text style={styles.minutes}>分</Text></> : null}</View>; })}</View></Card>)}
        {state.participants.length < 4 ? <Pressable style={styles.addPerson} onPress={addPerson}><Text style={styles.addPersonText}>＋ 添加一位聚餐成员</Text></Pressable> : null}

        <SectionTitle title="餐厅筛选偏好" subtitle="通勤时间始终是首要条件" />
        <Card style={styles.filterCard}><Text style={styles.filterLabel}>人均预算上限</Text><View style={styles.chips}>{budgetOptions.map((amount) => <Chip key={amount} label={amount ? `¥${amount}内` : '不限'} active={budget === amount} onPress={() => setBudget(amount)} />)}</View><Text style={styles.filterLabel}>只看这些菜系（多选）</Text><View style={styles.chips}>{cuisines.map((item) => <Chip key={item} label={item} active={include.includes(item)} onPress={() => setInclude(include.includes(item) ? include.filter((value) => value !== item) : [...include, item])} />)}</View><Text style={styles.filterLabel}>绝对不能接受（多选）</Text><View style={styles.chips}>{exclusions.map((item) => <Chip key={item} label={`避开${item}`} tone="danger" active={exclude.includes(item)} onPress={() => setExclude(exclude.includes(item) ? exclude.filter((value) => value !== item) : [...exclude, item])} />)}</View></Card>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        <View style={styles.actions}><Pressable style={styles.directButton} onPress={() => router.push('/direct')}><Text style={styles.directText}>已有餐厅</Text></Pressable><View style={{ flex: 1 }}><PrimaryButton label={loading ? '正在计算…' : '推荐餐厅'} icon="location.magnifyingglass" onPress={calculate} disabled={loading} /></View></View>
        {loading ? <ActivityIndicator color={colors.brand} /> : null}
      </ScrollView>
    </Animated.View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#DDE8D9', overflow: 'hidden' }, fullMap: { position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: 0, borderWidth: 0 }, mapHeader: { position: 'absolute', top: 12, left: 16, right: 16, minHeight: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.92)', paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#20242C', shadowOpacity: .12, shadowRadius: 15, elevation: 5 }, mapEyebrow: { color: colors.brand, fontSize: 8, fontWeight: '900', letterSpacing: 1.4 }, mapTitle: { color: colors.text, fontSize: 20, fontWeight: '900', marginTop: 1 }, mapStatus: { flexDirection: 'row', alignItems: 'center', gap: 5 }, liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success }, mapStatusText: { color: colors.muted, fontSize: 9, fontWeight: '700' },
  drawer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, shadowColor: '#20242C', shadowOpacity: .18, shadowRadius: 24, shadowOffset: { width: 0, height: -7 }, elevation: 12, overflow: 'hidden' }, handleArea: { height: 35, alignItems: 'center', justifyContent: 'center' }, handle: { width: 46, height: 5, borderRadius: 3, backgroundColor: '#C9CBD1' }, drawerScroll: { flex: 1 }, drawerContent: { paddingHorizontal: 18, paddingBottom: 40, gap: 14 },
  eventCard: { paddingVertical: 4, backgroundColor: colors.background, shadowOpacity: 0, elevation: 0 }, eventRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12 }, divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }, eventLabel: { width: 64, color: colors.text, fontSize: 12, fontWeight: '800' }, eventControl: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: 8 }, timeControl: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 }, timeInput: { minWidth: 72, color: colors.text, fontWeight: '900', fontSize: 14, backgroundColor: colors.brandSoft, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 15, textAlign: 'center' },
  invite: { color: colors.brand, backgroundColor: colors.brandSoft, borderRadius: 14, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6, fontSize: 9, fontWeight: '800' }, personCard: { gap: 11, zIndex: 5, backgroundColor: colors.background, shadowOpacity: 0, elevation: 0, borderWidth: 1, borderColor: colors.line }, personHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, personIdentity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 }, personName: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '900', paddingVertical: 5 }, fieldLabel: { color: colors.muted, fontSize: 10, fontWeight: '700' }, modeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, mode: { minHeight: 40, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line }, modeActive: { backgroundColor: '#FFF7F7', borderColor: '#F2C9CD' }, modeText: { color: colors.muted, fontSize: 11, fontWeight: '600' }, modeTextActive: { color: colors.brand, fontWeight: '800' }, limit: { width: 30, padding: 0, marginLeft: 5, fontSize: 11, fontWeight: '900', color: colors.brand, textAlign: 'right' }, minutes: { color: colors.brand, fontSize: 10, marginLeft: 2 }, addPerson: { minHeight: 47, borderRadius: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: '#F0B9BF', backgroundColor: '#FFF9F9', alignItems: 'center', justifyContent: 'center' }, addPersonText: { color: colors.brand, fontSize: 12, fontWeight: '800' },
  filterCard: { backgroundColor: colors.background, shadowOpacity: 0, elevation: 0 }, filterLabel: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 11, marginBottom: 7 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, notice: { color: colors.warning, fontSize: 11, textAlign: 'center' }, actions: { flexDirection: 'row', alignItems: 'center', gap: 10 }, directButton: { height: 50, borderRadius: 25, backgroundColor: colors.subtle, paddingHorizontal: 18, justifyContent: 'center' }, directText: { color: colors.text, fontSize: 12, fontWeight: '900' },
});
