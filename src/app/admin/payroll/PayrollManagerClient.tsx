'use client';

import React, { useState, useMemo } from 'react';
import { Employee, AttendanceRecord } from '@/types';
import {
  calculateEmployeePayroll,
  getDefaultMonthlyPay,
  EmployeePayroll,
} from '@/lib/payroll';
import {
  Banknote,
  Calendar,
  Clock,
  Download,
  Search,
  Receipt,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  X,
  Printer,
  ChevronRight,
  User,
  Building,
} from 'lucide-react';

interface Props {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
}

export default function PayrollManagerClient({ employees, attendanceRecords }: Props) {
  // Current month string YYYY-MM
  const currentMonthStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [standardWorkingDays, setStandardWorkingDays] = useState<number>(26);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('ALL');

  // Custom pay overrides keyed by employee_id
  const [customPayMap, setCustomPayMap] = useState<Record<string, number>>({});

  // Active Payslip Modal
  const [selectedPayslip, setSelectedPayslip] = useState<EmployeePayroll | null>(null);

  // Distinct locations for filter dropdown
  const locations = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((emp) => {
      if (emp.location_name) set.add(emp.location_name);
    });
    return Array.from(set);
  }, [employees]);

  // Compute payroll for all employees in selected month
  const allPayrolls = useMemo(() => {
    // Filter records by selected month prefix (YYYY-MM)
    const monthRecords = attendanceRecords.filter((r) =>
      r.date.startsWith(selectedMonth)
    );

    // Group records by employeeId
    const recordsByEmp = new Map<string, AttendanceRecord[]>();
    monthRecords.forEach((r) => {
      const list = recordsByEmp.get(r.employee_id) || [];
      list.push(r);
      recordsByEmp.set(r.employee_id, list);
    });

    return employees.map((emp) => {
      const empRecords = recordsByEmp.get(emp.employee_id) || [];
      const overridePay = customPayMap[emp.employee_id];
      return calculateEmployeePayroll(emp, empRecords, overridePay, standardWorkingDays);
    });
  }, [employees, attendanceRecords, selectedMonth, standardWorkingDays, customPayMap]);

  // Filtered by search and location
  const filteredPayrolls = useMemo(() => {
    return allPayrolls.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.designation.toLowerCase().includes(searchTerm.toLowerCase());
      const matchLoc =
        locationFilter === 'ALL' || p.locationName === locationFilter;
      return matchSearch && matchLoc;
    });
  }, [allPayrolls, searchTerm, locationFilter]);

  // Aggregated totals
  const summaryTotals = useMemo(() => {
    let totalNet = 0;
    let totalHours = 0;
    let totalFullDays = 0;
    let totalHalfDays = 0;
    let totalLeaves = 0;

    filteredPayrolls.forEach((p) => {
      totalNet += p.netSalary;
      totalHours += p.hoursWorked;
      totalFullDays += p.fullDays;
      totalHalfDays += p.halfDays;
      totalLeaves += p.leavesTaken;
    });

    return {
      totalNet,
      totalHours: parseFloat(totalHours.toFixed(1)),
      totalFullDays,
      totalHalfDays,
      totalLeaves,
      employeeCount: filteredPayrolls.length,
    };
  }, [filteredPayrolls]);

  const handleCustomPayChange = (employeeId: string, val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setCustomPayMap((prev) => ({ ...prev, [employeeId]: num }));
    } else if (val === '') {
      setCustomPayMap((prev) => {
        const copy = { ...prev };
        delete copy[employeeId];
        return copy;
      });
    }
  };

  const handleExportPayrollCsv = () => {
    const headers = [
      'Employee ID',
      'Employee Name',
      'Designation',
      'Site Location',
      'Month',
      'Monthly Pay (Base)',
      'Hours Worked',
      'Full Days (>=7h)',
      'Half Days (4-7h)',
      'Leaves Taken (Auto)',
      'Standard Working Days',
      'Daily Rate (INR)',
      'Payable Days',
      'Leave & Half-Day Deductions (INR)',
      'Net Salary (INR)',
    ];

    const rows = filteredPayrolls.map((p) => [
      p.employeeId,
      `"${p.name}"`,
      `"${p.designation}"`,
      `"${p.locationName}"`,
      selectedMonth,
      p.monthlyPay,
      p.hoursWorked,
      p.fullDays,
      p.halfDays,
      p.leavesTaken,
      p.standardWorkingDays,
      p.dailyRate,
      p.payableDays,
      p.leaveDeductions,
      p.netSalary,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cubiq_payroll_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Month & Parameter Control Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex flex-wrap items-center gap-4">
          {/* Month Picker */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Payroll Month:
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Standard Working Days */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Working Days:
            </label>
            <input
              type="number"
              min={1}
              max={31}
              value={standardWorkingDays}
              onChange={(e) => setStandardWorkingDays(parseInt(e.target.value, 10) || 26)}
              className="w-16 px-2 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500 text-center"
            />
          </div>

          {/* Location Filter */}
          {locations.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Site:
              </label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="ALL">All Sites ({locations.length})</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Search & Export Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff, role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <button
            onClick={handleExportPayrollCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export Payroll CSV
          </button>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Net Payroll */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Payroll
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            ₹{summaryTotals.totalNet.toLocaleString('en-IN')}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">For {summaryTotals.employeeCount} staff</p>
        </div>

        {/* Total Hours Worked */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Hours
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {summaryTotals.totalHours} hrs
          </div>
          <p className="mt-1 text-[11px] text-slate-400">GPS verified shifts</p>
        </div>

        {/* Full Days */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Full Days (≥7h)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {summaryTotals.totalFullDays}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">100% pay rate</p>
        </div>

        {/* Half Days */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Half Days (4-7h)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {summaryTotals.totalHalfDays}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">50% pay rate</p>
        </div>

        {/* Leaves Taken */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Leaves Taken
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {summaryTotals.totalLeaves}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Auto-deducted days</p>
        </div>
      </div>

      {/* Salary & Attendance Calculation Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-base">
              Monthly Employee Salary Calculation
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Calculated based on standard {standardWorkingDays} working days/month. Adjust base pay inline to simulate adjustments.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800">
            Period: {selectedMonth}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-4 py-3.5">Monthly Pay (₹)</th>
                <th className="px-4 py-3.5">Hours Worked</th>
                <th className="px-4 py-3.5 text-center">Full Days</th>
                <th className="px-4 py-3.5 text-center">Half Days</th>
                <th className="px-4 py-3.5 text-center">Leaves (Auto)</th>
                <th className="px-4 py-3.5">Daily Rate</th>
                <th className="px-4 py-3.5">Deductions</th>
                <th className="px-4 py-3.5">Net Salary (₹)</th>
                <th className="px-5 py-3.5 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredPayrolls.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No employees matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredPayrolls.map((p) => (
                  <tr
                    key={p.employeeId}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
                  >
                    {/* Employee Info */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {p.employeeId} • <span className="text-teal-600 dark:text-teal-400">{p.designation}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {p.locationName}
                      </div>
                    </td>

                    {/* Monthly Base Pay (Editable) */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-400">₹</span>
                        <input
                          type="number"
                          value={p.monthlyPay}
                          onChange={(e) => handleCustomPayChange(p.employeeId, e.target.value)}
                          className="w-24 px-2 py-1 text-xs font-bold font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          title="Click to customize monthly base salary"
                        />
                      </div>
                    </td>

                    {/* Hours Worked */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800">
                        <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        {p.hoursWorked}h
                      </span>
                    </td>

                    {/* Full Days */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                        {p.fullDays}d
                      </span>
                    </td>

                    {/* Half Days */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      {p.halfDays > 0 ? (
                        <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                          {p.halfDays}d
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-mono">0</span>
                      )}
                    </td>

                    {/* Leaves Taken (Auto-calculated) */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      {p.leavesTaken > 0 ? (
                        <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300">
                          {p.leavesTaken}d
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          0d
                        </span>
                      )}
                    </td>

                    {/* Daily Rate */}
                    <td className="px-4 py-4 whitespace-nowrap font-mono text-xs text-slate-600 dark:text-slate-300">
                      ₹{p.dailyRate}
                    </td>

                    {/* Deductions */}
                    <td className="px-4 py-4 whitespace-nowrap font-mono text-xs text-rose-600 dark:text-rose-400 font-semibold">
                      {p.leaveDeductions > 0 ? `-₹${p.leaveDeductions.toLocaleString('en-IN')}` : '₹0'}
                    </td>

                    {/* Net Salary */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold font-mono text-teal-700 dark:text-teal-400">
                        ₹{p.netSalary.toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* Payslip View */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedPayslip(p)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/70 hover:bg-teal-100 dark:hover:bg-teal-900 border border-teal-200/70 dark:border-teal-800 rounded-lg transition"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        Payslip
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payslip Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl relative transition-colors">
            {/* Close Button */}
            <button
              onClick={() => setSelectedPayslip(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Payslip Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5">
              <img
                src="/logo.png"
                alt="CUBIQ"
                className="h-10 w-10 object-contain rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5"
              />
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  CUBIQ Interior & Modular
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Monthly Salary Slip • Period: {selectedMonth}
                </p>
              </div>
            </div>

            {/* Employee Particulars */}
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Employee Name
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedPayslip.name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Employee ID
                </span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">
                  {selectedPayslip.employeeId}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Designation
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedPayslip.designation}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Assigned Site
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedPayslip.locationName}
                </span>
              </div>
            </div>

            {/* Attendance & Shift Breakdown */}
            <div className="mt-5 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Attendance & Time Breakdown
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Total Hours</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white text-sm">
                    {selectedPayslip.hoursWorked}h
                  </span>
                </div>
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-100 dark:border-emerald-900/60">
                  <span className="text-emerald-700 dark:text-emerald-400 block text-[10px]">
                    Full Days (≥7h)
                  </span>
                  <span className="font-bold font-mono text-emerald-800 dark:text-emerald-300 text-sm">
                    {selectedPayslip.fullDays}
                  </span>
                </div>
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-100 dark:border-amber-900/60">
                  <span className="text-amber-700 dark:text-amber-400 block text-[10px]">
                    Half Days (4-7h)
                  </span>
                  <span className="font-bold font-mono text-amber-800 dark:text-amber-300 text-sm">
                    {selectedPayslip.halfDays}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1">
                <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Working Days</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">
                    {selectedPayslip.standardWorkingDays} days
                  </span>
                </div>
                <div className="p-2 bg-rose-50 dark:bg-rose-950/40 rounded-lg border border-rose-100 dark:border-rose-900/60">
                  <span className="text-rose-700 dark:text-rose-400 block text-[10px]">
                    Auto Leaves Taken
                  </span>
                  <span className="font-bold font-mono text-rose-800 dark:text-rose-300">
                    {selectedPayslip.leavesTaken} days
                  </span>
                </div>
              </div>
            </div>

            {/* Salary Computation Ledger */}
            <div className="mt-5 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-slate-500 dark:text-slate-400">Monthly Base Pay</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">
                  ₹{selectedPayslip.monthlyPay.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 dark:text-slate-400">Daily Pay Rate</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  ₹{selectedPayslip.dailyRate} / day
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 dark:text-slate-400">Payable Days</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {selectedPayslip.payableDays} days
                </span>
              </div>
              <div className="flex justify-between py-1 text-rose-600 dark:text-rose-400">
                <span>Leave & Half-Day Deductions</span>
                <span className="font-mono font-semibold">
                  -₹{selectedPayslip.leaveDeductions.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-dashed border-slate-200 dark:border-slate-700 text-sm">
                <span className="font-bold text-slate-900 dark:text-white">Net Payable Salary</span>
                <span className="font-extrabold font-mono text-teal-600 dark:text-teal-400 text-base">
                  ₹{selectedPayslip.netSalary.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                <Printer className="w-4 h-4" />
                Print Payslip
              </button>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
