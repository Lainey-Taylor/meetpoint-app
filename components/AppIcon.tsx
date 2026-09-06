import { StyleSheet, Text, type ColorValue, type StyleProp, type TextStyle } from 'react-native';

const glyphs: Record<string, string> = {
  'fork.knife': '♨', 'person.2.fill': '●●', 'plus.circle.fill': '＋', scope: '◎',
  'arrow.right': '→', 'location.viewfinder': '◎', function: 'ƒx', person: '●',
  'mappin.and.ellipse': '📍', magnifyingglass: '⌕', mappin: '📍', 'arrow.turn.up.right': '↗',
  'xmark.circle.fill': '×', plus: '+', clock: '◷', 'location.magnifyingglass': '⌖',
  'arrow.triangle.branch': '⑂', 'checkmark.seal.fill': '✓', map: '⌘', 'map.fill': '⌘',
  'gearshape.fill': '⚙', 'building.2.fill': '▥', 'house.fill': '⌂', 'chevron.right': '›',
  'person.badge.plus': '♙+',
  'point.3.connected': '⌖',
  'shield.fill': '◆', 'questionmark.circle.fill': '?', 'chevron.left': '‹',
  'square.and.arrow.up': '↥', 'exclamationmark.triangle.fill': '!', ellipsis: '•••',
  celebration: '✦', calendar: '▣', history: '↶', sliders: '≡', route: '⑂', star: '★',
  train: '▣', car: '▰', bike: '♢', scooter: '♧', walk: '⚑', 'add-person': '♙+',
};

export function AppIcon({ name, size = 20, color, style }: { name: string; size?: number; color: ColorValue; style?: StyleProp<TextStyle> }) {
  return <Text accessibilityElementsHidden style={[styles.icon, { color, fontSize: size, lineHeight: size + 2 }, style]}>{glyphs[name] || '•'}</Text>;
}

const styles = StyleSheet.create({ icon: { fontWeight: '800', textAlign: 'center' } });
