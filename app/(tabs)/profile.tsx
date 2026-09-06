import { useState } from 'react';
import { Image, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { Card, Screen, SectionTitle } from '@/components/ui';
import { colors } from '@/constants/theme';

const friends = [
  ['阿敏', '北大圈', '北大东门', '地铁·50分', require('../../assets/images/stitch-friend-min.jpg')],
  ['老李', '望京群', '望京SOHO', '驾车·40分', require('../../assets/images/stitch-friend-li.jpg')],
  ['王工', '羽球聚', '丰台科技园', '地铁·45分', require('../../assets/images/stitch-friend-wang.jpg')],
] as const;

export default function ProfileScreen() {
  const [relaxed, setRelaxed] = useState(true);
  const [privateShare, setPrivateShare] = useState(true);
  return <Screen>
    <View style={styles.profileHero}>
      <Image source={require('../../assets/images/stitch-profile.jpg')} style={styles.avatar} />
      <View style={{ flex: 1 }}><View style={styles.nameRow}><Text style={styles.name}>小张</Text><Text style={styles.owner}>✦ 聚餐发起人</Text></View><View style={styles.location}><AppIcon name="mappin" size={12} color={colors.brand} /><Text style={styles.locationText}>海淀区中关村</Text></View></View>
      <View style={styles.heroGlow} />
      <View style={styles.metrics}><Metric value="12" unit="次" label="共同抵达聚餐" tone="brand" /><Metric value="8" unit="处" label="常去高分聚点" tone="purple" /><Metric value="45" unit="分" label="通勤耐受上限" tone="gold" /></View>
    </View>

    <Card><SectionTitle title="出行与聚餐档案" action={<Text style={styles.linkAction}>足迹报告 ›</Text>} /><View style={styles.profileStats}><MiniStat icon="train" label="默认通勤方式" value="公交地铁优先" /><MiniStat icon="clock" label="通勤时间容忍" value="≤ 45 分钟" /></View></Card>

    <SectionTitle title="常驻出发地" action={<Text style={styles.addAction}>＋ 新增</Text>} />
    <Card><PlaceRow icon="building.2.fill" label="公司" badge="默认出发点" value="北京市海淀区 · 中关村创业大街东门" /><View style={styles.divider} /><PlaceRow icon="house.fill" label="住处" value="北京市朝阳区 · 太阳宫附近" /></Card>

    <SectionTitle title="常用聚餐好友" action={<Text style={styles.addAction}>♙ 添加好友</Text>} />
    {friends.map(([name, group, place, commute, image]) => <Card key={name} style={styles.friendCard}><Image source={image} style={styles.friendAvatar} /><View style={{ flex: 1 }}><View style={styles.friendNameRow}><Text style={styles.friendName}>{name}</Text><Text style={styles.groupBadge}>{group}</Text></View><Text style={styles.friendMeta}>⌖ {place}　|　{commute}</Text></View><Text style={styles.preference}>偏好</Text></Card>)}

    <SectionTitle title="默认测算规则" />
    <Card><SettingRow title="无严格合格时显示最小违约" body="优先比较各成员最大超时，再比较全员总超时" value={relaxed} onChange={setRelaxed} /><View style={styles.divider} /><SettingRow title="分享结果时隐藏精确地址" body="聚会公共链接仅显示昵称、出行方式和测算通勤时间" value={privateShare} onChange={setPrivateShare} /></Card>
    <Card><LinkRow icon="shield.fill" label="隐私与位置数据处理说明" /><View style={styles.divider} /><LinkRow icon="questionmark.circle.fill" label="关于聚点聚餐" /></Card>
    <Text style={styles.version}>MeetPoint · MVP v0.1.0</Text>
  </Screen>;
}

function Metric({ value, unit, label, tone }: { value: string; unit: string; label: string; tone: 'brand' | 'purple' | 'gold' }) { return <View style={styles.metric}><Text style={[styles.metricValue, tone === 'brand' ? styles.red : tone === 'purple' ? styles.purple : styles.gold]}>{value}<Text style={styles.metricUnit}> {unit}</Text></Text><Text style={styles.metricLabel}>{label}</Text></View>; }
function MiniStat({ icon, label, value }: { icon: string; label: string; value: string }) { return <View style={styles.miniStat}><View style={styles.miniIcon}><AppIcon name={icon} size={15} color={colors.brand} /></View><View><Text style={styles.miniLabel}>{label}</Text><Text style={styles.miniValue}>{value}</Text></View></View>; }
function PlaceRow({ icon, label, value, badge }: { icon: string; label: string; value: string; badge?: string }) { return <Pressable style={styles.placeRow}><View style={styles.placeIcon}><AppIcon name={icon} size={18} color={colors.brand} /></View><View style={{ flex: 1 }}><View style={styles.placeHead}><Text style={styles.placeLabel}>{label}</Text>{badge ? <Text style={styles.placeBadge}>{badge}</Text> : null}</View><Text style={styles.placeValue}>{value}</Text></View><AppIcon name="chevron.right" size={15} color={colors.text} /></Pressable>; }
function SettingRow({ title, body, value, onChange }: { title: string; body: string; value: boolean; onChange: (v: boolean) => void }) { return <View style={styles.setting}><View style={{ flex: 1 }}><Text style={styles.settingTitle}>{title}</Text><Text style={styles.settingBody}>{body}</Text></View><Switch value={value} onValueChange={onChange} trackColor={{ true: colors.brand, false: colors.line }} thumbColor="#fff" /></View>; }
function LinkRow({ icon, label }: { icon: string; label: string }) { return <Pressable style={styles.link}><View style={styles.linkIcon}><AppIcon name={icon} size={15} color="#5C403D" /></View><Text style={styles.linkLabel}>{label}</Text><AppIcon name="chevron.right" size={15} color={colors.muted} /></Pressable>; }

const styles = StyleSheet.create({
  profileHero: { minHeight: 205, backgroundColor: '#fff', borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'flex-start', gap: 13, overflow: 'hidden' }, heroGlow: { position: 'absolute', width: 150, height: 150, right: -45, top: -45, borderRadius: 75, backgroundColor: '#FFF0EE' }, avatar: { width: 64, height: 64, borderRadius: 32, zIndex: 1 }, nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 1 }, name: { color: colors.text, fontSize: 19, fontWeight: '900' }, owner: { color: '#6B241E', backgroundColor: '#FFE3DF', borderRadius: 11, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 4, fontSize: 9, fontWeight: '800' }, location: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 }, locationText: { color: colors.text, fontSize: 11 }, metrics: { position: 'absolute', left: 18, right: 18, bottom: 17, height: 74, borderRadius: 14, backgroundColor: colors.background, flexDirection: 'row', paddingVertical: 13 }, metric: { flex: 1, alignItems: 'center', borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.line }, metricValue: { fontSize: 25, lineHeight: 28, fontWeight: '900' }, metricUnit: { color: colors.text, fontSize: 10 }, metricLabel: { color: colors.muted, fontSize: 9, marginTop: 5 }, red: { color: colors.brand }, purple: { color: colors.secondary }, gold: { color: '#9A6500' },
  linkAction: { color: colors.brand, fontSize: 11, fontWeight: '800' }, addAction: { color: colors.text, backgroundColor: colors.subtle, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 13, overflow: 'hidden', fontSize: 10, fontWeight: '700' }, profileStats: { flexDirection: 'row', gap: 9, marginTop: 14 }, miniStat: { flex: 1, minHeight: 62, backgroundColor: colors.background, borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }, miniIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }, miniLabel: { color: colors.muted, fontSize: 9 }, miniValue: { color: colors.text, fontSize: 11, fontWeight: '900', marginTop: 3 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginVertical: 10 }, placeRow: { flexDirection: 'row', alignItems: 'center', gap: 11 }, placeIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' }, placeHead: { flexDirection: 'row', alignItems: 'center', gap: 7 }, placeLabel: { color: colors.text, fontSize: 14, fontWeight: '900' }, placeBadge: { color: '#fff', backgroundColor: colors.brand, paddingHorizontal: 6, paddingVertical: 2, fontSize: 8, fontWeight: '800', overflow: 'hidden' }, placeValue: { color: colors.muted, fontSize: 10, marginTop: 5 },
  friendCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13 }, friendAvatar: { width: 44, height: 44, borderRadius: 22 }, friendNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, friendName: { color: colors.text, fontSize: 14, fontWeight: '900' }, groupBadge: { color: colors.secondary, backgroundColor: colors.secondarySoft, borderRadius: 8, overflow: 'hidden', paddingHorizontal: 6, paddingVertical: 3, fontSize: 8, fontWeight: '800' }, friendMeta: { color: colors.muted, fontSize: 9, marginTop: 5 }, preference: { color: colors.text, backgroundColor: colors.subtle, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, overflow: 'hidden', fontSize: 10, fontWeight: '800' },
  setting: { flexDirection: 'row', alignItems: 'center', gap: 12 }, settingTitle: { color: colors.text, fontSize: 12, fontWeight: '900' }, settingBody: { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 4 }, link: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 10 }, linkIcon: { width: 32, height: 32, borderRadius: 9, backgroundColor: colors.subtle, alignItems: 'center', justifyContent: 'center' }, linkLabel: { flex: 1, color: colors.text, fontSize: 12, fontWeight: '700' }, version: { color: '#9A8D90', fontSize: 10, textAlign: 'center', paddingVertical: 6, fontWeight: '700' },
});
