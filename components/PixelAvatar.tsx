import { StyleSheet, View } from 'react-native';

const palettes = [
  { background: '#DCEEFF', hair: '#244A73', shirt: '#3F7AC4', skin: '#FFD0B5' },
  { background: '#F0E7FF', hair: '#543E6E', shirt: '#8B68B8', skin: '#F4C6A8' },
  { background: '#E2F5EF', hair: '#244F46', shirt: '#37917A', skin: '#EFC5A7' },
  { background: '#E7F0F8', hair: '#314D68', shirt: '#5B83A8', skin: '#FFD2B5' },
];

export function PixelAvatar({ size = 32, variant = 0 }: { size?: number; variant?: number }) {
  const palette = palettes[variant % palettes.length];
  const unit = size / 32;
  const scaled = (value: number) => Math.round(value * unit);

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.frame, { width: size, height: size, borderRadius: scaled(10), backgroundColor: palette.background }]}> 
      <View style={[styles.body, { width: scaled(19), height: scaled(9), left: scaled(7), bottom: scaled(3), backgroundColor: palette.shirt }]} />
      <View style={[styles.face, { width: scaled(15), height: scaled(15), left: scaled(9), top: scaled(6), backgroundColor: palette.skin }]} />
      <View style={[styles.hairTop, { width: scaled(17), height: scaled(5), left: scaled(8), top: scaled(5), backgroundColor: palette.hair }]} />
      <View style={[styles.hairSide, { width: scaled(4), height: scaled(9), left: scaled(8), top: scaled(8), backgroundColor: palette.hair }]} />
      <View style={[styles.eye, { left: scaled(12), top: scaled(12), backgroundColor: palette.hair }]} />
      <View style={[styles.eye, { left: scaled(19), top: scaled(12), backgroundColor: palette.hair }]} />
      <View style={[styles.smile, { width: scaled(6), height: scaled(2), left: scaled(14), top: scaled(17), backgroundColor: '#B15B4A' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { position: 'relative', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.72)' },
  body: { position: 'absolute', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  face: { position: 'absolute' },
  hairTop: { position: 'absolute' },
  hairSide: { position: 'absolute' },
  eye: { position: 'absolute', width: 2, height: 2 },
  smile: { position: 'absolute' },
});
