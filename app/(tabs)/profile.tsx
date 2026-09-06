import { useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { Card, Header, Screen, SectionTitle } from '@/components/ui';
import { colors } from '@/constants/theme';

const friends = [['敏', '阿敏', '北大东门', '地铁 · 50 分'], ['李', '老李', '望京 SOHO', '驾车 · 40 分'], ['王', '王工', '丰台科技园', '地铁 · 45 分']];

export default function ProfileScreen() {
  const [relaxed, setRelaxed] = useState(true);
  const [privateShare, setPrivateShare] = useState(true);
  return (
    <Screen>
      <Header badge="我的" action={<View style={styles.headerActions}><View style={styles.headerAction}><AppIcon name="person.badge.plus" size={18} color={colors.text} /></View><View style={styles.headerAction}><AppIcon name="gearshape.fill" size={18} color={colors.text} /></View></View>} />
      <View style={styles.identity}>
        <View style={styles.avatar}><Text style={styles.avatarText}>张</Text></View>
        <View style={{ flex: 1 }}><View style={styles.nameRow}><Text style={styles.name}>小张</Text><Text style={styles.owner}>聚餐发起人</Text></View><Text style={styles.base}>常驻基准 · 海淀中关村</Text></View>
        <Pressable style={styles.editButton}><Text style={styles.edit}>编辑</Text><AppIcon name="chevron.right" size={11} color={colors.muted} /></Pressable>
      </View>

      <ImageBackground source={require('../../assets/images/profile-earth.jpg')} resizeMode="cover" style={styles.earthCard} imageStyle={styles.earthImage}>
        <View style={styles.earthShade} />
        <View style={styles.earthContent}>
          <Text style={styles.earthEyebrow}>聚餐足迹</Text>
          <View style={styles.earthCountRow}><Text style={styles.earthCount}>12</Text><Text style={styles.earthUnit}>场共同抵达</Text></View>
          <View style={styles.metrics}><Metric label="默认首选" value="公交地铁" /><Metric label="通勤上限" value="45 分" /><Metric label="组织聚餐" value="12 场" /></View>
        </View>
      </ImageBackground>

      <SectionTitle title="常驻出发地" />
      <Card><PlaceRow icon="building.2.fill" label="公司" value="海淀区 · 中关村创业大街东门" /><View style={styles.divider} /><PlaceRow icon="house.fill" label="住处" value="朝阳区 · 太阳宫附近" /></Card>

      <SectionTitle title="常用聚餐好友" />
      <Card>{friends.map((friend, index) => <View key={friend[1]} style={[styles.friend, index > 0 && styles.friendBorder]}><View style={[styles.friendAvatar, { backgroundColor: index === 0 ? '#EAF0FF' : index === 1 ? '#F2EAFF' : '#EAF8F2' }]}><Text style={styles.friendAvatarText}>{friend[0]}</Text></View><View style={{ flex: 1 }}><Text style={styles.friendName}>{friend[1]} <Text style={styles.friendPlace}>{friend[2]}</Text></Text><Text style={styles.friendMeta}>{friend[3]}</Text></View><Text style={styles.manage}>管理</Text></View>)}</Card>

      <SectionTitle title="默认规则" />
      <Card><SettingRow title="无严格合格时显示最小违约" body="优先比较最大超时，再比较总超时" value={relaxed} onChange={setRelaxed} /><View style={styles.divider} /><SettingRow title="分享结果时隐藏精确地址" body="链接只显示昵称、方式和通勤时间" value={privateShare} onChange={setPrivateShare} /></Card>

      <Card><LinkRow icon="shield.fill" label="隐私与位置数据说明" /><View style={styles.divider} /><LinkRow icon="questionmark.circle.fill" label="关于聚点聚餐" /></Card>
      <Text style={styles.version}>MeetPoint · MVP 0.1.0</Text>
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>; }
function PlaceRow({ icon, label, value }: { icon: string; label: string; value: string }) { return <View style={styles.placeRow}><View style={styles.placeIcon}><AppIcon name={icon} size={15} color={colors.brand} /></View><View style={{ flex: 1 }}><Text style={styles.placeLabel}>{label}</Text><Text style={styles.placeValue}>{value}</Text></View><AppIcon name="chevron.right" size={13} color={colors.faint} /></View>; }
function SettingRow({ title, body, value, onChange }: { title: string; body: string; value: boolean; onChange: (v: boolean) => void }) { return <View style={styles.setting}><View style={{ flex: 1 }}><Text style={styles.settingTitle}>{title}</Text><Text style={styles.settingBody}>{body}</Text></View><Switch value={value} onValueChange={onChange} trackColor={{ true: colors.brand, false: colors.line }} /></View>; }
function LinkRow({ icon, label }: { icon: string; label: string }) { return <Pressable style={styles.link}><AppIcon name={icon} size={16} color={colors.muted} /><Text style={styles.linkLabel}>{label}</Text><AppIcon name="chevron.right" size={13} color={colors.faint} /></Pressable>; }

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', gap: 7 }, headerAction: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.subtle },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 3, paddingVertical: 5 }, avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.brand, borderWidth: 3, borderColor: '#FFE6D8', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#fff', fontSize: 21, fontWeight: '900' }, nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, name: { color: colors.text, fontSize: 19, fontWeight: '900' }, owner: { color: '#9A421D', fontSize: 9, backgroundColor: colors.brandSoft, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7, overflow: 'hidden', fontWeight: '700' }, base: { color: colors.muted, fontSize: 11, marginTop: 5 }, editButton: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 7 }, edit: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  earthCard: { width: '100%', maxWidth: '100%', height: 210, borderRadius: 23, overflow: 'hidden', justifyContent: 'flex-end' }, earthImage: { borderRadius: 23 }, earthShade: { position: 'absolute', inset: 0, backgroundColor: 'rgba(9,31,47,.20)' }, earthContent: { padding: 17 }, earthEyebrow: { color: '#fff', fontSize: 12, fontWeight: '800', textShadowColor: '#1238', textShadowRadius: 4 }, earthCountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 7, marginTop: 2 }, earthCount: { color: '#fff', fontSize: 36, lineHeight: 43, fontWeight: '900', textShadowColor: '#1238', textShadowRadius: 5 }, earthUnit: { color: '#fff', fontSize: 13, fontWeight: '800' },
  metrics: { marginTop: 14, flexDirection: 'row' }, metric: { flex: 1, alignItems: 'flex-start', paddingRight: 6 }, metricLabel: { color: 'rgba(255,255,255,.78)', fontSize: 9, fontWeight: '700', textShadowColor: '#1238', textShadowRadius: 3 }, metricValue: { color: '#fff', fontSize: 12, fontWeight: '900', marginTop: 3, textShadowColor: '#1238', textShadowRadius: 3 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginVertical: 10 }, placeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, placeIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' }, placeLabel: { color: colors.muted, fontSize: 9 }, placeValue: { color: colors.text, fontSize: 12, fontWeight: '700', marginTop: 3 },
  friend: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 }, friendBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, marginTop: 7, paddingTop: 12 }, friendAvatar: { width: 34, height: 34, borderRadius: 17, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, friendAvatarText: { color: colors.text, fontSize: 12, lineHeight: 15, fontWeight: '900', textAlign: 'center' }, friendName: { color: colors.text, fontSize: 12, fontWeight: '800' }, friendPlace: { color: colors.blue, fontSize: 9 }, friendMeta: { color: colors.muted, fontSize: 10, marginTop: 3 }, manage: { color: colors.muted, fontSize: 10 },
  setting: { flexDirection: 'row', alignItems: 'center', gap: 12 }, settingTitle: { color: colors.text, fontSize: 12, fontWeight: '800' }, settingBody: { color: colors.muted, fontSize: 10, marginTop: 3, lineHeight: 14 }, link: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 30 }, linkLabel: { flex: 1, color: colors.text, fontSize: 12, fontWeight: '600' }, version: { color: colors.faint, fontSize: 10, textAlign: 'center', paddingVertical: 4 },
});
