import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import AppButton from '@/components/AppButton';
import { createEvent } from '@/lib/database';
import { useAuth } from '@/lib/auth';
import { getProfile } from '@/lib/profiles';
import { useTheme, type AppColors } from '@/lib/theme';

function toLocalISO(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  );
}

function formatDateTime(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' });
  return `${month} ${pad(date.getDate())}, ${date.getFullYear()} at ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

const QUICK_END_OPTIONS = [
  { label: '+30 min', ms: 30 * 60 * 1000 },
  { label: '+1 hour', ms: 60 * 60 * 1000 },
  { label: '+2 hours', ms: 2 * 60 * 60 * 1000 },
];

type EditTarget = 'start' | 'end';

export default function TeacherScreen() {
  const { user } = useAuth();
  const { primary, tint, colors } = useTheme();
  const styles = createStyles(colors);
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [title, setTitle] = useState('');
  const [eventId, setEventId] = useState('');
  const [startDate, setStartDate] = useState(() => new Date());
  const [endDate, setEndDate] = useState(
    () => new Date(Date.now() + 60 * 60 * 1000)
  );
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editingPart, setEditingPart] = useState<'date' | 'time'>('date');
  const [payload, setPayload] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isAndroid = Platform.OS === 'android';

  useEffect(() => {
    let active = true;
    setAuthorized(false);

    const verifyRole = async () => {
      if (!user) {
        router.replace('/login');
        return;
      }

      const profile = await getProfile(user.id);
      if (!active) return;

      if (profile?.role === 'teacher') {
        setAuthorized(true);
      } else {
        router.replace('/(tabs)');
      }
    };

    verifyRole().catch(() => {
      if (active) router.replace('/(tabs)');
    });

    return () => {
      active = false;
    };
  }, [router, user]);

  const openPicker = (target: EditTarget) => {
    setMessage(null);
    setEditTarget(target);
    setEditingPart('date');
  };

  const onPickerChange = (
    event: DateTimePickerEvent,
    selected?: Date
  ) => {
    if (!editTarget) return;
    if (event.type === 'dismissed' || !selected) {
      setEditTarget(null);
      setEditingPart('date');
      return;
    }

    const current = editTarget === 'start' ? startDate : endDate;
    const next = new Date(current);
    next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);

    if (editTarget === 'start') setStartDate(next);
    else setEndDate(next);

    if (isAndroid && editingPart === 'date') {
      setEditingPart('time');
    } else {
      setEditTarget(null);
      setEditingPart('date');
    }
  };

  const handleQuickEnd = (ms: number) => {
    setMessage(null);
    setEndDate(new Date(startDate.getTime() + ms));
  };

  const handleCreateEvent = async () => {
    if (!user) {
      setMessage('You must be signed in to create an event.');
      return;
    }

    const event = {
      eventId: eventId.trim(),
      title: title.trim(),
      start: toLocalISO(startDate),
      end: toLocalISO(endDate),
    };

    if (!event.eventId || !event.title) {
      setMessage('Event title and code are required.');
      return;
    }

    if (endDate.getTime() <= startDate.getTime()) {
      setMessage('End time must be after start time.');
      return;
    }

    const { error } = await createEvent(event);
    if (error) {
      setMessage(error);
      return;
    }

    setMessage('Event saved! Scan the QR with the Scan tab to test it.');
    const attendancePayload = {
      v: 1,
      event: event.eventId,
      title: event.title,
      start: event.start,
      end: event.end,
    };
    setPayload(JSON.stringify(attendancePayload));
  };

  if (!authorized) {
    return (
      <View style={[styles.container, styles.accessCheck]}>
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
        <Text style={styles.eyebrow}>TEACHER PORTAL</Text>
        <Text style={styles.title}>Create an event</Text>
        <Text style={styles.subtitle}>
          Set the details and schedule to generate a QR code for attendance.
        </Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.cardTitle}>Event details</Text>
        <Text style={styles.label}>Event title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Founders Day Assembly"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>Event code</Text>
        <TextInput
          style={styles.input}
          value={eventId}
          onChangeText={setEventId}
          placeholder="e.g. EVT-2026-0002"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Starts</Text>
        <PickerField
          value={formatDateTime(startDate)}
          icon="sunny-outline"
          onPress={() => openPicker('start')}
        />

        <Text style={styles.label}>Ends</Text>
        <PickerField
          value={formatDateTime(endDate)}
          icon="moon-outline"
          onPress={() => openPicker('end')}
        />
        <View style={styles.chipRow}>
          {QUICK_END_OPTIONS.map((option) => (
            <Pressable
              key={option.label}
              style={[styles.chip, { backgroundColor: tint }]}
              onPress={() => handleQuickEnd(option.ms)}
            >
              <Text style={[styles.chipText, { color: primary }]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.hint}>Quick set the end time from your start time.</Text>

        {message && <Text style={[styles.message, { color: primary }]}>{message}</Text>}

        <AppButton
          theme="primary"
          title="Create Event"
          icon="add-circle-outline"
          onPress={handleCreateEvent}
        />
      </View>

      {editTarget && (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={editTarget === 'start' ? startDate : endDate}
            mode={isAndroid ? editingPart : 'datetime'}
            display={isAndroid ? 'default' : 'spinner'}
            onChange={onPickerChange}
          />
        </View>
      )}

      {payload && (
        <View style={styles.resultCard}>
          <View style={[styles.resultIcon, { backgroundColor: tint }]}>
            <Ionicons name="qr-code-outline" size={22} color={colors.tertiary} />
          </View>
          <Text style={styles.resultHeading}>Your event QR is ready</Text>
          <Text style={styles.resultTitle}>
            Scan this code with the Scan tab to test attendance.
          </Text>
          <View style={styles.qrBox}>
            <QRCode
              value={payload}
              size={240}
              quietZone={16}
              color="#000000"
              backgroundColor="#FFFFFF"
              ecl="M"
            />
          </View>
          <Text style={styles.payloadText}>{payload}</Text>
        </View>
      )}
    </ScrollView>
  );
}

type PickerFieldProps = {
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

function PickerField({ value, icon, onPress }: PickerFieldProps) {
  const { primary, tint, colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.pickerField,
        pressed && { backgroundColor: tint },
      ]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={20} color={primary} />
      <Text style={styles.pickerValue}>{value}</Text>
      <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    accessCheck: { justifyContent: 'center', alignItems: 'center' },
    content: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40 },
    header: { marginBottom: 18 },
    eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginBottom: 8 },
    title: { fontSize: 27, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.5, marginBottom: 6 },
    subtitle: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
    formCard: { backgroundColor: colors.card, borderLeftColor: colors.accent, borderLeftWidth: 3, padding: 18, marginBottom: 16 },
    cardTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 6 },
    label: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, marginBottom: 6, marginTop: 14, letterSpacing: 0.7 },
    input: { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1, borderRadius: 3, paddingHorizontal: 13, paddingVertical: 13, fontSize: 15, color: colors.textPrimary },
    pickerField: { backgroundColor: colors.background, borderRadius: 3, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 13, flexDirection: 'row', alignItems: 'center' },
    pickerValue: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.textPrimary, marginHorizontal: 10 },
    chipRow: { flexDirection: 'row', marginTop: 8 },
    chip: { borderRadius: 3, paddingHorizontal: 11, paddingVertical: 8, marginRight: 8 },
    chipText: { fontSize: 12, fontWeight: '700' },
    hint: { fontSize: 12, color: colors.textSecondary, marginTop: 6, lineHeight: 17 },
    pickerContainer: { marginTop: 12, alignItems: 'center' },
    message: { fontSize: 14, textAlign: 'center', marginTop: 14, marginBottom: 4 },
    resultCard: { backgroundColor: colors.card, borderTopColor: colors.accent, borderTopWidth: 3, padding: 20, marginTop: 20, alignItems: 'center' },
    resultIcon: { alignItems: 'center', borderRadius: 3, height: 46, justifyContent: 'center', marginBottom: 12, width: 46 },
    resultHeading: { color: colors.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 5 },
    resultTitle: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 19, marginBottom: 15 },
    qrBox: { backgroundColor: '#FFFFFF', padding: 10, borderRadius: 3, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
    payloadText: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', lineHeight: 16 },
  });
}
