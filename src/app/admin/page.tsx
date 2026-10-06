import React from 'react';
import Link from 'next/link';
import {
  getAllLocations,
  getAllUsers,
  getAllEmployees,
  getAttendanceRecords,
  getSupervisorAttendanceRecords,
} from '@/lib/db';
import {
  MapPin,
  Users,
  UserCheck,
  CalendarCheck,
  ArrowUpRight,
  PlusCircle,
  FileSpreadsheet,
  Clock,
  Navigation,
  Banknote,
  Calculator,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const revalidate = 0; // Dynamic server component

export default async function AdminDashboardPage() {
  const today = new Date().toISOString().split('T')[0];

  const [locations, users, employees, todayAttendance, todaySupervisorAttendance] =
    await Promise.all([
      getAllLocations(),
      getAllUsers(),
      getAllEmployees(),
      getAttendanceRecords(today),
      getSupervisorAttendanceRecords(today),
    ]);

  const supervisors = users.filter((u) => u.role === 'SUPERVISOR');
  const presentEmployeesCount = todayAttendance.length;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Admin Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time site management, attendance tracking & automated payroll powered by GPS Geofencing.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/payroll"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold shadow-xs transition"
          >
            <Banknote className="w-4 h-4" />
            Calculate Salary
          </Link>
          <Link
            href="/admin/locations"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold shadow-xs transition border border-slate-200 dark:border-slate-700"
          >
            <PlusCircle className="w-4 h-4" />
            Add Location
          </Link>
          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Download Reports
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Locations */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Sites
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">{locations.length}</span>
            <Link
              href="/admin/locations"
              className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline flex items-center gap-0.5"
            >
              Manage <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="mt-1 text-xs text-slate-400">All registered work locations</p>
        </div>

        {/* Total Supervisors */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Supervisors
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">{supervisors.length}</span>
            <Link
              href="/admin/supervisors"
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-0.5"
            >
              Manage <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="mt-1 text-xs text-slate-400">Site leaders with login access</p>
        </div>

        {/* Total Employees */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Employees
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">{employees.length}</span>
            <Link
              href="/admin/employees"
              className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center gap-0.5"
            >
              View Directory <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="mt-1 text-xs text-slate-400">Field staff across all sites</p>
        </div>

        {/* Today's Attendance Count */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Today's Present
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">{presentEmployeesCount}</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
              {employees.length > 0
                ? `${Math.round((presentEmployeesCount / employees.length) * 100)}% turnout`
                : '0%'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Verified via GPS geofencing</p>
        </div>
      </div>

      {/* Salary & Payroll Engine Feature Spotlight Card */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30">
              <Calculator className="w-3.5 h-3.5" />
              Automated Payroll Calculator Ready
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Calculate Monthly Salaries from Verified Attendance
            </h2>
            <p className="text-xs sm:text-sm text-teal-100/80 leading-relaxed">
              Auto-computes <span className="font-semibold text-white">Monthly Pay</span>, <span className="font-semibold text-white">Hours Worked</span> (from check-in/out timestamps), <span className="font-semibold text-white">Half Days</span> (4-7h), and <span className="font-semibold text-white">Leaves Taken</span> (standard 26-day base) with net salary payouts and exportable CSV reports.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/admin/payroll"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-teal-900 hover:bg-teal-50 font-bold text-sm shadow-md transition"
            >
              <Banknote className="w-4 h-4 text-teal-700" />
              Open Payroll Calculator
            </Link>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Employee Attendance & Supervisor Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: Recent Employee Attendance */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">Recent Employee Attendance</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Today ({today}) GPS-verified check-ins</p>
            </div>
            <Link
              href="/admin/reports"
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline flex items-center gap-1"
            >
              View Full Report <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {todayAttendance.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No employee attendance recorded today yet.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/75 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-5 py-3">Check-In</th>
                    <th className="px-5 py-3">Check-Out</th>
                    <th className="px-5 py-3">GPS Coordinates</th>
                    <th className="px-5 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {todayAttendance.map((rec) => (
                    <tr key={rec.attendance_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-white">{rec.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {rec.employee_id} {rec.location_name ? `• ${rec.location_name}` : ''}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-mono text-xs text-slate-800 dark:text-slate-200">
                          <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                          {rec.check_in}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs text-slate-500 dark:text-slate-400">
                        {rec.check_out || '-'}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        <div className="flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-slate-400" />
                          {rec.latitude.toFixed(4)}, {rec.longitude.toFixed(4)}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Sidebar: Supervisor Attendance */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col transition-colors">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">Supervisor Attendance</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">On-site attendance records</p>
            </div>
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
              {todaySupervisorAttendance.length} Checked In
            </span>
          </div>

          <div className="p-4 flex-1">
            {todaySupervisorAttendance.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No supervisors have marked check-in today.
              </div>
            ) : (
              <div className="space-y-3">
                {todaySupervisorAttendance.map((sup) => (
                  <div
                    key={sup.attendance_id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">{sup.name}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {sup.location_name || 'Assigned Site'}
                      </span>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span>In: {sup.check_in}</span>
                        <span>Out: {sup.check_out || 'Active'}</span>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 rounded font-semibold text-[10px] border border-teal-200 dark:border-teal-800">
                      VERIFIED
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <Link
              href="/admin/supervisors"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center justify-center gap-1"
            >
              Manage Supervisors & Locations <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
