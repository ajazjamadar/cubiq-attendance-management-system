import React from 'react';
import { getSession } from '@/lib/auth';
import { getAllLocations, getAttendanceRecords, getEmployeesByLocation } from '@/lib/db';
import SupervisorHistoryClient from './SupervisorHistoryClient';

export const revalidate = 0;

export default async function SupervisorHistoryPage() {
  const session = await getSession();
  const allLocations = await getAllLocations();

  let assignedLocation = allLocations.find((l) => l.supervisor_id === session?.user_id);
  if (!assignedLocation && allLocations.length > 0) {
    assignedLocation = allLocations[0];
  }

  const [allAttendance, siteEmployees] = await Promise.all([
    getAttendanceRecords(),
    assignedLocation ? getEmployeesByLocation(assignedLocation.location_id) : [],
  ]);

  // Filter attendance belonging to this site's employees
  const siteEmpIds = new Set(siteEmployees.map((e) => e.employee_id));
  const siteAttendance = allAttendance.filter((r) => siteEmpIds.has(r.employee_id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Site Attendance History
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Historical log of GPS-verified attendance records for {assignedLocation?.location_name || 'your assigned location'}.
        </p>
      </div>

      <SupervisorHistoryClient
        assignedLocation={assignedLocation || null}
        attendanceRecords={siteAttendance}
      />
    </div>
  );
}
