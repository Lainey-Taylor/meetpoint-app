import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { Card, Header, Screen, SectionTitle } from '@/components/ui';
import { colors } from '@/constants/theme';

const friends = [['敏', '阿敏', '北大东门', '地铁 · 50 分'], ['李', '老李', '望京 SOHO', '驾车 · 40 分'], ['王', '王工', '丰台科技园', '地铁 · 45 分']];

export default function ProfileScreen() {
  const [relaxed, setRelaxed] = useState(true);
  const [privateShare, setPrivateShare] = useState(true);
  return (
    <Screen>
      <Header badge="个人中心" action={<AppIcon name="gearshape.fill" size={21} color={colors.muted} />} />
      <View style={styles.hero}>
        <View style={styles.avatar}><Text style={styles.avatarText}>张</Text></View><View style={{ flex: 1 }}><View style={styles.nameRow}><Text style={styles.name}>小张</Text><Text style={styles.owner}>发起人</Text></View><Text style={styles.base}>常驻基准 · 海淀中关村</Text></View><Text style={styles.edit}>编辑</Text>
        <View style={styles.metrics}><Metric label="默认首选" value="地铁" /><Metric label="舒适上限" value="45 分" /><Metric label="组织聚餐" value="12 场" /></View>
      </View>

      <SectionTitle title="常驻出发地" subtitle="创建聚餐时可一键带入" />
      <Card><PlaceRow icon="building.2.fill" label="公司" value="海淀区 · 中关村创业大街东门" /><View style={styles.divider} /><PlaceRow icon="house.fill" label="住处" value="朝阳区 · 太阳宫附近" /></Card>

      <SectionTitle title="常用聚餐好友" subtitle="一期仍由发起人代填与管理" />
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
  hero: { borderRadius: 25, backgroundColor: colors.brand, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 11, flexWrap: 'wrap', overflow: 'hidden' }, avatar: { width: 52, height: 52, borderRadius: 17, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: colors.brand, fontSize: 20, fontWeight: '900' }, nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, name: { color: '#fff', fontSize: 17, fontWeight: '900' }, owner: { color: '#FFE4D5', fontSize: 9, backgroundColor: 'rgba(0,0,0,.18)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' }, base: { color: '#FFE4D5', fontSize: 11, marginTop: 4 }, edit: { color: '#fff', fontSize: 11, fontWeight: '800', backgroundColor: 'rgba(255,255,255,.18)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, overflow: 'hidden' },
  metrics: { width: '100%', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,.22)', paddingTop: 11, marginTop: 2, flexDirection: 'row' }, metric: { flex: 1, alignItems: 'center' }, metricLabel: { color: '#FFDCCB', fontSize: 9 }, metricValue: { color: '#fff', fontSize: 12, fontWeight: '900', marginTop: 3 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginVertical: 10 }, placeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, placeIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' }, placeLabel: { color: colors.muted, fontSize: 9 }, placeValue: { color: colors.text, fontSize: 12, fontWeight: '700', marginTop: 3 },
  friend: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 }, friendBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, marginTop: 7, paddingTop: 12 }, friendAvatar: { width: 34, height: 34, borderRadius: 17, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, friendAvatarText: { color: colors.text, fontSize: 12, lineHeight: 15, fontWeight: '900', textAlign: 'center' }, friendName: { color: colors.text, fontSize: 12, fontWeight: '800' }, friendPlace: { color: colors.blue, fontSize: 9 }, friendMeta: { color: colors.muted, fontSize: 10, marginTop: 3 }, manage: { color: colors.muted, fontSize: 10 },
  setting: { flexDirection: 'row', alignItems: 'center', gap: 12 }, settingTitle: { color: colors.text, fontSize: 12, fontWeight: '800' }, settingBody: { color: colors.muted, fontSize: 10, marginTop: 3, lineHeight: 14 }, link: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 30 }, linkLabel: { flex: 1, color: colors.text, fontSize: 12, fontWeight: '600' }, version: { color: colors.faint, fontSize: 10, textAlign: 'center', paddingVertical: 4 },
});
