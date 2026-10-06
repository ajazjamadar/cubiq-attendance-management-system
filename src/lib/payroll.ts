import { Employee, AttendanceRecord } from '@/types';
import { calculateHoursWorked, classifyShiftType } from './attendance-utils';

export interface EmployeePayroll {
  employeeId: string;
  name: string;
  designation: string;
  locationName: string;
  monthlyPay: number;
  hoursWorked: number;
  fullDays: number;
  halfDays: number;
  leavesTaken: number;
  standardWorkingDays: number;
  dailyRate: number;
  payableDays: number;
  leaveDeductions: number;
  netSalary: number;
  recordsCount: number;
}

// Default base monthly pay by designation if not customized
export const DEFAULT_DESIGNATION_PAY: Record<string, number> = {
  'Site Engineer': 35000,
  'Safety Officer': 28000,
  'Quality Inspector': 30000,
  'Foreman': 24000,
  'Mason': 20000,
  'Electrician': 22000,
  'Carpenter': 21000,
  'Default': 25000,
};

export function getDefaultMonthlyPay(designation?: string): number {
  if (!designation) return DEFAULT_DESIGNATION_PAY['Default'];
  for (const [key, pay] of Object.entries(DEFAULT_DESIGNATION_PAY)) {
    if (designation.toLowerCase().includes(key.toLowerCase())) {
      return pay;
    }
  }
  return DEFAULT_DESIGNATION_PAY['Default'];
}

/**
 * Calculates payroll for an employee for a specific month.
 *
 * @param employee The employee object
 * @param records All attendance records for that employee in the month
 * @param customMonthlyPay Optional override for base monthly pay
 * @param standardWorkingDays Total expected working days in the month (default: 26)
 */
export function calculateEmployeePayroll(
  employee: Employee,
  records: AttendanceRecord[],
  customMonthlyPay?: number,
  standardWorkingDays: number = 26
): EmployeePayroll {
  const monthlyPay = customMonthlyPay ?? getDefaultMonthlyPay(employee.designation);

  let totalHours = 0;
  let fullDays = 0;
  let halfDays = 0;

  // Track distinct days worked
  const daysMap = new Map<string, { hours: number; isComplete: boolean }>();

  for (const rec of records) {
    const { hoursDecimal, isComplete } = calculateHoursWorked(rec.check_in, rec.check_out);
    const existing = daysMap.get(rec.date);
    if (!existing || hoursDecimal > existing.hours) {
      daysMap.set(rec.date, { hours: hoursDecimal, isComplete });
    }
  }

  daysMap.forEach((dayData) => {
    totalHours += dayData.hours;
    const shift = classifyShiftType(dayData.hours, dayData.isComplete);
    if (shift === 'FULL_DAY') {
      fullDays += 1;
    } else if (shift === 'HALF_DAY') {
      halfDays += 1;
    }
  });

  // Auto-calculated Leaves: Expected working days minus attended days
  const attendedDaysCount = fullDays + halfDays;
  const leavesTaken = Math.max(0, standardWorkingDays - attendedDaysCount);

  // Daily rate
  const dailyRate = Math.round((monthlyPay / standardWorkingDays) * 100) / 100;

  // Payable days: 1.0 for each full day, 0.5 for each half day
  const payableDays = fullDays + halfDays * 0.5;

  // Leave deductions
  const halfDayDeductions = halfDays * 0.5 * dailyRate;
  const fullDayLeaveDeductions = leavesTaken * dailyRate;
  const leaveDeductions = Math.round(fullDayLeaveDeductions + halfDayDeductions);

  // Net calculated salary
  const netSalary = Math.max(0, Math.round(payableDays * dailyRate));

  return {
    employeeId: employee.employee_id,
    name: employee.name,
    designation: employee.designation,
    locationName: employee.location_name || 'Main Site',
    monthlyPay,
    hoursWorked: parseFloat(totalHours.toFixed(1)),
    fullDays,
    halfDays,
    leavesTaken,
    standardWorkingDays,
    dailyRate,
    payableDays,
    leaveDeductions,
    netSalary,
    recordsCount: records.length,
  };
}
