import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

const tabs = [
  ['index', '首页', '🏠'],
  ['choose', '聚餐选址', '📍'],
  ['direct', '测算', '🛣️'],
  ['profile', '我的', '👤'],
] as const;

export default function TabLayout() {
  return <Tabs screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: colors.brand,
    tabBarInactiveTintColor: colors.faint,
    tabBarStyle: { height: Platform.OS === 'ios' ? 84 : 68, paddingTop: 7, paddingBottom: Platform.OS === 'ios' ? 21 : 8, backgroundColor: 'rgba(255,255,255,0.97)', borderTopColor: colors.line, shadowColor: '#20242C', shadowOpacity: .06, shadowRadius: 12 },
    tabBarItemStyle: { alignItems: 'center', justifyContent: 'center' },
    tabBarIconStyle: { width: 28, height: 27, margin: 0 },
    tabBarLabelStyle: { fontSize: 10, lineHeight: 14, fontWeight: '700', marginTop: 1 },
  }}>
    {tabs.map(([name, title, emoji]) => <Tabs.Screen key={name} name={name} options={{ title, tabBarIcon: ({ focused }) => <EmojiTabIcon emoji={emoji} focused={focused} /> }} />)}
  </Tabs>;
}

function EmojiTabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <View style={styles.tabEmojiBox}><Text style={[styles.tabEmoji, !focused && styles.tabEmojiInactive]}>{emoji}</Text></View>;
}

const styles = StyleSheet.create({
  tabEmojiBox: { width: 28, height: 27, alignItems: 'center', justifyContent: 'center' },
  tabEmoji: { fontSize: 20, lineHeight: 24, textAlign: 'center' },
  tabEmojiInactive: { opacity: .56 },
});
