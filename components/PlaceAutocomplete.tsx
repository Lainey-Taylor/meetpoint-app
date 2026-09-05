import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { colors } from '@/constants/theme';
import { suggestPlaces } from '@/services/meetpoint-api';
import type { Place } from '@/types/meetpoint';

export function PlaceAutocomplete({ city, value, kind = 'place', placeholder, onChangeText, onSelect }: {
  city: string;
  value: string;
  kind?: 'place' | 'restaurant' | 'restaurant-or-address';
  placeholder: string;
  onChangeText: (text: string) => void;
  onSelect: (place: Place) => void;
}) {
  const [items, setItems] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const skipNext = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    if (skipNext.current) { skipNext.current = false; return; }
    const timer = setTimeout(async () => {
      if (value.trim().length < 2) { setItems([]); return; }
      setLoading(true);
      try { setItems((await suggestPlaces(city, value, kind)).slice(0, 5)); }
      catch { setItems([]); }
      finally { setLoading(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [city, kind, value]);

  return (
    <View style={styles.wrap}>
      <View style={styles.inputRow}>
        <AppIcon name={kind === 'restaurant' ? 'magnifyingglass' : 'mappin.and.ellipse'} size={16} color={colors.brand} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.faint}
          style={styles.input}
          returnKeyType="search"
        />
        {loading ? <ActivityIndicator color={colors.brand} size="small" /> : null}
      </View>
      {items.length ? (
        <View style={styles.list}>
          {items.map((item, index) => (
            <Pressable key={item.id || `${item.name}-${index}`} onPress={() => { skipNext.current = true; setItems([]); onSelect(item); }} style={styles.item}>
              <View style={styles.pin}><AppIcon name="mappin" size={14} color={colors.brand} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.address} numberOfLines={1}>{[item.district, item.address].filter(Boolean).join(' · ')}</Text>
              </View>
              <AppIcon name="arrow.turn.up.right" size={13} color={colors.faint} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', zIndex: 4 },
  inputRow: { minHeight: 45, borderRadius: 13, backgroundColor: '#F7F7FA', borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, paddingVertical: 10, fontSize: 13, color: colors.text },
  list: { marginTop: 5, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.line, overflow: 'hidden', ...{ shadowColor: '#111827', shadowOpacity: .1, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 5 } },
  item: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  pin: { width: 28, height: 28, borderRadius: 9, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.text, fontSize: 13, fontWeight: '700' },
  address: { color: colors.muted, fontSize: 11, marginTop: 3 },
});
