import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';

import { useTheme, type AppColors } from '@/lib/theme';

export default function Index() {
  const { primary, colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <View style={[styles.brandMark, { backgroundColor: primary }]}>
            <Ionicons name="qr-code-outline" size={22} color={colors.textOnPrimary} />
          </View>
          <View>
            <Text style={styles.brandName}>BAGATA</Text>
            <Text style={styles.brandCaption}>ATTENDANCE PORTAL</Text>
          </View>
        </View>

        <View style={styles.welcome}>
          <Text style={styles.overline}>SCHOOL EVENTS</Text>
          <Text style={styles.heading}>Attendance,{'\n'}made straightforward.</Text>
          <View style={styles.accentRule} />
          <Text style={styles.intro}>
            Check in to campus activities and keep a clear record of your attendance.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/scan')}
          style={({ pressed }) => [
            styles.scanAction,
            { backgroundColor: primary, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <View style={styles.scanActionCopy}>
            <Text style={styles.scanActionLabel}>ATTENDANCE CHECK-IN</Text>
            <Text style={styles.scanActionTitle}>Scan an event QR</Text>
            <Text style={styles.scanActionSub}>Use your camera to record your visit.</Text>
          </View>
          <View style={styles.scanActionIcon}>
            <Ionicons name="arrow-forward" size={20} color={colors.tertiary} />
          </View>
          <View style={styles.goldRule} />
        </Pressable>

        <View style={styles.toolsHeading}>
          <Text style={styles.sectionTitle}>YOUR TOOLS</Text>
          <View style={styles.headingRule} />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/history')}
          style={({ pressed }) => [styles.toolRow, pressed && styles.pressed]}
        >
          <Ionicons name="time-outline" size={21} color={primary} />
          <View style={styles.toolCopy}>
            <Text style={styles.toolTitle}>Attendance history</Text>
            <Text style={styles.toolSub}>Review your recorded check-ins</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/profile')}
          style={({ pressed }) => [styles.toolRow, styles.lastToolRow, pressed && styles.pressed]}
        >
          <Ionicons name="person-outline" size={21} color={primary} />
          <View style={styles.toolCopy}>
            <Text style={styles.toolTitle}>Account profile</Text>
            <Text style={styles.toolSub}>Update your details and preferences</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>

        <Text style={styles.footer}>BAGATA SCHOOL ATTENDANCE</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
 return StyleSheet.create({
  container: { flex: 1,
     backgroundColor: colors.background },

  content: { paddingHorizontal: 24, 
    paddingTop: 20, 
    paddingBottom: 28 },

  brandRow: { alignItems: 'center', 
    flexDirection: 'row', 
    gap: 11, 
    marginBottom: 20 },

  brandMark: { 
    alignItems: 'center', 
    height: 42, 
    justifyContent: 'center', 
    width: 42 },

  brandName: { 
    color: colors.textPrimary, 
    fontSize: 15, fontWeight: '800',
     letterSpacing: 1 },

  brandCaption: { 
    color: colors.textSecondary, 
    fontSize: 9, fontWeight: '700',
     letterSpacing: 1.1,
      marginTop: 5 },

  welcome: { marginBottom: 10 },

  overline: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },

  heading: { color: colors.textPrimary, fontSize: 31, fontWeight: '700', letterSpacing: -0.8, lineHeight: 38 },

  accentRule: { backgroundColor: colors.accent, height: 3, marginTop: 17, width: 42 },
  
  intro: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 13, maxWidth: 330 },

  scanAction: { alignItems: 'center', flexDirection: 'row', minHeight: 112, overflow: 'hidden', padding: 18, position: 'relative' },

  scanActionCopy: { flex: 1 },

  scanActionLabel: { color: colors.textOnPrimary, fontSize: 9, fontWeight: '700', letterSpacing: 1.2, opacity: 0.8 },

  scanActionTitle: { color: colors.textOnPrimary, fontSize: 18, fontWeight: '700', marginTop: 7 },

  scanActionSub: { color: colors.textOnPrimary, fontSize: 12, marginTop: 4, opacity: 0.85 },

  scanActionIcon: { alignItems: 'center', backgroundColor: colors.accentSurface, height: 38, justifyContent: 'center', marginLeft: 12, width: 38 },

  goldRule: { backgroundColor: colors.accent, bottom: 0, left: 0, position: 'absolute', top: 0, width: 4 },

  toolsHeading: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 5, marginTop: 32 },

  sectionTitle: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },

  headingRule: { backgroundColor: colors.border, flex: 1, height: 1},

  toolRow: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', minHeight: 70, paddingVertical: 12 },

  lastToolRow: { borderBottomWidth: 0 },


  toolCopy: { flex: 1, marginLeft: 14 },

  toolTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },

  toolSub: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },

  pressed: { opacity: 0.65 },

  footer: { color: colors.textSecondary, fontSize: 9, fontWeight: '600', letterSpacing: 1.1, marginTop: 28, textAlign: 'center' },
 });
}
