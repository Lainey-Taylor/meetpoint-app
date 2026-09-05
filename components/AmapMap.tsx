import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { buildAmapUrl, type MapPoint } from '@/components/amap-map-url';
import { colors } from '@/constants/theme';

export function AmapMap({ members, restaurants }: { members: MapPoint[]; restaurants: MapPoint[] }) {
  const uri = buildAmapUrl(members, restaurants);
  if (!uri) return <MapUnavailable />;
  return <View style={styles.mapFrame}><WebView source={{ uri }} style={styles.webView} javaScriptEnabled domStorageEnabled scrollEnabled={false} bounces={false} /></View>;
}

function MapUnavailable() {
  return <View style={[styles.mapFrame, styles.empty]}><Text style={styles.emptyTitle}>高德地图等待实时结果</Text><Text style={styles.emptyBody}>完成一次真实通勤计算后，这里会显示成员和餐厅位置。</Text></View>;
}

const styles = StyleSheet.create({
  mapFrame: { width: '100%', height: 190, flexShrink: 0, borderRadius: 19, overflow: 'hidden', backgroundColor: '#EDEBE6' },
  webView: { flex: 1, backgroundColor: '#EDEBE6' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 20, borderWidth: 1, borderColor: '#DDDAD2' },
  emptyTitle: { color: colors.text, fontSize: 13, fontWeight: '800' },
  emptyBody: { color: colors.muted, fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 5 },
});
