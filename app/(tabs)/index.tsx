import { router } from 'expo-router';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { PixelAvatar } from '@/components/PixelAvatar';
import { Header, Screen } from '@/components/ui';
import { colors } from '@/constants/theme';

const areas = [
  ['三里屯商圈', '朝阳区', '异国料理 · 精酿 · 夜宵', '10/17号线'],
  ['望京核心区', '朝阳区', '韩餐 · 融合菜 · 烤肉', '14/15号线'],
  ['中关村 / 五道口', '海淀区', '老字号 · 聚餐大桌菜', '4/10/13号线'],
  ['国贸 CBD', '朝阳区', '景观餐厅 · 商务聚会', '1/10号线'],
];

export default function HomeScreen() {
  function continueRecentDinner() {
    router.push('/results');
  }

  return (
    <Screen>
      <Header action={<View style={styles.profile}><PixelAvatar size={28} /></View>} />
      <ImageBackground source={require('../../assets/images/home-hero-blue.jpg')} resizeMode="cover" style={styles.hero} imageStyle={styles.heroImage}>
        <View style={styles.heroShade} />
        <Text style={styles.heroTitle}>找到大家都满意的餐厅</Text>
        <Text style={styles.heroBody}>录入每个人的出发地、交通方式与时间上限，快速生成可以一起选的餐厅清单。</Text>
        <Pressable style={styles.heroMain} onPress={() => router.push('/choose')}><AppIcon name="plus.circle.fill" size={18} color={colors.blue} /><Text style={styles.heroMainText}>创建一次聚餐选址</Text></Pressable>
        <Pressable style={styles.heroSecondary} onPress={() => router.push('/direct')}><AppIcon name="scope" size={15} color="#FFFFFF" /><Text style={styles.heroSecondaryText}>已有餐厅？直接测算通勤</Text></Pressable>
      </ImageBackground>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>最近的聚餐</Text>
        <View style={styles.recentContent}>
          <View style={styles.recentTop}><View style={{ flex: 1 }}><Text style={styles.dinnerTitle}>周末朋友聚餐</Text><Text style={styles.recommendMeta}>两人预计 36–42 分钟</Text></View><Text style={styles.recommendLabel}>当前首选</Text></View>
          <Text style={styles.recommendTitle}>三里屯太古里附近</Text>
          <Pressable onPress={continueRecentDinner} style={({ pressed }) => [styles.continueLink, pressed && styles.pressed]}><Text style={styles.continueText}>继续选择餐厅</Text><AppIcon name="arrow.right" size={15} color={colors.brand} /></Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>热门聚餐商圈</Text>
        <Text style={styles.sectionSubtitle}>仅作灵感参考，实际结果以通勤测算为准</Text>
        <View style={styles.areaList}>{areas.map(([name, district, food, metro], index) => (
          <View key={name} style={[styles.areaRow, index > 0 && styles.areaDivider]}>
            <View style={{ flex: 1 }}><View style={styles.areaHead}><Text style={styles.areaName}>{name}</Text><Text style={styles.district}>{district}</Text></View><Text style={styles.areaFood}>{food}</Text></View>
            <Text style={styles.areaMetro}>{metro}</Text>
          </View>
        ))}</View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.subtle, borderRadius: 18, padding: 3 },
  hero: { width: '100%', minHeight: 260, backgroundColor: '#315C8D', borderRadius: 26, padding: 20, gap: 10, overflow: 'hidden' },
  heroImage: { borderRadius: 26 }, heroShade: { position: 'absolute', inset: 0, backgroundColor: 'rgba(13,42,76,.18)' },
  heroTitle: { color: '#FFFFFF', fontSize: 23, lineHeight: 30, fontWeight: '900', letterSpacing: -.5 },
  heroBody: { color: '#EAF4FF', fontSize: 13, lineHeight: 20, maxWidth: 310, fontWeight: '600', marginBottom: 2 },
  heroMain: { minHeight: 48, borderRadius: 16, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  heroMainText: { color: colors.blue, fontSize: 14, fontWeight: '800' },
  heroSecondary: { minHeight: 42, borderRadius: 15, backgroundColor: 'rgba(255,255,255,.17)', borderWidth: 1, borderColor: 'rgba(255,255,255,.24)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  heroSecondaryText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  section: { paddingHorizontal: 3, paddingVertical: 3 }, sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '900', letterSpacing: -.3 }, sectionSubtitle: { color: colors.muted, fontSize: 11, marginTop: 3 },
  recentContent: { paddingTop: 13, paddingBottom: 4 }, recentTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, dinnerTitle: { color: colors.text, fontSize: 16, fontWeight: '800' }, recommendLabel: { color: colors.brand, fontSize: 10, fontWeight: '700' }, recommendTitle: { color: colors.text, fontSize: 14, fontWeight: '800', marginTop: 13 }, recommendMeta: { color: colors.muted, fontSize: 11, marginTop: 4 }, continueLink: { marginTop: 14, minHeight: 38, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, paddingTop: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, continueText: { color: colors.brand, fontSize: 12, fontWeight: '800' }, pressed: { opacity: .58 },
  areaList: { marginTop: 10 }, areaRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }, areaDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }, areaHead: { flexDirection: 'row', alignItems: 'center', gap: 8 }, areaName: { color: colors.text, fontSize: 13, fontWeight: '800' }, district: { color: colors.brand, fontSize: 9, fontWeight: '700' }, areaFood: { color: colors.muted, fontSize: 10, marginTop: 5 }, areaMetro: { color: colors.faint, fontSize: 9, maxWidth: 78, textAlign: 'right' },
});
