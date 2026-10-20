import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/lib/auth';
import {
  createManagedEvent,
  deleteManagedAttendance,
  deleteManagedEvent,
  getAdminDashboardData,
  updateManagedAttendance,
  updateManagedEvent,
  updateManagedProfile,
  type AdminDashboardData,
} from '@/lib/admin';
import { getProfile, type Role } from '@/lib/profiles';
import { useTheme, type AppColors } from '@/lib/theme';

type Section = 'users' | 'events' | 'attendance';

const ROLES: Role[] = ['student', 'teacher', 'admin'];

export default function AdminScreen() {
  const { user } = useAuth();
  const { primary, colors } = useTheme();
  const styles = createStyles(colors, primary);
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [section, setSection] = useState<Section>('users');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [profileDrafts, setProfileDrafts] = useState<Record<string, { name: string; role: Role }>>({});
  const [eventDrafts, setEventDrafts] = useState<Record<string, string>>({});
  const [attendanceDrafts, setAttendanceDrafts] = useState<Record<string, string>>({});
  const [newEventCode, setNewEventCode] = useState('');
  const [newEventTitle, setNewEventTitle] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await getAdminDashboardData();
      setData(next);
    } catch (loadError) {
      setError(errorMessage(loadError));
      throw loadError;
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setAuthorized(false);
      setChecking(true);
      setLoading(true);

      const verifyAndLoad = async () => {
        if (!user) {
          router.replace('/login');
          return;
        }

        const profile = await getProfile(user.id);
        if (!active) return;
        if (profile?.role !== 'admin') {
          router.replace('/(tabs)');
          return;
        }

        setAuthorized(true);
        setChecking(false);
        try {
          const next = await getAdminDashboardData();
          if (active) {
            setData(next);
            setError(null);
          }
        } catch (loadError) {
          if (active) setError(errorMessage(loadError));
        } finally {
          if (active) setLoading(false);
        }
      };

      void verifyAndLoad().catch((verifyError) => {
        if (active) {
          setError(errorMessage(verifyError));
          setChecking(false);
          setLoading(false);
        }
      });

      return () => {
        active = false;
      };
    }, [router, user])
  );

  const runAction = async (
    id: string,
    action: () => Promise<void>,
    successMessage: string
  ) => {
    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      await action();
      await refresh();
      setMessage(successMessage);
    } catch (actionError) {
      setError(errorMessage(actionError));
    } finally {
      setBusyId(null);
    }
  };

  if (checking || !authorized) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>SYSTEM MANAGEMENT</Text>
        <Text style={styles.title}>Administrator</Text>
        <Text style={styles.subtitle}>Manage users, events, and attendance records.</Text>
      </View>

      <View style={styles.metrics}>
        <Metric label="USERS" value={data?.profiles.length ?? 0} styles={styles} />
        <Metric label="EVENTS" value={data?.events.length ?? 0} styles={styles} />
        <Metric label="CHECK-INS" value={data?.totalAttendance ?? 0} styles={styles} />
      </View>

      <View style={styles.sections}>
        {(['users', 'events', 'attendance'] as const).map((item) => (
          <Pressable
            key={item}
            onPress={() => setSection(item)}
            style={[styles.sectionButton, section === item && styles.sectionButtonActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: section === item }}
          >
            <Text style={[styles.sectionButtonText, section === item && styles.sectionButtonTextActive]}>
              {item === 'users' ? 'Users' : item === 'events' ? 'Events' : 'Attendance'}
            </Text>
          </Pressable>
        ))}
      </View>

      {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {message && <Text style={styles.message}>{message}</Text>}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={primary} />
          <Text style={styles.muted}>Loading system records...</Text>
        </View>
      ) : section === 'users' ? (
        <View>
          <Text style={styles.sectionTitle}>Manage users</Text>
          {(data?.profiles ?? []).map((profile) => {
            const draft = profileDrafts[profile.id] ?? {
              name: profile.full_name ?? '',
              role: profile.role,
            };
            const isCurrentUser = profile.id === user?.id;
            return (
              <View key={profile.id} style={styles.card}>
                <Text style={styles.email}>{profile.email}</Text>
                <TextInput
                  style={styles.input}
                  value={draft.name}
                  onChangeText={(name) =>
                    setProfileDrafts((current) => ({
                      ...current,
                      [profile.id]: { ...draft, name },
                    }))
                  }
                  placeholder="Full name"
                  placeholderTextColor={colors.textSecondary}
                  editable={busyId !== profile.id}
                />
                <Text style={styles.fieldLabel}>ACCOUNT ROLE</Text>
                <View style={styles.roleRow}>
                  {ROLES.map((role) => (
                    <Pressable
                      key={role}
                      onPress={() =>
                        setProfileDrafts((current) => ({
                          ...current,
                          [profile.id]: { ...draft, role },
                        }))
                      }
                      disabled={isCurrentUser || busyId === profile.id}
                      style={[
                        styles.roleOption,
                        draft.role === role && styles.roleOptionSelected,
                        isCurrentUser && styles.disabled,
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: draft.role === role, disabled: isCurrentUser }}
                    >
                      <Text style={[styles.roleText, draft.role === role && styles.roleTextSelected]}>
                        {role}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {isCurrentUser && <Text style={styles.muted}>Your own role cannot be changed here.</Text>}
                <Pressable
                  style={styles.actionButton}
                  disabled={busyId === profile.id}
                  onPress={() =>
                    void runAction(
                      profile.id,
                      () => updateManagedProfile(profile.id, draft.name, draft.role),
                      'User profile saved.'
                    )
                  }
                >
                  <Text style={styles.actionText}>
                    {busyId === profile.id ? 'Saving...' : 'Save user'}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : section === 'events' ? (
        <View>
          <Text style={styles.sectionTitle}>Manage events</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>CREATE EVENT</Text>
            <TextInput
              style={styles.input}
              value={newEventTitle}
              onChangeText={setNewEventTitle}
              placeholder="Event title"
              placeholderTextColor={colors.textSecondary}
            />
            <TextInput
              style={styles.input}
              value={newEventCode}
              onChangeText={setNewEventCode}
              placeholder="Event code"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
            />
            <Pressable
              style={styles.actionButton}
              disabled={busyId === 'create-event' || !newEventTitle.trim() || !newEventCode.trim()}
              onPress={() =>
                void runAction('create-event', async () => {
                  await createManagedEvent(newEventCode, newEventTitle);
                  setNewEventCode('');
                  setNewEventTitle('');
                }, 'Event created.')
              }
            >
              <Text style={styles.actionText}>
                {busyId === 'create-event' ? 'Creating...' : 'Create event'}
              </Text>
            </Pressable>
          </View>
          {(data?.events ?? []).map((event) => (
            <View key={event.id} style={styles.card}>
              <Text style={styles.fieldLabel}>{event.event_code}</Text>
              <TextInput
                style={styles.input}
                value={eventDrafts[event.id] ?? event.title}
                onChangeText={(title) =>
                  setEventDrafts((current) => ({ ...current, [event.id]: title }))
                }
                placeholder="Event title"
                placeholderTextColor={colors.textSecondary}
                editable={busyId !== event.id}
              />
              <Text style={styles.muted}>
                {event.start_time ? `Starts ${new Date(event.start_time).toLocaleString()}` : 'No start time set'}
              </Text>
              <View style={styles.actionRow}>
                <Pressable
                  style={[styles.actionButton, styles.actionButtonHalf]}
                  disabled={busyId === event.id}
                  onPress={() =>
                    void runAction(
                      event.id,
                      () => updateManagedEvent(event.id, eventDrafts[event.id] ?? event.title),
                      'Event updated.'
                    )
                  }
                >
                  <Text style={styles.actionText}>{busyId === event.id ? 'Saving...' : 'Save title'}</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.dangerButton]}
                  disabled={busyId === event.id}
                  onPress={() =>
                    Alert.alert('Delete event?', 'This also removes attendance records for this event.', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () =>
                          void runAction(
                            event.id,
                            () => deleteManagedEvent(event.id),
                            'Event deleted.'
                          ),
                      },
                    ])
                  }
                >
                  <Text style={styles.actionText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View>
          <Text style={styles.sectionTitle}>Overall attendance</Text>
          <Text style={styles.muted}>
            Showing the latest {data?.attendance.length ?? 0} of {data?.totalAttendance ?? 0} check-ins.
          </Text>
          {(data?.attendance ?? []).map((record) => (
            <View key={record.id} style={styles.card}>
              <Text style={styles.email}>{record.student_name || record.student_email || record.student_id}</Text>
              <Text style={styles.muted}>{record.event_title} {record.event_code ? `(${record.event_code})` : ''}</Text>
              <TextInput
                style={styles.input}
                value={attendanceDrafts[record.id] ?? record.scanned_at}
                onChangeText={(scannedAt) =>
                  setAttendanceDrafts((current) => ({ ...current, [record.id]: scannedAt }))
                }
                placeholder="Attendance timestamp (ISO date/time)"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                editable={busyId !== record.id}
              />
              <View style={styles.actionRow}>
                <Pressable
                  style={[styles.actionButton, styles.actionButtonHalf]}
                  disabled={busyId === record.id}
                  onPress={() =>
                    void runAction(
                      record.id,
                      () => updateManagedAttendance(record.id, attendanceDrafts[record.id] ?? record.scanned_at),
                      'Attendance record corrected.'
                    )
                  }
                >
                  <Text style={styles.actionText}>{busyId === record.id ? 'Saving...' : 'Save time'}</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.dangerButton]}
                  disabled={busyId === record.id}
                  onPress={() =>
                    Alert.alert('Delete attendance record?', 'This cannot be undone.', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () =>
                          void runAction(
                            record.id,
                            () => deleteManagedAttendance(record.id),
                            'Attendance record deleted.'
                          ),
                      },
                    ])
                  }
                >
                  <Text style={styles.actionText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function Metric({
  label,
  value,
  styles,
}: {
  label: string;
  value: number;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An unexpected error occurred.';
}

function createStyles(colors: AppColors, primary: string) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center' },
    content: { padding: 24, paddingBottom: 40 },
    header: { marginBottom: 18 },
    eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginBottom: 8 },
    title: { color: colors.textPrimary, fontSize: 27, fontWeight: '700', marginBottom: 6 },
    subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
    metrics: { flexDirection: 'row', gap: 8, marginBottom: 18 },
    metric: { alignItems: 'center', backgroundColor: colors.card, flex: 1, padding: 12 },
    metricValue: { color: primary, fontSize: 20, fontWeight: '800' },
    metricLabel: { color: colors.textSecondary, fontSize: 9, fontWeight: '700', letterSpacing: 0.8, marginTop: 3 },
    sections: { flexDirection: 'row', marginBottom: 18 },
    sectionButton: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 2, flex: 1, paddingBottom: 10 },
    sectionButtonActive: { borderBottomColor: primary },
    sectionButtonText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
    sectionButtonTextActive: { color: primary, fontWeight: '800' },
    sectionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 10, marginTop: 4 },
    card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, marginBottom: 12, padding: 14 },
    email: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 8 },
    input: { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1, color: colors.textPrimary, fontSize: 13, marginTop: 8, paddingHorizontal: 10, paddingVertical: 10 },
    fieldLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 0.9, marginTop: 6 },
    roleRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
    roleOption: { alignItems: 'center', backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1, flex: 1, paddingVertical: 8 },
    roleOptionSelected: { backgroundColor: colors.accentSurface, borderColor: primary },
    roleText: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
    roleTextSelected: { color: primary, fontWeight: '800' },
    disabled: { opacity: 0.55 },
    actionButton: { alignItems: 'center', backgroundColor: primary, justifyContent: 'center', marginTop: 12, minHeight: 40, paddingHorizontal: 14 },
    actionButtonHalf: { flex: 1 },
    dangerButton: { backgroundColor: '#B3261E', flex: 1 },
    actionText: { color: colors.textOnPrimary, fontSize: 12, fontWeight: '700' },
    actionRow: { flexDirection: 'row', gap: 8 },
    muted: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 6 },
    error: { color: '#B3261E', fontSize: 13, marginBottom: 10 },
    message: { color: primary, fontSize: 13, marginBottom: 10 },
    loading: { alignItems: 'center', padding: 28 },
  });
}
