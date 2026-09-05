import { createElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { buildAmapUrl, type MapPoint } from '@/components/amap-map-url';
import { colors } from '@/constants/theme';

export function AmapMap({ members, restaurants }: { members: MapPoint[]; restaurants: MapPoint[] }) {
  const uri = buildAmapUrl(members, restaurants);
  if (!uri) return <View style={[styles.map, styles.empty]}><Text style={styles.emptyTitle}>高德地图等待实时结果</Text><Text style={styles.emptyBody}>完成一次真实通勤计算后，这里会显示成员和餐厅位置。</Text></View>;
  return <View style={styles.map}>{createElement('iframe', { src: uri, title: '高德地图', style: { width: '100%', height: '100%', border: 0 } })}</View>;
}

const styles = StyleSheet.create({
  map: { height: 190, borderRadius: 19, overflow: 'hidden', backgroundColor: '#EDEBE6', borderWidth: 1, borderColor: '#DDDAD2' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyTitle: { color: colors.text, fontSize: 13, fontWeight: '800' },
  emptyBody: { color: colors.muted, fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 5 },
});
