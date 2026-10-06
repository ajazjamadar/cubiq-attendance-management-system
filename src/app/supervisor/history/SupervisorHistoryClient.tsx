'use client';

import React, { useState, useMemo } from 'react';
import { SiteLocation, AttendanceRecord } from '@/types';
import { Calendar, Search, Clock, Compass, MapPin, CheckCircle2 } from 'lucide-react';

interface Props {
  assignedLocation: SiteLocation | null;
  attendanceRecords: AttendanceRecord[];
}

export default function SupervisorHistoryClient({
  assignedLocation,
  attendanceRecords,
}: Props) {
  const [dateFilter, setDateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    return attendanceRecords.filter((rec) => {
      const matchDate = !dateFilter || rec.date === dateFilter;
      const matchSearch =
        rec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchDate && matchSearch;
    });
  }, [attendanceRecords, dateFilter, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search employee name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-teal-600 dark:text-teal-400 font-semibold underline hover:text-teal-700 dark:hover:text-teal-300"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Employee Name & ID</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Check-In</th>
                <th className="px-6 py-3.5">Check-Out</th>
                <th className="px-6 py-3.5">GPS Verification</th>
                <th className="px-6 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                    No attendance records found matching the filter.
                  </td>
                </tr>
              ) : (
                filtered.map((rec) => (
                  <tr key={rec.attendance_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{rec.name}</div>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                        {rec.employee_id} • {rec.attendance_id}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-800 dark:text-slate-300">{rec.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-xs font-mono text-teal-700 dark:text-teal-400 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        {rec.check_in}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-700 dark:text-slate-300">
                      {rec.check_out || '-'}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        {rec.latitude.toFixed(4)}, {rec.longitude.toFixed(4)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
