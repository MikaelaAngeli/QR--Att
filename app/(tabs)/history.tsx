import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import { getTeacherEventAttendance, type TeacherEventAttendance } from '@/lib/attendance';
import { getAttendanceHistory, type AttendanceRecord } from '@/lib/database';
import { getProfile } from '@/lib/profiles';
import { useTheme } from '@/lib/theme';

export default function HistoryScreen() {
  const { user } = useAuth();
  const { primary, tint } = useTheme();
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [teacherEvents, setTeacherEvents] = useState<TeacherEventAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const profile = await getProfile(user.id);
    const currentRole = profile?.role ?? 'student';
    setRole(currentRole);
    if (currentRole === 'teacher') { setTeacherEvents(await getTeacherEventAttendance(user.id)); setRecords([]); }
    else { setRecords(await getAttendanceHistory(user.id)); setTeacherEvents([]); }
    setLoading(false);
  }, [user]);

  useFocusEffect(useCallback(() => { void loadHistory(); }, [loadHistory]));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{role === 'teacher' ? 'Event Attendance' : 'Attendance History'}</Text>
        <Text style={styles.subtitle}>{role === 'teacher' ? 'All scans for your events' : 'Your verified scans'}</Text>
      </View>

      {loading ? (
        <View style={styles.empty}><Text style={styles.subtitle}>Loading records...</Text></View>
      ) : role === 'teacher' ? (
        teacherEvents.length === 0 ? (
          <View style={styles.emptyCard}><Text style={styles.emptyText}>No events created yet.</Text><Text style={styles.emptySub}>Create an event in the Create tab to see attendance here.</Text></View>
        ) : (
          <FlatList
            data={teacherEvents}
            keyExtractor={(item) => item.eventId}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.eventTitle}>{item.title}</Text>
                  <View style={[styles.badge, { backgroundColor: tint }]}><Text style={[styles.badgeText, { color: primary }]}>{item.attendeeCount}</Text></View>
                </View>
                <Text style={styles.eventMeta}>{item.eventCode}</Text>
                <View style={styles.divider} />
                {item.attendees.length === 0 ? (
                  <Text style={styles.eventMeta}>No attendees yet</Text>
                ) : (
                  item.attendees.map((attendee) => (
                    <View key={`${attendee.studentId}-${attendee.scannedAt}`} style={styles.attendeeRow}>
                      <View style={styles.dot} />
                      <Text style={styles.eventMeta}>{attendee.studentName || shortId(attendee.studentId)}</Text>
                      <Text style={styles.time}>{formatDate(attendee.scannedAt)}</Text>
                    </View>
                  ))
                )}
              </View>
            )}
          />
        )
      ) : records.length === 0 ? (
        <View style={styles.emptyCard}><Text style={styles.emptyText}>No records yet</Text><Text style={styles.emptySub}>Scan a QR code to register your attendance.</Text></View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.eventTitle}>{item.eventTitle || item.eventId || 'Untitled event'}</Text>
                <View style={[styles.check, { backgroundColor: primary }]}><Text style={styles.checkText}>✓</Text></View>
              </View>
              <Text style={styles.eventMeta}>{item.eventId}</Text>
              <Text style={styles.time}>{formatDate(item.scannedAt)}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
function shortId(id: string) { return id ? `…${id.slice(-8)}` : 'unknown'; }
function formatDate(iso: string) { return new Date(iso).toLocaleString(); }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20, paddingTop: 20 },
  header: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: 0.1, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginTop: 24,
  },
  emptyText: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 18 },
  list: { paddingBottom: 32, paddingTop: 4 },
  card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  eventTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, flex: 1, letterSpacing: -0.2, marginRight: 8 },
  eventMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, flex: 1 },
  time: { fontSize: 11, color: COLORS.textSecondary, marginTop: 6, fontWeight: '500' },
  badge: { backgroundColor: COLORS.surface, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, minWidth: 28, alignItems: 'center' },
  badgeText: { color: COLORS.primary, fontSize: 12, fontWeight: '800' },
  check: { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  checkText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10, opacity: 0.7 },
  attendeeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.textSecondary },
});
