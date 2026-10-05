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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Admin Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time site management and attendance records powered by Google Sheets.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/locations"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            Add Location
          </Link>
          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Download Reports
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Locations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Sites
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900">{locations.length}</span>
            <Link
              href="/admin/locations"
              className="text-xs text-teal-600 font-semibold hover:underline flex items-center gap-0.5"
            >
              Manage <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="mt-1 text-xs text-slate-400">All registered work locations</p>
        </div>

        {/* Total Supervisors */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Supervisors
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900">{supervisors.length}</span>
            <Link
              href="/admin/supervisors"
              className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-0.5"
            >
              Manage <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="mt-1 text-xs text-slate-400">Site leaders with login access</p>
        </div>

        {/* Total Employees */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Employees
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900">{employees.length}</span>
            <Link
              href="/admin/employees"
              className="text-xs text-purple-600 font-semibold hover:underline flex items-center gap-0.5"
            >
              View Directory <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="mt-1 text-xs text-slate-400">Field staff across all sites</p>
        </div>

        {/* Today's Attendance Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Today's Present
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900">{presentEmployeesCount}</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {employees.length > 0
                ? `${Math.round((presentEmployeesCount / employees.length) * 100)}% turnout`
                : '0%'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Verified via GPS geofencing</p>
        </div>
      </div>

      {/* Two Column Section: Recent Employee Attendance & Supervisor Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: Recent Employee Attendance */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Recent Employee Attendance</h2>
              <p className="text-xs text-slate-500">Today ({today}) GPS-verified check-ins</p>
            </div>
            <Link
              href="/admin/reports"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline flex items-center gap-1"
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
                <thead className="bg-slate-50/75 text-slate-500 text-xs font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-5 py-3">Check-In</th>
                    <th className="px-5 py-3">Check-Out</th>
                    <th className="px-5 py-3">GPS Coordinates</th>
                    <th className="px-5 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {todayAttendance.map((rec) => (
                    <tr key={rec.attendance_id} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{rec.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {rec.employee_id} {rec.location_name ? `• ${rec.location_name}` : ''}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-mono text-xs text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-teal-600" />
                          {rec.check_in}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs text-slate-500">
                        {rec.check_out || '-'}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">
                        <div className="flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-slate-400" />
                          {rec.latitude.toFixed(4)}, {rec.longitude.toFixed(4)}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
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
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Supervisor Attendance</h2>
              <p className="text-xs text-slate-500">On-site attendance records</p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
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
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 block">{sup.name}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {sup.location_name || 'Assigned Site'}
                      </span>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span>In: {sup.check_in}</span>
                        <span>Out: {sup.check_out || 'Active'}</span>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-teal-100 text-teal-800 rounded font-semibold text-[10px]">
                      VERIFIED
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <Link
              href="/admin/supervisors"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1"
            >
              Manage Supervisors & Locations <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
