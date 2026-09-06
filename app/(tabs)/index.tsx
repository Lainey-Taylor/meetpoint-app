import { useState } from 'react';
import { router } from 'expo-router';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { PixelAvatar } from '@/components/PixelAvatar';
import { Card, Header, PrimaryButton, Screen, SectionTitle } from '@/components/ui';
import { colors } from '@/constants/theme';
import { recommendRestaurants } from '@/services/meetpoint-api';
import { useMeetPoint } from '@/state/MeetPointContext';

const areas = [
  ['三里屯商圈', '朝阳区', '异国料理 · 精酿 · 夜宵', '10/17号线'],
  ['望京核心区', '朝阳区', '韩餐 · 融合菜 · 烤肉', '14/15号线'],
  ['中关村 / 五道口', '海淀区', '老字号 · 聚餐大桌菜', '4/10/13号线'],
  ['国贸 CBD', '朝阳区', '景观餐厅 · 商务聚会', '1/10号线'],
];

export default function HomeScreen() {
  const meetPoint = useMeetPoint();
  const [isRefreshingRecent, setIsRefreshingRecent] = useState(false);
  const [recentError, setRecentError] = useState('');

  async function continueRecentDinner() {
    setIsRefreshingRecent(true);
    setRecentError('');
    try {
      const result = await recommendRestaurants({
        city: meetPoint.city,
        date: meetPoint.date,
        arrivalTime: meetPoint.arrivalTime,
        participants: meetPoint.participants,
      });
      meetPoint.setRecommendation(result);
      router.push('/results');
    } catch (error) {
      const message = error instanceof Error ? error.message : '请求失败';
      setRecentError(`暂时无法更新真实餐厅：${message}`);
    } finally {
      setIsRefreshingRecent(false);
    }
  }

  return (
    <Screen>
      <Header action={<View style={styles.profile}><PixelAvatar size={28} /><Text style={styles.profileText}>小张</Text></View>} />
      <ImageBackground source={require('../../assets/images/home-hero-blue.jpg')} resizeMode="cover" style={styles.hero} imageStyle={styles.heroImage}>
        <View style={styles.heroShade} />
        <Text style={styles.heroTitle}>找到大家都满意的餐厅</Text>
        <Text style={styles.heroBody}>录入每个人的出发地、交通方式与时间上限，快速生成可以一起选的餐厅清单。</Text>
        <Pressable style={styles.heroMain} onPress={() => router.push('/choose')}><AppIcon name="plus.circle.fill" size={18} color={colors.blue} /><Text style={styles.heroMainText}>创建一次聚餐选址</Text></Pressable>
        <Pressable style={styles.heroSecondary} onPress={() => router.push('/direct')}><AppIcon name="scope" size={15} color="#FFFFFF" /><Text style={styles.heroSecondaryText}>已有餐厅？直接测算通勤</Text></Pressable>
      </ImageBackground>

      <SectionTitle title="最近的聚餐" />
      <Card>
        <Text style={styles.dinnerTitle}>周末朋友聚餐</Text>
        <View style={styles.recommend}><Text style={styles.recommendLabel}>当前首选</Text><Text style={styles.recommendTitle}>三里屯太古里附近</Text><Text style={styles.recommendMeta}>两人预计 36–42 分钟</Text></View>
        <PrimaryButton
          label={isRefreshingRecent ? '正在更新真实餐厅…' : '继续选择餐厅'}
          onPress={continueRecentDinner}
          disabled={isRefreshingRecent}
        />
        {recentError ? <Text style={styles.recentError}>{recentError}</Text> : null}
      </Card>

      <SectionTitle title="热门聚餐商圈" subtitle="仅作灵感参考，实际结果以通勤测算为准" />
      <View style={styles.areaGrid}>{areas.map(([name, district, food, metro]) => (
        <Card key={name} style={styles.areaCard}>
          <View style={styles.areaHead}><Text style={styles.areaName}>{name}</Text><Text style={styles.district}>{district}</Text></View>
          <Text style={styles.areaFood} numberOfLines={1}>{food}</Text><Text style={styles.areaMetro}>⌁ {metro}</Text>
        </Card>
      ))}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.subtle, borderRadius: 18, padding: 3, paddingRight: 10 },
  profileText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  hero: { width: '100%', minHeight: 260, backgroundColor: '#315C8D', borderRadius: 26, padding: 20, gap: 10, overflow: 'hidden' },
  heroImage: { borderRadius: 26 }, heroShade: { position: 'absolute', inset: 0, backgroundColor: 'rgba(13,42,76,.18)' },
  heroTitle: { color: '#FFFFFF', fontSize: 23, lineHeight: 30, fontWeight: '900', letterSpacing: -.5 },
  heroBody: { color: '#FFF4ED', fontSize: 13, lineHeight: 20, maxWidth: 310, fontWeight: '600', marginBottom: 2 },
  heroMain: { minHeight: 48, borderRadius: 16, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  heroMainText: { color: colors.blue, fontSize: 14, fontWeight: '800' },
  heroSecondary: { minHeight: 42, borderRadius: 15, backgroundColor: 'rgba(255,255,255,.17)', borderWidth: 1, borderColor: 'rgba(255,255,255,.24)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  heroSecondaryText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  dinnerTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  recommend: { backgroundColor: '#F8F8FA', borderRadius: 13, padding: 12, marginVertical: 12 }, recommendLabel: { color: colors.muted, fontSize: 10 }, recommendTitle: { color: colors.text, fontSize: 14, fontWeight: '800', marginTop: 3 }, recommendMeta: { color: colors.muted, fontSize: 11, marginTop: 3 },
  recentError: { color: '#B42318', fontSize: 11, lineHeight: 16, marginTop: 8 },
  areaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, areaCard: { width: '48.5%', padding: 12, borderRadius: 16 }, areaHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, areaName: { color: colors.text, fontSize: 12, fontWeight: '800', flex: 1 },
  district: { color: '#9A421D', fontSize: 9, backgroundColor: colors.brandSoft, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' }, areaFood: { color: colors.muted, fontSize: 10, marginTop: 8 }, areaMetro: { color: colors.faint, fontSize: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, marginTop: 8, paddingTop: 6 },
});
