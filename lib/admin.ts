import { supabase } from './supabase';
import type { Role } from './profiles';

export type AdminProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  created_at: string;
};

export type AdminEvent = {
  id: string;
  event_code: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
};

export type AdminAttendance = {
  id: string;
  student_id: string;
  event_id: string;
  scanned_at: string;
  student_name: string | null;
  student_email: string | null;
  event_title: string;
  event_code: string;
};

type AttendanceRow = {
  id: string;
  student_id: string;
  event_id: string;
  scanned_at: string;
  profiles: { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null;
  events: { title: string; event_code: string } | { title: string; event_code: string }[] | null;
};

export type AdminDashboardData = {
  profiles: AdminProfile[];
  events: AdminEvent[];
  attendance: AdminAttendance[];
  totalAttendance: number;
};

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const [profilesResult, eventsResult, attendanceResult, countResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('events')
      .select('id, event_code, title, start_time, end_time, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('attendance')
      .select('id, student_id, event_id, scanned_at, profiles(full_name, email), events(title, event_code)')
      .order('scanned_at', { ascending: false })
      .limit(200),
    supabase.from('attendance').select('id', { count: 'exact', head: true }),
  ]);

  if (profilesResult.error) throw profilesResult.error;
  if (eventsResult.error) throw eventsResult.error;
  if (attendanceResult.error) throw attendanceResult.error;
  if (countResult.error) throw countResult.error;
  if (!profilesResult.data || !eventsResult.data || !attendanceResult.data || countResult.count === null) {
    throw new Error('Could not load complete administrator records.');
  }

  const attendance = (attendanceResult.data as AttendanceRow[]).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const event = Array.isArray(row.events) ? row.events[0] : row.events;
    return {
      id: row.id,
      student_id: row.student_id,
      event_id: row.event_id,
      scanned_at: row.scanned_at,
      student_name: profile?.full_name ?? null,
      student_email: profile?.email ?? null,
      event_title: event?.title ?? 'Deleted event',
      event_code: event?.event_code ?? '',
    };
  });

  return {
    profiles: profilesResult.data as AdminProfile[],
    events: eventsResult.data as AdminEvent[],
    attendance,
    totalAttendance: countResult.count,
  };
}

export async function updateManagedProfile(
  userId: string,
  fullName: string,
  role: Role
): Promise<void> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name: fullName.trim(), role })
    .eq('id', userId)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('The user profile was not found or could not be updated.');
}

export async function createManagedEvent(eventCode: string, title: string): Promise<void> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('You must be signed in to create an event.');

  const { error } = await supabase.from('events').insert({
    event_code: eventCode.trim(),
    title: title.trim(),
    created_by: user.id,
  });
  if (error) throw error;
}

export async function updateManagedEvent(eventId: string, title: string): Promise<void> {
  const { data, error } = await supabase
    .from('events')
    .update({ title: title.trim() })
    .eq('id', eventId)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('The event was not found or could not be updated.');
}

export async function deleteManagedEvent(eventId: string): Promise<void> {
  const { data, error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('The event was not found or could not be deleted.');
}

export async function updateManagedAttendance(
  attendanceId: string,
  scannedAt: string
): Promise<void> {
  const date = new Date(scannedAt);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Enter a valid date and time.');
  }

  const { data, error } = await supabase
    .from('attendance')
    .update({ scanned_at: date.toISOString() })
    .eq('id', attendanceId)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('The attendance record was not found or could not be updated.');
}

export async function deleteManagedAttendance(attendanceId: string): Promise<void> {
  const { data, error } = await supabase
    .from('attendance')
    .delete()
    .eq('id', attendanceId)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('The attendance record was not found or could not be deleted.');
}
