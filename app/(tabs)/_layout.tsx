import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View, type ColorValue } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { colors } from '@/constants/theme';

const tabs = [
  ['index', '首页', 'house.fill'],
  ['choose', '聚餐选址', 'mappin.and.ellipse'],
  ['direct', '测算', 'route'],
  ['profile', '我的', 'person'],
] as const;

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.brand,
      tabBarInactiveTintColor: colors.faint,
      tabBarStyle: { height: Platform.OS === 'ios' ? 84 : 66, paddingTop: 7, paddingBottom: Platform.OS === 'ios' ? 22 : 8, backgroundColor: 'rgba(255,255,255,0.96)', borderTopColor: colors.line, shadowColor: '#20242C', shadowOpacity: .06, shadowRadius: 12 },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
    }}>
      {tabs.map(([name, title, icon]) => <Tabs.Screen key={name} name={name} options={{ title, tabBarIcon: ({ color }) => name === 'profile' ? <PersonTabIcon color={color} /> : <View style={styles.iconBox}><AppIcon name={icon} size={23} color={color} style={styles.lineIcon} /></View> }} />)}
    </Tabs>
  );
}

function PersonTabIcon({ color }: { color: ColorValue }) {
  return <View style={styles.personIcon}><View style={[styles.personHead, { borderColor: color }]} /><View style={[styles.personShoulders, { borderColor: color }]} /></View>;
}

const styles = StyleSheet.create({
  iconBox: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }, lineIcon: { fontWeight: '600' },
  personIcon: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', gap: 2 },
  personHead: { width: 8, height: 8, borderRadius: 4, borderWidth: 2, backgroundColor: 'transparent' },
  personShoulders: { width: 17, height: 9, borderWidth: 2, borderBottomWidth: 0, borderTopLeftRadius: 9, borderTopRightRadius: 9, backgroundColor: 'transparent' },
});
