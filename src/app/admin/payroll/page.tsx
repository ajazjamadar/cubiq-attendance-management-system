import React from 'react';
import { getAllEmployees, getAttendanceRecords } from '@/lib/db';
import PayrollManagerClient from './PayrollManagerClient';
import { Banknote } from 'lucide-react';

export const revalidate = 0;

export default async function AdminPayrollPage() {
  const [employees, attendanceRecords] = await Promise.all([
    getAllEmployees(),
    getAttendanceRecords(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Banknote className="w-4 h-4" />
          <span>Compensation & Attendance Engine</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Automated Salary & Payroll Calculator
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Real-time salary computation factoring in monthly pay, hours worked, full shifts, half days, and auto-calculated leaves based on GPS check-in/out logs.
        </p>
      </div>

      <PayrollManagerClient
        employees={employees}
        attendanceRecords={attendanceRecords}
      />
    </div>
  );
}
