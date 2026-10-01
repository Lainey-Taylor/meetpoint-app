import { StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';

export function BackChevron() {
  return <View style={styles.chevron} />;
}

const styles = StyleSheet.create({
  chevron: {
    width: 13,
    height: 13,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderColor: colors.text,
    borderBottomLeftRadius: 2,
    transform: [{ rotate: '45deg' }, { translateX: 2 }],
  },
});
