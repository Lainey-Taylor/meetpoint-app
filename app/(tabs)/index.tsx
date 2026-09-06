import { router } from 'expo-router';
import { useState } from 'react';
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { Screen } from '@/components/ui';
import { colors, shadows } from '@/constants/theme';

const areas = [
  ['三里屯', require('../../assets/images/stitch-area-sanlitun.jpg')],
  ['国贸CBD', require('../../assets/images/stitch-area-guomao.jpg')],
  ['望京', require('../../assets/images/stitch-area-wangjing.jpg')],
  ['五道口', require('../../assets/images/stitch-area-wudaokou.jpg')],
  ['鼓楼', require('../../assets/images/stitch-area-gulou.jpg')],
] as const;

export default function HomeScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const [activeSchedule, setActiveSchedule] = useState('全部');
  function continueRecentDinner() {
    router.push('/results');
  }

  const events = [
    { image: require('../../assets/images/stitch-event-upcoming.jpg'), date: '本周六 · 18:30', title: '第 3 次出行（三里屯太古里）', meta: '★ 评分 4.9  ·  人均 ¥158  ·  4人已确认', status: '待出行', onPress: continueRecentDinner },
    { image: require('../../assets/images/stitch-event-past.jpg'), date: '上周五 · 已圆满聚餐', title: '第 2 次出行（望京万科时代）', meta: '★ 评分 4.8  ·  人均 ¥125  ·  6人已确认', status: '已结束', onPress: continueRecentDinner },
  ];
  const visibleEvents = activeSchedule === '全部' ? events : events.filter((event) => event.status === activeSchedule);

  return (
    <Screen>
      <ImageBackground source={require('../../assets/images/stitch-hero.jpg')} resizeMode="cover" style={[styles.hero, { width: windowWidth, marginLeft: -16 }]}>
        <View style={styles.heroShade} />
        <View style={styles.heroCopy}>
          <View style={styles.weekBadge}><AppIcon name="celebration" size={12} color="#fff" /><Text style={styles.weekText}>周末聚会优选</Text></View>
          <Text style={styles.heroTitle}>准备好{`\n`}和朋友聚餐了吗？</Text>
          <Pressable style={styles.directButton} onPress={() => router.push('/direct')}><AppIcon name="scope" size={17} color="#fff" /><Text style={styles.directText}>距离测算</Text><Text style={styles.directArrow}>→</Text></Pressable>
        </View>
      </ImageBackground>

      <Pressable style={styles.intentCard} onPress={() => router.push('/choose')}>
        <View style={styles.intentIcon}><View style={styles.plusHorizontal} /><View style={styles.plusVertical} /></View>
        <View style={{ flex: 1 }}><Text style={styles.intentTitle}>帮我找一个满意的餐厅</Text><Text style={styles.intentBody}>智能平衡多方路程 · 口味预算定制</Text></View>
        <View style={styles.arrowCircle}><AppIcon name="chevron.right" size={18} color={colors.text} /></View>
      </Pressable>

      <View style={styles.sectionHead}><Text style={styles.sectionTitle}>我的聚会日程</Text><View style={styles.history}><Text style={styles.historyText}>历史记录</Text><AppIcon name="sliders" size={13} color={colors.muted} /></View></View>
      <View style={styles.filters}>{['全部', '待出行', '进行中', '已结束'].map((item) => <Pressable key={item} onPress={() => setActiveSchedule(item)} style={item === activeSchedule ? styles.filterActive : styles.filter}><Text style={item === activeSchedule ? styles.filterActiveText : styles.filterText}>{item}</Text></Pressable>)}</View>

      {visibleEvents.map((event) => <EventCard key={event.title} {...event} />)}
      {!visibleEvents.length ? <View style={styles.noEvents}><Text style={styles.noEventsTitle}>暂无{activeSchedule}的聚会</Text><Text style={styles.noEventsBody}>创建聚餐后，日程会自动归入对应状态。</Text></View> : null}

      <View style={styles.sectionHead}><View><Text style={styles.sectionTitle}>热门商圈</Text><Text style={styles.sectionSubtitle}>聚餐碰头最高频的核心商业地标</Text></View><Text style={styles.allAreas}>全部商圈 ›</Text></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.areaRail}>{areas.map(([name, image]) => <Pressable key={name} style={styles.area} onPress={() => router.push('/direct')}><Image source={image} style={styles.areaImage} /><Text style={styles.areaName}>{name}</Text></Pressable>)}</ScrollView>
    </Screen>
  );
}

function EventCard({ image, date, title, meta, status, onPress }: { image: number; date: string; title: string; meta: string; status: string; onPress: () => void }) {
  return <Pressable style={styles.event} onPress={onPress}><ImageBackground source={image} style={styles.eventImage}><View style={styles.eventShade} /><View style={styles.dateBadge}><AppIcon name="clock" size={12} color="#fff" /><Text style={styles.dateText}>{date}</Text></View></ImageBackground><View style={styles.eventInfo}><View style={styles.eventTitleRow}><Text style={styles.eventTitle}>{title}</Text><Text style={status === '待出行' ? styles.pending : styles.ended}>{status}</Text></View><Text style={styles.eventMeta}>{meta}</Text></View></Pressable>;
}

const styles = StyleSheet.create({
  hero: { height: 320, marginTop: -8, justifyContent: 'flex-end', overflow: 'hidden' }, heroShade: { position: 'absolute', inset: 0, backgroundColor: 'rgba(16,8,5,.34)' }, heroCopy: { paddingHorizontal: 20, paddingBottom: 38 }, weekBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(35,28,25,.62)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 }, weekText: { color: '#fff', fontSize: 11, fontWeight: '800' }, heroTitle: { color: '#fff', fontSize: 29, lineHeight: 35, fontWeight: '900', marginTop: 10, letterSpacing: -.7 }, directButton: { marginTop: 16, height: 48, alignSelf: 'flex-start', borderRadius: 24, backgroundColor: colors.brand, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', gap: 9 }, directText: { color: '#fff', fontSize: 15, fontWeight: '900' }, directArrow: { color: '#fff', fontSize: 20, lineHeight: 21, fontWeight: '900' },
  intentCard: { marginTop: -35, minHeight: 90, backgroundColor: '#fff', borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 13, ...shadows.card }, intentIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' }, plusHorizontal: { position: 'absolute', width: 18, height: 2, borderRadius: 1, backgroundColor: colors.brand }, plusVertical: { position: 'absolute', width: 2, height: 18, borderRadius: 1, backgroundColor: colors.brand }, intentTitle: { color: colors.text, fontSize: 16, fontWeight: '900' }, intentBody: { color: colors.muted, fontSize: 10, marginTop: 4 }, arrowCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.subtle, alignItems: 'center', justifyContent: 'center' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }, sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '900' }, sectionSubtitle: { color: colors.muted, fontSize: 10, marginTop: 3 }, history: { flexDirection: 'row', alignItems: 'center', gap: 5 }, historyText: { color: '#5C3030', fontSize: 11, fontWeight: '700' }, filters: { flexDirection: 'row', gap: 8 }, filter: { height: 34, paddingHorizontal: 16, borderRadius: 17, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, justifyContent: 'center' }, filterActive: { height: 34, paddingHorizontal: 17, borderRadius: 17, backgroundColor: colors.secondary, justifyContent: 'center' }, filterText: { color: colors.text, fontSize: 11, fontWeight: '700' }, filterActiveText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  event: { overflow: 'hidden', borderRadius: 18, backgroundColor: '#fff', ...shadows.card }, eventImage: { height: 188, justifyContent: 'flex-end' }, eventShade: { position: 'absolute', inset: 0, backgroundColor: 'rgba(5,5,5,.09)' }, dateBadge: { alignSelf: 'flex-start', margin: 12, borderRadius: 14, backgroundColor: 'rgba(24,23,21,.78)', paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5 }, dateText: { color: '#fff', fontSize: 10, fontWeight: '800' }, eventInfo: { padding: 15 }, eventTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, eventTitle: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '900' }, pending: { color: colors.secondary, backgroundColor: colors.secondarySoft, borderRadius: 9, overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 3, fontSize: 9, fontWeight: '800' }, ended: { color: colors.muted, backgroundColor: colors.subtle, borderRadius: 9, overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 3, fontSize: 9, fontWeight: '800' }, eventMeta: { color: colors.muted, fontSize: 10, marginTop: 7 },
  noEvents: { minHeight: 126, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }, noEventsTitle: { color: colors.text, fontSize: 14, fontWeight: '900' }, noEventsBody: { color: colors.muted, fontSize: 10, marginTop: 5 },
  allAreas: { color: colors.brand, fontSize: 11, fontWeight: '800' }, areaRail: { gap: 15, paddingRight: 12 }, area: { alignItems: 'center', gap: 7 }, areaImage: { width: 62, height: 62, borderRadius: 31, borderWidth: 2, borderColor: colors.brand }, areaName: { color: colors.text, fontSize: 11, fontWeight: '800' },
});
