import React from 'react';
import { getSession } from '@/lib/auth';
import {
  getAllLocations,
  getEmployeesByLocation,
  getAttendanceRecords,
  getSupervisorAttendanceRecords,
  getAllEmployees,
} from '@/lib/db';
import SupervisorAttendanceClient from './SupervisorAttendanceClient';

export const revalidate = 0;

export default async function SupervisorPage() {
  const session = await getSession();
  const today = new Date().toISOString().split('T')[0];

  const allLocations = await getAllLocations();

  // Find assigned location for supervisor
  let assignedLocation = allLocations.find((l) => l.supervisor_id === session?.user_id);

  // If no location assigned yet or user is Admin previewing, fallback to first location
  if (!assignedLocation && allLocations.length > 0) {
    assignedLocation = allLocations[0];
  }

  const [employees, todayAttendance, todaySupervisorAttendance] = await Promise.all([
    assignedLocation ? getEmployeesByLocation(assignedLocation.location_id) : [],
    getAttendanceRecords(today),
    getSupervisorAttendanceRecords(today),
  ]);

  return (
    <SupervisorAttendanceClient
      session={session!}
      location={assignedLocation || null}
      allLocations={allLocations}
      initialEmployees={employees}
      todayAttendance={todayAttendance}
      todaySupervisorAttendance={todaySupervisorAttendance}
    />
  );
}
