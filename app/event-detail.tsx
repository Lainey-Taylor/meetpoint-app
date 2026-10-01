import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, ImageBackground, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmapMap } from '@/components/AmapMap';
import { AppIcon } from '@/components/AppIcon';
import { BackChevron } from '@/components/BackChevron';
import { PixelAvatar } from '@/components/PixelAvatar';
import { colors, shadows } from '@/constants/theme';

const events = {
  sanlitun: {
    title: '三里屯太古里',
    cover: require('../assets/images/stitch-event-upcoming.jpg'),
    status: '待出行',
    time: '本周六 · 18:30',
    count: 4,
    place: '北京市朝阳区三里屯太古里',
    location: { lng: 116.454, lat: 39.936 },
    note: '和朋友约在三里屯太古里聚餐。具体餐厅和集合点确定后，可以在这里查看。',
  },
  wangjing: {
    title: '望京万科时代',
    cover: require('../assets/images/stitch-event-past.jpg'),
    status: '已结束',
    time: '上周五 · 已聚餐',
    count: 6,
    place: '北京市朝阳区望京万科时代',
    location: { lng: 116.481, lat: 39.997 },
    note: '这次聚会已结束。这里保留了日程地点，方便回顾或再次约在附近。',
  },
} as const;

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const event = id === 'wangjing' ? events.wangjing : events.sanlitun;
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const openMap = () => Linking.openURL(`https://uri.amap.com/search?keyword=${encodeURIComponent(event.place)}`);
  const pickPhoto = async () => {
    const selection = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: .8 });
    if (!selection.canceled && selection.assets[0]?.uri) setPhotoUri(selection.assets[0].uri);
  };

  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="返回首页" style={styles.back}><BackChevron /></Pressable>
      <Text style={styles.headerTitle}>日程详情</Text>
      <View style={styles.headerSpacer} />
    </View>

    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ImageBackground source={event.cover} resizeMode="cover" style={styles.hero} imageStyle={styles.heroImage}>
        <View style={styles.heroShade} />
        <View style={styles.statusPill}><View style={styles.statusDot} /><Text style={styles.statusText}>{event.status} · {event.count}人已确认</Text></View>
      </ImageBackground>

      <Text style={styles.title}>{event.title}</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}><View style={styles.infoIcon}><AppIcon name="calendar" size={21} color={colors.brand} /></View><View style={styles.infoCopy}><Text style={styles.infoMain}>{event.time}</Text><Text style={styles.infoSub}>聚餐日程</Text></View></View>
        <View style={styles.divider} />
        <View style={styles.infoRow}><View style={styles.infoIcon}><AppIcon name="mappin" size={20} color={colors.brand} /></View><View style={styles.infoCopy}><Text style={styles.infoMain}>{event.title}</Text><Text style={styles.infoSub}>{event.place}</Text></View></View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>聚餐主题与发起人说</Text>
        <Text style={styles.note}>{event.note}</Text>
        <View style={styles.attendees}><View style={styles.avatars}>{Array.from({ length: Math.min(event.count, 4) }, (_, index) => <View key={index} style={styles.avatar}><PixelAvatar size={34} variant={index} /></View>)}</View><Text style={styles.attendeeCount}>{event.count} 人参与</Text></View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>集合地点指引</Text>
        <View style={styles.mapWrap}><AmapMap allowEmpty roundMarkers members={[]} restaurants={[{ label: event.title, location: event.location }]} style={styles.map} /></View>
        <View style={styles.locationCard}><Text style={styles.locationName}>{event.title}</Text><Text style={styles.locationSub}>{event.place} · 地图标记为商圈参考位置</Text></View>
        <Pressable onPress={openMap} style={styles.mapAction} accessibilityRole="button"><Text style={styles.mapActionText}>在高德地图中查看</Text><AppIcon name="arrow.turn.up.right" size={16} color={colors.brand} /></Pressable>
      </View>

      <View style={styles.section}>
        <View style={styles.photoHeader}><Text style={[styles.sectionTitle, styles.photoSectionTitle]}>聚会掠影</Text><Pressable onPress={pickPhoto} accessibilityRole="button" accessibilityLabel="选择聚会照片"><Text style={styles.uploadText}>＋ 上传照片</Text></Pressable></View>
        {photoUri ? <View><Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" /><Text style={styles.photoHint}>照片仅在当前页面预览，刷新后不会保存</Text></View> : <View style={styles.photoEmpty}><View style={styles.cameraBadge}><View style={styles.cameraBody}><View style={styles.cameraLens} /></View></View><Text style={styles.photoTitle}>留下美好瞬间</Text><Text style={styles.photoHint}>成为第一个分享本次聚会美貌合影的朋友吧！</Text></View>}
      </View>
    </ScrollView>

    <View style={styles.footer}><View style={styles.footerInner}><View><Text style={styles.footerLabel}>聚会状态</Text><Text style={styles.footerStatus}>{event.status}</Text></View><Pressable style={styles.footerButton} onPress={() => router.push('/choose')}><Text style={styles.footerButtonText}>{event.status === '已结束' ? '再次聚餐选址' : '继续选择餐厅'}</Text></Pressable></View></View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, backgroundColor: '#fff' },
  back: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.text, fontSize: 17, fontWeight: '800' }, headerSpacer: { width: 42 },
  content: { width: '100%', maxWidth: 540, alignSelf: 'center', paddingHorizontal: 18, paddingBottom: 40 },
  hero: { height: 244, justifyContent: 'flex-end', overflow: 'hidden', borderRadius: 26, marginTop: 4, ...shadows.card },
  heroImage: { borderRadius: 26 }, heroShade: { position: 'absolute', inset: 0, backgroundColor: 'rgba(12,23,39,.22)' },
  statusPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.brand, borderRadius: 17, paddingHorizontal: 12, paddingVertical: 8, margin: 15 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' }, statusText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  title: { color: colors.text, fontSize: 17, lineHeight: 23, fontWeight: '800', marginTop: 23, marginBottom: 18 },
  infoCard: { backgroundColor: '#F8FAFC', borderRadius: 20, padding: 17, borderWidth: 1, borderColor: '#EEF1F5' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 15 }, infoIcon: { width: 45, height: 45, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brandSoft },
  infoCopy: { flex: 1 }, infoMain: { color: colors.text, fontSize: 15, fontWeight: '800' }, infoSub: { color: colors.muted, fontSize: 12, marginTop: 5 },
  divider: { height: 1, backgroundColor: '#E5EAF0', marginVertical: 15 },
  section: { paddingTop: 23, paddingBottom: 23, borderBottomWidth: 1, borderBottomColor: '#EDF0F4' }, sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '900', marginBottom: 12 },
  note: { color: '#566273', fontSize: 14, lineHeight: 23 }, attendees: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 19, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#EDF0F4' },
  avatars: { flexDirection: 'row', paddingLeft: 4 }, avatar: { marginLeft: -4, borderWidth: 2, borderColor: '#fff', borderRadius: 20, overflow: 'hidden' }, attendeeCount: { color: colors.success, fontSize: 12, fontWeight: '800', backgroundColor: colors.successSoft, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  mapWrap: { height: 190, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: colors.line }, map: { height: 190, width: '100%', borderRadius: 0 },
  locationCard: { marginTop: 13, padding: 14, borderRadius: 16, backgroundColor: '#F8FAFC' }, locationName: { color: colors.text, fontSize: 13, fontWeight: '800' }, locationSub: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  mapAction: { marginTop: 13, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5 }, mapActionText: { color: colors.brand, fontSize: 13, fontWeight: '800' },
  photoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, photoSectionTitle: { marginBottom: 0 }, uploadText: { color: colors.brand, fontSize: 13, fontWeight: '800' },
  photoEmpty: { minHeight: 160, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', borderColor: '#DEE5ED', backgroundColor: '#FAFBFD', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  cameraBadge: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }, cameraBody: { width: 24, height: 18, borderRadius: 4, borderWidth: 2, borderColor: '#91A3BC', alignItems: 'center', justifyContent: 'center' }, cameraLens: { width: 9, height: 9, borderRadius: 5, borderWidth: 2, borderColor: '#91A3BC' }, photoTitle: { color: colors.text, fontSize: 13, fontWeight: '800', marginTop: 9 }, photoHint: { color: colors.faint, fontSize: 11, marginTop: 5, textAlign: 'center' }, photoPreview: { width: '100%', height: 180, borderRadius: 18 },
  footer: { minHeight: 72, paddingVertical: 11, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: '#fff' }, footerInner: { width: '100%', maxWidth: 540, alignSelf: 'center', paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerLabel: { color: colors.faint, fontSize: 11 }, footerStatus: { color: colors.text, fontSize: 14, fontWeight: '900', marginTop: 3 },
  footerButton: { backgroundColor: colors.brand, borderRadius: 22, paddingHorizontal: 19, paddingVertical: 12 }, footerButtonText: { color: '#fff', fontSize: 13, fontWeight: '900' },
});
