import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View, type ColorValue } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { colors } from '@/constants/theme';

const tabs = [
  ['index', '首页', 'point.3.connected'],
  ['choose', '聚餐选址', 'location.viewfinder'],
  ['direct', '指定测算', 'function'],
  ['profile', '我的', 'person'],
] as const;

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.brand,
      tabBarInactiveTintColor: colors.faint,
      tabBarStyle: { height: Platform.OS === 'ios' ? 84 : 66, paddingTop: 7, paddingBottom: Platform.OS === 'ios' ? 22 : 8, backgroundColor: 'rgba(255,255,255,0.96)', borderTopColor: colors.line },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
    }}>
      {tabs.map(([name, title, icon]) => <Tabs.Screen key={name} name={name} options={{ title, tabBarIcon: ({ color }) => name === 'profile' ? <PersonTabIcon color={color} /> : <AppIcon name={icon} size={21} color={color} /> }} />)}
    </Tabs>
  );
}

function PersonTabIcon({ color }: { color: ColorValue }) {
  return <View style={styles.personIcon}><View style={[styles.personHead, { backgroundColor: color }]} /><View style={[styles.personShoulders, { backgroundColor: color }]} /></View>;
}

const styles = StyleSheet.create({
  personIcon: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', gap: 2 },
  personHead: { width: 7, height: 7, borderRadius: 4 },
  personShoulders: { width: 15, height: 8, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
});
