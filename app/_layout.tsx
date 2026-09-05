import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { MeetPointProvider } from '@/state/MeetPointContext';
import { colors } from '@/constants/theme';

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  return (
    <MeetPointProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="results" options={{ presentation: 'card' }} />
      </Stack>
    </MeetPointProvider>
  );
}
