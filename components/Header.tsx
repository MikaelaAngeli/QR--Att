import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { useTheme } from '@/lib/theme';

type Props = { title: string };

export default function Header({ title }: Props) {
  const { primary, tint } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.logoCircle, { backgroundColor: tint }]}>
        <MaterialIcons name="qr-code-scanner" size={36} color={primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});
