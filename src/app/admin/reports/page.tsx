import React from 'react';
import { getAttendanceRecords, getSupervisorAttendanceRecords } from '@/lib/db';
import ReportsViewerClient from './ReportsViewerClient';

export const revalidate = 0;

export default async function AdminReportsPage() {
  const [employeeRecords, supervisorRecords] = await Promise.all([
    getAttendanceRecords(),
    getSupervisorAttendanceRecords(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Attendance Reports & Data Export
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review complete attendance logs for field employees and supervisors. Export verified records directly to CSV.
        </p>
      </div>

      <ReportsViewerClient
        initialEmployeeRecords={employeeRecords}
        initialSupervisorRecords={supervisorRecords}
      />
    </div>
  );
}
