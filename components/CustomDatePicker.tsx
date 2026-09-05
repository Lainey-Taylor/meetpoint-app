import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day) : new Date();
}

function formatDate(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

export function CustomDatePicker({ value, active, onChange }: { value: string; active: boolean; onChange: (value: string) => void }) {
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState(() => parseDate(value));

  const open = () => { setDraft(parseDate(value)); setVisible(true); };
  const handleAndroidChange = (event: DateTimePickerEvent, date?: Date) => {
    setVisible(false);
    if (event.type === 'set' && date) onChange(formatDate(date));
  };

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel="选择自定义日期" onPress={open} style={[styles.trigger, active && styles.triggerActive]}>
        <Text style={[styles.triggerText, active && styles.triggerTextActive]}>{active ? value.slice(5).replace('-', '/') : '自定义'}</Text>
      </Pressable>
      {Platform.OS === 'android' && visible ? <DateTimePicker value={draft} mode="date" minimumDate={new Date()} onChange={handleAndroidChange} /> : null}
      {Platform.OS === 'ios' ? (
        <Modal animationType="fade" transparent visible={visible} onRequestClose={() => setVisible(false)}>
          <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
            <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
              <View style={styles.sheetHead}>
                <Pressable onPress={() => setVisible(false)}><Text style={styles.cancel}>取消</Text></Pressable>
                <Text style={styles.sheetTitle}>选择聚餐日期</Text>
                <Pressable onPress={() => { onChange(formatDate(draft)); setVisible(false); }}><Text style={styles.done}>完成</Text></Pressable>
              </View>
              <DateTimePicker value={draft} mode="date" display="spinner" minimumDate={new Date()} locale="zh-CN" onChange={(_, date) => date && setDraft(date)} />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.subtle, borderWidth: 1, borderColor: colors.subtle },
  triggerActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  triggerText: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  triggerTextActive: { color: '#FFFFFF', fontWeight: '700' },
  backdrop: { flex: 1, backgroundColor: 'rgba(17,24,39,.32)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 26 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8 },
  sheetTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  cancel: { color: colors.muted, fontSize: 14 },
  done: { color: colors.brand, fontSize: 14, fontWeight: '800' },
});
