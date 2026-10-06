'use client';

import React, { useState, useMemo } from 'react';
import { AttendanceRecord, SupervisorAttendanceRecord } from '@/types';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Users,
  UserCheck,
  Search,
  Clock,
  Compass,
  Timer,
} from 'lucide-react';
import { calculateHoursWorked, classifyShiftType } from '@/lib/attendance-utils';

interface Props {
  initialEmployeeRecords: AttendanceRecord[];
  initialSupervisorRecords: SupervisorAttendanceRecord[];
}

export default function ReportsViewerClient({
  initialEmployeeRecords,
  initialSupervisorRecords,
}: Props) {
  const [activeTab, setActiveTab] = useState<'EMPLOYEE' | 'SUPERVISOR'>('EMPLOYEE');
  const [dateFilter, setDateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtered employee records
  const filteredEmployees = useMemo(() => {
    return initialEmployeeRecords.filter((rec) => {
      const matchDate = !dateFilter || rec.date === dateFilter;
      const matchSearch =
        rec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.location_name && rec.location_name.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchDate && matchSearch;
    });
  }, [initialEmployeeRecords, dateFilter, searchTerm]);

  // Filtered supervisor records
  const filteredSupervisors = useMemo(() => {
    return initialSupervisorRecords.filter((rec) => {
      const matchDate = !dateFilter || rec.date === dateFilter;
      const matchSearch =
        rec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.supervisor_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.location_name && rec.location_name.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchDate && matchSearch;
    });
  }, [initialSupervisorRecords, dateFilter, searchTerm]);

  const handleDownloadCsv = () => {
    let csvContent = '';
    let filename = '';

    if (activeTab === 'EMPLOYEE') {
      filename = `cubiq_employee_attendance_${dateFilter || 'all'}.csv`;
      const headers = [
        'Attendance ID',
        'Employee ID',
        'Name',
        'Date',
        'Check In',
        'Check Out',
        'Hours Worked',
        'Latitude',
        'Longitude',
        'Status',
        'Location Name',
      ];
      const rows = filteredEmployees.map((r) => {
        const { formatted } = calculateHoursWorked(r.check_in, r.check_out);
        return [
          r.attendance_id,
          r.employee_id,
          `"${r.name}"`,
          r.date,
          r.check_in,
          r.check_out || '-',
          `"${formatted}"`,
          r.latitude,
          r.longitude,
          r.status,
          `"${r.location_name || ''}"`,
        ];
      });
      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else {
      filename = `cubiq_supervisor_attendance_${dateFilter || 'all'}.csv`;
      const headers = [
        'Attendance ID',
        'Supervisor ID',
        'Name',
        'Date',
        'Check In',
        'Check Out',
        'Hours Worked',
        'Latitude',
        'Longitude',
        'Location Name',
      ];
      const rows = filteredSupervisors.map((r) => {
        const { formatted } = calculateHoursWorked(r.check_in, r.check_out);
        return [
          r.attendance_id,
          r.supervisor_id,
          `"${r.name}"`,
          r.date,
          r.check_in,
          r.check_out || '-',
          `"${formatted}"`,
          r.latitude,
          r.longitude,
          `"${r.location_name || ''}"`,
        ];
      });
      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Tabs & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('EMPLOYEE')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'EMPLOYEE'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Employees ({initialEmployeeRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('SUPERVISOR')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'SUPERVISOR'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Supervisors ({initialSupervisorRecords.length})
          </button>
        </div>

        {/* Filter and Download */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold underline hover:text-teal-700"
              >
                Clear
              </button>
            )}
          </div>

          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          {activeTab === 'EMPLOYEE' ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Employee Name & ID</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Check-In</th>
                  <th className="px-6 py-3.5">Check-Out</th>
                  <th className="px-6 py-3.5">Hours Worked</th>
                  <th className="px-6 py-3.5">Site & GPS Location</th>
                  <th className="px-6 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                      No employee attendance records found for this filter.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((rec) => {
                    const hoursInfo = calculateHoursWorked(rec.check_in, rec.check_out);
                    const shift = classifyShiftType(hoursInfo.hoursDecimal, hoursInfo.isComplete);
                    return (
                      <tr key={rec.attendance_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 dark:text-white">{rec.name}</div>
                          <span className="text-[11px] font-mono text-slate-400">
                            {rec.employee_id} • {rec.attendance_id}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-800 dark:text-slate-200">{rec.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-xs font-mono text-teal-700 dark:text-teal-400 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                            {rec.check_in}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-500 dark:text-slate-400">
                          {rec.check_out || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800">
                              <Timer className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                              {hoursInfo.formatted}
                            </span>
                            {hoursInfo.isComplete && (
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                  shift === 'FULL_DAY'
                                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                                    : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                                }`}
                              >
                                {shift === 'FULL_DAY' ? 'Full' : 'Half'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {rec.location_name || 'Assigned Site'}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 mt-0.5">
                            <Compass className="w-3 h-3 text-slate-400" />
                            {rec.latitude.toFixed(4)}, {rec.longitude.toFixed(4)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {rec.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Supervisor Name & ID</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Check-In</th>
                  <th className="px-6 py-3.5">Check-Out</th>
                  <th className="px-6 py-3.5">Hours Worked</th>
                  <th className="px-6 py-3.5">Site & GPS Location</th>
                  <th className="px-6 py-3.5 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredSupervisors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                      No supervisor attendance records found for this filter.
                    </td>
                  </tr>
                ) : (
                  filteredSupervisors.map((rec) => {
                    const hoursInfo = calculateHoursWorked(rec.check_in, rec.check_out);
                    return (
                      <tr key={rec.attendance_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 dark:text-white">{rec.name}</div>
                          <span className="text-[11px] font-mono text-slate-400">
                            {rec.supervisor_id} • {rec.attendance_id}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-800 dark:text-slate-200">{rec.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-xs font-mono text-blue-700 dark:text-blue-400 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            {rec.check_in}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-500 dark:text-slate-400">
                          {rec.check_out || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800">
                            <Timer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            {hoursInfo.formatted}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {rec.location_name || 'Assigned Site'}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 mt-0.5">
                            <Compass className="w-3 h-3 text-slate-400" />
                            {rec.latitude.toFixed(4)}, {rec.longitude.toFixed(4)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            ON-SITE
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
