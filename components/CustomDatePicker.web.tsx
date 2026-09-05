import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

export function CustomDatePicker({ value, active, onChange }: { value: string; active: boolean; onChange: (value: string) => void }) {
  const input = useRef<HTMLInputElement>(null);

  return (
    <View style={styles.wrap}>
      <Pressable accessibilityRole="button" accessibilityLabel="选择自定义日期" onPress={() => input.current?.showPicker()} style={[styles.trigger, active && styles.triggerActive]}>
        <Text style={[styles.triggerText, active && styles.triggerTextActive]}>{active ? value.slice(5).replace('-', '/') : '自定义'}</Text>
      </Pressable>
      <input ref={input} aria-label="自定义聚餐日期" type="date" min={new Date().toLocaleDateString('sv-SE')} value={value} onChange={(event) => onChange(event.currentTarget.value)} style={styles.nativeInput as React.CSSProperties} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  trigger: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.subtle, borderWidth: 1, borderColor: colors.subtle },
  triggerActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  triggerText: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  triggerTextActive: { color: '#FFFFFF', fontWeight: '700' },
  nativeInput: { position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' },
});
