/**
 * Calculates hours worked between checkIn and checkOut timestamps (format HH:mm:ss).
 */
export function calculateHoursWorked(
  checkIn: string,
  checkOut?: string
): {
  hoursDecimal: number;
  formatted: string;
  isComplete: boolean;
} {
  if (!checkIn || !checkOut || checkOut === '-' || checkOut.trim() === '') {
    return {
      hoursDecimal: 0,
      formatted: 'In Progress',
      isComplete: false,
    };
  }

  try {
    const parseTime = (timeStr: string) => {
      const parts = timeStr.trim().split(':').map((p) => parseInt(p, 10) || 0);
      const h = parts[0] || 0;
      const m = parts[1] || 0;
      const s = parts[2] || 0;
      return h * 3600 + m * 60 + s;
    };

    const inSec = parseTime(checkIn);
    const outSec = parseTime(checkOut);

    let diffSec = outSec - inSec;
    // Cross-midnight handling
    if (diffSec < 0) {
      diffSec += 24 * 3600;
    }

    const totalHours = diffSec / 3600;
    const h = Math.floor(totalHours);
    const m = Math.round((totalHours - h) * 60);

    return {
      hoursDecimal: parseFloat(totalHours.toFixed(2)),
      formatted: `${h}h ${m}m`,
      isComplete: true,
    };
  } catch (err) {
    return {
      hoursDecimal: 0,
      formatted: '-',
      isComplete: false,
    };
  }
}

/**
 * Classifies an attendance shift:
 * - FULL_DAY: >= 7.0 hours
 * - HALF_DAY: between 4.0 and 7.0 hours
 * - INCOMPLETE: < 4.0 hours (or incomplete check-out)
 */
export function classifyShiftType(
  hoursDecimal: number,
  isComplete: boolean
): 'FULL_DAY' | 'HALF_DAY' | 'LEAVE' {
  if (!isComplete) return 'HALF_DAY'; // Default benefit of doubt or partial if left open
  if (hoursDecimal >= 7.0) return 'FULL_DAY';
  if (hoursDecimal >= 4.0) return 'HALF_DAY';
  return 'LEAVE';
}
