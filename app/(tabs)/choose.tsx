import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { AmapMap } from '@/components/AmapMap';
import { CustomDatePicker } from '@/components/CustomDatePicker';
import { PlaceAutocomplete } from '@/components/PlaceAutocomplete';
import { PixelAvatar } from '@/components/PixelAvatar';
import { Card, Chip, PrimaryButton, Screen, SectionTitle } from '@/components/ui';
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
  const [budget, setBudget] = useState(0);
  const [include, setInclude] = useState<string[]>([]);
  const [exclude, setExclude] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const dateOptions = [
    { label: '今天', value: toLocalDate(0) },
    { label: '明天', value: toLocalDate(1) },
  ];
  const customDateActive = !dateOptions.some(({ value }) => value === state.date);

  const updatePerson = (id: string, patch: Partial<Participant>) => state.setParticipants(state.participants.map((p) => p.id === id ? { ...p, ...patch } : p));
  const toggleMode = (person: Participant, mode: TravelMode) => {
    const exists = person.modes.some((item) => item.mode === mode);
    const modes = exists ? person.modes.filter((item) => item.mode !== mode) : [...person.modes, { mode, limitMinutes: mode === 'transit' ? 50 : 30 }];
    if (modes.length) updatePerson(person.id, { modes });
  };
  const changeLimit = (person: Participant, mode: TravelMode, value: string) => updatePerson(person.id, { modes: person.modes.map((item) => item.mode === mode ? { ...item, limitMinutes: Number(value) || 1 } : item) });

  const calculate = async () => {
    setLoading(true); setNotice('');
    try {
      const result = await recommendRestaurants({ city: state.city, date: state.date, arrivalTime: state.arrivalTime, participants: state.participants, budget: budget || undefined, includeCuisines: include, excludeCuisines: exclude });
      state.setRecommendation(result); setNotice('已使用高德实时数据完成验证');
      router.push('/results');
    } catch (error) {
      const message = error instanceof Error ? error.message : '请求失败';
      setNotice(`暂时无法生成真实餐厅：${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.pageHead}><View><Text style={styles.pageEyebrow}>MEETPOINT</Text><Text style={styles.pageTitle}>聚餐选址</Text></View><View style={styles.pageIcon}><AppIcon name="mappin.and.ellipse" size={21} color="#fff" /></View></View>
      <AmapMap members={(state.recommendation.participants || state.participants.map((person) => ({ name: person.name, location: person.selectedPlace?.location }))).map((person) => ({ label: person.name, location: person.location }))} restaurants={[]} />
      <SectionTitle title="聚餐配置" subtitle="点击可编辑城市、日期与到达时间" />
      <Card style={styles.eventCard}>
        <View style={styles.eventRow}>
          <Text style={styles.eventLabel}>聚餐城市</Text>
          <View style={styles.eventControl}>{cityOptions.map((city) => <Chip key={city} label={city} active={state.city === city} onPress={() => state.setCity(city)} />)}</View>
        </View>
        <View style={[styles.eventRow, styles.eventDivider]}>
          <Text style={styles.eventLabel}>聚餐日期</Text>
          <View style={styles.eventControl}>{dateOptions.map(({ label, value }) => <Chip key={label} label={label} active={state.date === value} onPress={() => state.setDate(value)} />)}<CustomDatePicker value={state.date} active={customDateActive} onChange={state.setDate} /></View>
        </View>
        <View style={[styles.eventRow, styles.eventDivider]}>
          <Text style={styles.eventLabel}>期望到达</Text>
          <View style={styles.timeControl}><TextInput accessibilityLabel="期望到达时间" value={state.arrivalTime} onChangeText={state.setArrivalTime} style={styles.timeInput} keyboardType="numbers-and-punctuation" /><AppIcon name="clock" size={16} color={colors.brand} /></View>
        </View>
      </Card>

      <SectionTitle title="成员出发配置" action={state.participants.length < 4 ? <Text style={styles.inviteText}>＋ 邀请成员（{state.participants.length}/4）</Text> : null} />
      {state.participants.map((person, index) => (
        <Card key={person.id} style={styles.personCard}>
          <View style={styles.personHead}><View style={styles.personIdentity}><PixelAvatar size={32} variant={index} /><TextInput accessibilityLabel={`成员${index + 1}名称`} value={person.name} onChangeText={(name) => updatePerson(person.id, { name })} maxLength={20} selectTextOnFocus style={styles.personNameInput} /></View>{!person.owner ? <Pressable onPress={() => state.setParticipants(state.participants.filter((p) => p.id !== person.id))}><AppIcon name="xmark.circle.fill" size={21} color={colors.faint} /></Pressable> : null}</View>
          <PlaceAutocomplete city={state.city} value={person.address} placeholder="输入地址或地标" onChangeText={(address) => updatePerson(person.id, { address, selectedPlace: undefined })} onSelect={(place) => state.setParticipantPlace(person.id, place)} />
          <Text style={styles.fieldLabel}>可接受的交通方式与上限</Text>
          <View style={styles.modeWrap}>{availableModes.map((mode) => {
            const active = person.modes.find((item) => item.mode === mode);
            return <View key={mode} style={[styles.mode, active && styles.modeActive]}>
              <Pressable onPress={() => toggleMode(person, mode)} hitSlop={5}>
                <Text style={[styles.modeText, active && styles.modeTextActive]}>{modeLabels[mode]}</Text>
              </Pressable>
              {active ? <TextInput value={String(active.limitMinutes)} onChangeText={(v) => changeLimit(person, mode, v)} keyboardType="number-pad" selectTextOnFocus style={styles.limit} /> : null}
              {active ? <Text style={styles.minutes}>分</Text> : null}
            </View>;
          })}</View>
        </Card>
      ))}
      {state.participants.length < 4 ? <Pressable style={styles.add} onPress={() => state.setParticipants([...state.participants, { id: `p-${Date.now()}`, name: `成员${state.participants.length + 1}`, address: '', modes: [{ mode: 'transit', limitMinutes: 50 }] }])}><AppIcon name="add-person" size={15} color={colors.brand} /><Text style={styles.addText}>添加一位聚餐成员</Text></Pressable> : null}

      <Card>
        <SectionTitle title="餐厅筛选偏好" subtitle="通勤时间仍为首要条件" />
        <Text style={styles.filterLabel}>人均预算上限</Text><View style={styles.chips}>{budgetOptions.map((n) => <Chip key={n} label={n ? `¥${n}内` : '不限'} active={budget === n} onPress={() => setBudget(n)} />)}</View>
        <Text style={styles.filterLabel}>只看这些菜系（多选）</Text><View style={styles.chips}>{cuisines.map((x) => <Chip key={x} label={x} active={include.includes(x)} onPress={() => setInclude(include.includes(x) ? include.filter((y) => y !== x) : [...include, x])} />)}</View>
        <Text style={styles.filterLabel}>绝对不能接受（多选）</Text><View style={styles.chips}>{exclusions.map((x) => <Chip key={x} label={`避开${x}`} tone="danger" active={exclude.includes(x)} onPress={() => setExclude(exclude.includes(x) ? exclude.filter((y) => y !== x) : [...exclude, x])} />)}</View>
      </Card>

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      <View style={styles.actionRow}><Pressable style={styles.directLink} onPress={() => router.push('/direct')}><Text style={styles.directLinkText}>已有餐厅</Text></Pressable><View style={{ flex: 1 }}><PrimaryButton label={loading ? '正在计算…' : '推荐餐厅'} icon="location.magnifyingglass" onPress={calculate} disabled={loading} /></View></View>
      {loading ? <ActivityIndicator color={colors.brand} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageHead: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, pageEyebrow: { color: colors.brand, fontSize: 9, fontWeight: '900', letterSpacing: 1.6 }, pageTitle: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -.6, marginTop: 2 }, pageIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  eventCard: { paddingVertical: 4 },
  eventRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12 },
  eventDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  eventLabel: { width: 64, color: colors.text, fontSize: 12, fontWeight: '700' },
  eventControl: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: 8 },
  timeControl: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 7 },
  timeInput: { minWidth: 72, color: colors.text, fontWeight: '800', fontSize: 14, backgroundColor: colors.brandSoft, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 15, textAlign: 'center' },
  personCard: { gap: 11, zIndex: 5 }, personHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, personIdentity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 }, personNameInput: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 18, fontWeight: '800', paddingVertical: 5 },
  fieldLabel: { color: colors.muted, fontSize: 10, fontWeight: '700' }, modeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, mode: { minHeight: 40, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line }, modeActive: { backgroundColor: '#FFF7F7', borderColor: '#F2C9CD' }, modeText: { color: colors.muted, fontSize: 11, fontWeight: '600' }, modeTextActive: { color: colors.brand, fontWeight: '800' }, limit: { width: 30, padding: 0, marginLeft: 5, fontSize: 11, fontWeight: '800', color: colors.brand, textAlign: 'right' }, minutes: { color: colors.brand, fontSize: 10, marginLeft: 2 },
  inviteText: { color: colors.brand, backgroundColor: colors.brandSoft, borderRadius: 14, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6, fontSize: 9, fontWeight: '800' }, add: { minHeight: 47, borderRadius: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: '#F0B9BF', backgroundColor: '#FFF9F9', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, addText: { color: colors.brand, fontSize: 12, fontWeight: '800' },
  filterLabel: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 14, marginBottom: 7 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, notice: { color: colors.warning, fontSize: 11, textAlign: 'center' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, directLink: { height: 50, borderRadius: 25, backgroundColor: colors.subtle, paddingHorizontal: 18, justifyContent: 'center' }, directLinkText: { color: colors.text, fontSize: 12, fontWeight: '900' },
});
