'use server';

import {
  getLocationById,
  recordEmployeeCheckIn,
  recordEmployeeCheckOut,
  getAttendanceRecords,
  recordSupervisorCheckIn,
  recordSupervisorCheckOut,
  getSupervisorAttendanceRecords,
  getAllEmployees,
  getAllLocations,
} from '@/lib/db';
import { validateGeofence } from '@/lib/geo';
import { AttendanceRecord, SupervisorAttendanceRecord } from '@/types';
import { calculateHoursWorked } from '@/lib/attendance-utils';
import { revalidatePath } from 'next/cache';

/**
 * Mark Employee Check-In with GPS geofencing
 */
export async function markEmployeeCheckInAction(params: {
  employeeId: string;
  employeeName: string;
  locationId: string;
  latitude: number;
  longitude: number;
}) {
  const { employeeId, employeeName, locationId, latitude, longitude } = params;

  if (isNaN(latitude) || isNaN(longitude)) {
    return {
      success: false,
      message: 'GPS coordinates could not be acquired. Please enable location permissions.',
    };
  }

  const location = await getLocationById(locationId);
  if (!location) {
    return { success: false, message: 'Assigned location not found.' };
  }

  // Verify Geofence
  const validation = validateGeofence(
    latitude,
    longitude,
    location.latitude,
    location.longitude,
    location.radius
  );

  if (!validation.isValid) {
    return {
      success: false,
      message: 'You are not within your assigned work location.',
      details: `Current distance is ${validation.distanceMeters}m from ${location.location_name}, which exceeds the allowed radius of ${validation.allowedRadiusMeters}m.`,
    };
  }

  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0]; // HH:MM:SS

  // Check if already checked in today
  const existingRecords = await getAttendanceRecords(date);
  const alreadyCheckedIn = existingRecords.find((r) => r.employee_id === employeeId);

  if (alreadyCheckedIn) {
    return {
      success: false,
      message: `${employeeName} is already checked in today at ${alreadyCheckedIn.check_in}.`,
    };
  }

  const attendanceId = `ATT-${Date.now().toString().slice(-6)}`;

  const record: AttendanceRecord = {
    attendance_id: attendanceId,
    employee_id: employeeId,
    name: employeeName,
    date,
    check_in: time,
    check_out: '-',
    latitude,
    longitude,
    status: 'PRESENT',
    location_name: location.location_name,
  };

  try {
    await recordEmployeeCheckIn(record);
    revalidatePath('/supervisor');
    revalidatePath('/admin');
    return {
      success: true,
      message: `Checked in successfully at ${time}!`,
      record,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to record check-in.' };
  }
}

/**
 * Mark Employee Check-Out
 */
export async function markEmployeeCheckOutAction(params: {
  attendanceId: string;
  locationId?: string;
  latitude?: number;
  longitude?: number;
}) {
  const { attendanceId, locationId, latitude, longitude } = params;

  // Optional Geofence validation on check-out if coordinates provided
  if (locationId && latitude !== undefined && longitude !== undefined) {
    const location = await getLocationById(locationId);
    if (location) {
      const validation = validateGeofence(
        latitude,
        longitude,
        location.latitude,
        location.longitude,
        location.radius
      );
      if (!validation.isValid) {
        return {
          success: false,
          message: 'You are not within your assigned work location.',
          details: `Current distance is ${validation.distanceMeters}m, allowed: ${validation.allowedRadiusMeters}m.`,
        };
      }
    }
  }

  const now = new Date();
  const time = now.toTimeString().split(' ')[0];

  try {
    await recordEmployeeCheckOut(attendanceId, time);
    revalidatePath('/supervisor');
    revalidatePath('/admin');
    return { success: true, message: `Checked out successfully at ${time}!` };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to record check-out.' };
  }
}

/**
 * Mark Supervisor Check-In with GPS geofencing
 */
export async function markSupervisorCheckInAction(params: {
  supervisorId: string;
  supervisorName: string;
  locationId: string;
  latitude: number;
  longitude: number;
}) {
  const { supervisorId, supervisorName, locationId, latitude, longitude } = params;

  if (isNaN(latitude) || isNaN(longitude)) {
    return {
      success: false,
      message: 'GPS coordinates could not be acquired. Please enable location permissions.',
    };
  }

  const location = await getLocationById(locationId);
  if (!location) {
    return { success: false, message: 'Assigned location not found.' };
  }

  // Geofence check
  const validation = validateGeofence(
    latitude,
    longitude,
    location.latitude,
    location.longitude,
    location.radius
  );

  if (!validation.isValid) {
    return {
      success: false,
      message: 'You are not within your assigned work location.',
      details: `Current distance is ${validation.distanceMeters}m, allowed: ${validation.allowedRadiusMeters}m.`,
    };
  }

  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0];

  const existing = await getSupervisorAttendanceRecords(date);
  const alreadyCheckedIn = existing.find((r) => r.supervisor_id === supervisorId);

  if (alreadyCheckedIn) {
    return {
      success: false,
      message: `You are already checked in today at ${alreadyCheckedIn.check_in}.`,
    };
  }

  const attendanceId = `SUP-ATT-${Date.now().toString().slice(-6)}`;

  const record: SupervisorAttendanceRecord = {
    attendance_id: attendanceId,
    supervisor_id: supervisorId,
    name: supervisorName,
    date,
    check_in: time,
    check_out: '-',
    latitude,
    longitude,
    location_name: location.location_name,
  };

  try {
    await recordSupervisorCheckIn(record);
    revalidatePath('/supervisor');
    revalidatePath('/admin');
    return {
      success: true,
      message: `Supervisor checked in successfully at ${time}!`,
      record,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to record supervisor check-in.' };
  }
}

/**
 * Mark Supervisor Check-Out
 */
export async function markSupervisorCheckOutAction(attendanceId: string) {
  const now = new Date();
  const time = now.toTimeString().split(' ')[0];

  try {
    await recordSupervisorCheckOut(attendanceId, time);
    revalidatePath('/supervisor');
    revalidatePath('/admin');
    return { success: true, message: `Supervisor checked out successfully at ${time}!` };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to record check-out.' };
  }
}

/**
 * Export CSV Report data
 */
export async function generateAttendanceCsv(type: 'employee' | 'supervisor', dateFilter?: string) {
  if (type === 'employee') {
    const records = await getAttendanceRecords(dateFilter);
    const headers = [
      'Attendance ID',
      'Employee ID',
      'Employee Name',
      'Date',
      'Check In',
      'Check Out',
      'Hours Worked',
      'Latitude',
      'Longitude',
      'Status',
    ];
    const rows = records.map((r) => {
      const hoursInfo = calculateHoursWorked(r.check_in, r.check_out);
      return [
        r.attendance_id,
        r.employee_id,
        `"${r.name}"`,
        r.date,
        r.check_in,
        r.check_out,
        `"${hoursInfo.formatted}"`,
        r.latitude,
        r.longitude,
        r.status,
      ];
    });
    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  } else {
    const records = await getSupervisorAttendanceRecords(dateFilter);
    const headers = [
      'Attendance ID',
      'Supervisor ID',
      'Supervisor Name',
      'Date',
      'Check In',
      'Check Out',
      'Hours Worked',
      'Latitude',
      'Longitude',
    ];
    const rows = records.map((r) => {
      const hoursInfo = calculateHoursWorked(r.check_in, r.check_out);
      return [
        r.attendance_id,
        r.supervisor_id,
        `"${r.name}"`,
        r.date,
        r.check_in,
        r.check_out,
        `"${hoursInfo.formatted}"`,
        r.latitude,
        r.longitude,
      ];
    });
    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }
}
