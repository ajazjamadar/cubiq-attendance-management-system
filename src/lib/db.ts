import {
  User,
  SiteLocation,
  Employee,
  AttendanceRecord,
  SupervisorAttendanceRecord,
  UserStatus,
} from '@/types';
import {
  isSqlConfigured,
  sqlFindUserByUsername,
  sqlGetAllUsers,
  sqlCreateUser,
  sqlUpdateUserStatus,
  sqlGetAllLocations,
  sqlGetLocationById,
  sqlCreateLocation,
  sqlAssignSupervisorToLocation,
  sqlGetAllEmployees,
  sqlGetEmployeesByLocation,
  sqlCreateEmployee,
  sqlUpdateEmployee,
  sqlGetAttendanceRecords,
  sqlRecordEmployeeCheckIn,
  sqlRecordEmployeeCheckOut,
  sqlGetSupervisorAttendanceRecords,
  sqlRecordSupervisorCheckIn,
  sqlRecordSupervisorCheckOut,
} from './sql';
import {
  isGoogleSheetsConfigured,
  TABS,
  readTabRows,
  appendTabRow,
  updateTabRow,
  initializeSpreadsheetTabs,
} from './sheets';
import {
  fileFindUserByUsername,
  fileGetAllUsers,
  fileCreateUser,
  fileUpdateUserStatus,
  fileGetAllLocations,
  fileGetLocationById,
  fileCreateLocation,
  fileAssignSupervisorToLocation,
  fileGetAllEmployees,
  fileGetEmployeesByLocation,
  fileCreateEmployee,
  fileUpdateEmployee,
  fileGetAttendanceRecords,
  fileRecordEmployeeCheckIn,
  fileRecordEmployeeCheckOut,
  fileGetSupervisorAttendanceRecords,
  fileRecordSupervisorCheckIn,
  fileRecordSupervisorCheckOut,
} from './file-store';
import { getSeedData } from './seed';

export type StorageDriverType = 'postgres_sql' | 'google_sheets' | 'local_file';

export function getStorageMode(): StorageDriverType {
  const driver = (process.env.STORAGE_DRIVER || '').toLowerCase();
  if (driver === 'sheets' || driver === 'google_sheets') return 'google_sheets';
  if (driver === 'sql' || driver === 'postgres') return 'postgres_sql';
  if (driver === 'file' || driver === 'local') return 'local_file';

  // Auto mode: if Google Sheets credentials are provided, use Google Sheets!
  if (isGoogleSheetsConfigured()) return 'google_sheets';
  if (isSqlConfigured()) return 'postgres_sql';
  return 'local_file';
}

// ==========================================
// USER REPOSITORY
// ==========================================

export async function findUserByUsername(username: string): Promise<User | null> {
  const mode = getStorageMode();
  if (mode === 'postgres_sql') {
    return await sqlFindUserByUsername(username);
  }
  if (mode === 'google_sheets') {
    const normalized = username.trim().toLowerCase();
    await initializeSpreadsheetTabs();
    const rows = await readTabRows(TABS.USERS);
    for (const r of rows) {
      const uName = (r[3] || '').trim().toLowerCase();
      const fullName = (r[1] || '').trim().toLowerCase();
      const role = r[2] || '';
      const isMatch =
        uName === normalized ||
        fullName === normalized ||
        (role === 'ADMIN' &&
          ['admin', 'md afnan', 'mdafnan', 'afnan@cubiq.com', 'afnan'].includes(normalized));

      if (isMatch) {
        return {
          user_id: r[0] || '',
          name: r[1] || '',
          role: (r[2] as any) || 'SUPERVISOR',
          username: r[3] || '',
          password_hash: r[4] || '',
          status: (r[5] as any) || 'ACTIVE',
        };
      }
    }
    if (rows.length === 0) {
      const seed = await getSeedData();
      for (const u of seed.users) {
        await createUser(u);
      }
      return findUserByUsername(username);
    }
    return null;
  }
  // Local persistent file store
  return await fileFindUserByUsername(username);
}

export async function getAllUsers(): Promise<User[]> {
  const mode = getStorageMode();
  if (mode === 'postgres_sql') {
    return await sqlGetAllUsers();
  }
  if (mode === 'google_sheets') {
    await initializeSpreadsheetTabs();
    const rows = await readTabRows(TABS.USERS);
    if (rows.length === 0) {
      const seed = await getSeedData();
      for (const u of seed.users) {
        await createUser(u);
      }
      return seed.users;
    }
    return rows.map((r) => ({
      user_id: r[0] || '',
      name: r[1] || '',
      role: (r[2] as any) || 'SUPERVISOR',
      username: r[3] || '',
      password_hash: r[4] || '',
      status: (r[5] as any) || 'ACTIVE',
    }));
  }
  return await fileGetAllUsers();
}

export async function createUser(user: User): Promise<void> {
  const mode = getStorageMode();
  if (mode === 'postgres_sql') {
    await sqlCreateUser(user);
    return;
  }
  if (mode === 'google_sheets') {
    await initializeSpreadsheetTabs();
    await appendTabRow(TABS.USERS, [
      user.user_id,
      user.name,
      user.role,
      user.username,
      user.password_hash,
      user.status,
    ]);
    return;
  }
  await fileCreateUser(user);
}

export async function updateUserStatus(userId: string, status: UserStatus): Promise<void> {
  const mode = getStorageMode();
  if (mode === 'postgres_sql') {
    await sqlUpdateUserStatus(userId, status);
    return;
  }
  if (mode === 'google_sheets') {
    const rows = await readTabRows(TABS.USERS);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === userId) {
        const rowNumber = i + 2;
        const updated = [...rows[i]];
        updated[5] = status;
        await updateTabRow(TABS.USERS, rowNumber, updated);
        return;
      }
    }
    return;
  }
  await fileUpdateUserStatus(userId, status);
}

// ==========================================
// LOCATION REPOSITORY
// ==========================================

export async function getAllLocations(): Promise<SiteLocation[]> {
  const mode = getStorageMode();
  if (mode === 'postgres_sql') {
    return await sqlGetAllLocations();
  }
  if (mode === 'google_sheets') {
    const users = await getAllUsers();
    const userMap = new Map(users.map((u) => [u.user_id, u.name]));
    await initializeSpreadsheetTabs();
    const rows = await readTabRows(TABS.LOCATIONS);
    if (rows.length === 0) {
      const seed = await getSeedData();
      for (const loc of seed.locations) {
        await createLocation(loc);
      }
      return seed.locations;
    }
    return rows.map((r) => ({
      location_id: r[0] || '',
      location_name: r[1] || '',
      address: r[2] || '',
      latitude: parseFloat(r[3]) || 0,
      longitude: parseFloat(r[4]) || 0,
      radius: parseFloat(r[5]) || 100,
      supervisor_id: r[6] || '',
      supervisor_name: userMap.get(r[6] || '') || 'Unassigned',
      status: 'ACTIVE',
    }));
  }
  return await fileGetAllLocations();
}

export async function getLocationById(id: string): Promise<SiteLocation | null> {
  const mode = getStorageMode();
  if (mode === 'postgres_sql') {
    return await sqlGetLocationById(id);
  }
  if (mode === 'google_sheets') {
    const locations = await getAllLocations();
    return locations.find((l) => l.location_id === id) || null;
  }
  return await fileGetLocationById(id);
}

export async function createLocation(location: SiteLocation): Promise<void> {
  const mode = getStorageMode();
  if (mode === 'postgres_sql') {
    await sqlCreateLocation(location);
    return;
  }
  if (mode === 'google_sheets') {
    await initializeSpreadsheetTabs();
    await appendTabRow(TABS.LOCATIONS, [
      location.location_id,
      location.location_name,
      location.address,
      location.latitude,
      location.longitude,
      location.radius,
      location.supervisor_id || '',
    ]);
    return;
  }
  await fileCreateLocation(location);
}

export async function assignSupervisorToLocation(
  locationId: string,
  supervisorId: string
): Promise<void> {
  const mode = getStorageMode();
  if (mode === 'postgres_sql') {
    await sqlAssignSupervisorToLocation(locationId, supervisorId);
    return;
  }
  if (mode === 'google_sheets') {
    const rows = await readTabRows(TABS.LOCATIONS);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === locationId) {
        const rowNumber = i + 2;
        const updated = [...rows[i]];
        updated[6] = supervisorId;
        await updateTabRow(TABS.LOCATIONS, rowNumber, updated);
        return;
      }
    }
    return;
  }
  await fileAssignSupervisorToLocation(locationId, supervisorId);
}

// ==========================================
// EMPLOYEE REPOSITORY
// ==========================================

export async function getAllEmployees(): Promise<Employee[]> {
  const mode = getStorageMode();
  if (mode === 'postgres_sql') {
    return await sqlGetAllEmployees();
  }
  if (mode === 'google_sheets') {
    const locations = await getAllLocations();
    const locMap = new Map(locations.map((l) => [l.location_id, l.location_name]));
    await initializeSpreadsheetTabs();
    const rows = await readTabRows(TABS.EMPLOYEES);
    if (rows.length === 0) {
      const seed = await getSeedData();
      for (const emp of seed.employees) {
        await createEmployee(emp);
      }
      return seed.employees;
    }
    return rows.map((r) => ({
      employee_id: r[0] || '',
      name: r[1] || '',
      phone: r[2] || '',
      designation: r[3] || '',
      location_id: r[4] || '',
      location_name: locMap.get(r[4] || '') || 'Unknown Site',
      status: (r[5] as any) || 'ACTIVE',
    }));
  }
  return await fileGetAllEmployees();
}

export async function getEmployeesByLocation(locationId: string): Promise<Employee[]> {
  const mode = getStorageMode();
  if (mode === 'postgres_sql') {
    return await sqlGetEmployeesByLocation(locationId);
  }
  if (mode === 'google_sheets') {
    const all = await getAllEmployees();
    return all.filter((e) => e.location_id === locationId);
  }
  return await fileGetEmployeesByLocation(locationId);
}

export async function createEmployee(emp: Employee): Promise<void> {
  const mode = getStorageMode();
  if (mode === 'postgres_sql') {
    await sqlCreateEmployee(emp);
    return;
  }
  if (mode === 'google_sheets') {
    await initializeSpreadsheetTabs();
    await appendTabRow(TABS.EMPLOYEES, [
      emp.employee_id,
      emp.name,
      emp.phone,
      emp.designation,
      emp.location_id,
      emp.status,
    ]);
    return;
  }
  await fileCreateEmployee(emp);
}

export async function updateEmployee(emp: Employee): Promise<void> {
  const mode = getStorageMode();
  if (mode === 'postgres_sql') {
    await sqlUpdateEmployee(emp);
    return;
  }
  if (mode === 'google_sheets') {
    const rows = await readTabRows(TABS.EMPLOYEES);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === emp.employee_id) {
        const rowNumber = i + 2;
        await updateTabRow(TABS.EMPLOYEES, rowNumber, [
          emp.employee_id,
          emp.name,
          emp.phone,
          emp.designation,
          emp.location_id,
          emp.status,
        ]);
        return;
      }
    }
    return;
  }
  await fileUpdateEmployee(emp);
}

// ==========================================
// ATTENDANCE REPOSITORY (EMPLOYEES)
// ==========================================

export async function getAttendanceRecords(date?: string): Promise<AttendanceRecord[]> {
  const mode = getStorageMode();
  if (mode === 'postgres_sql') {
    return await sqlGetAttendanceRecords(date);
  }
  if (mode === 'google_sheets') {
    await initializeSpreadsheetTabs();
    const rows = await readTabRows(TABS.ATTENDANCE);
    const records: AttendanceRecord[] = rows.map((r) => ({
      attendance_id: r[0] || '',
      employee_id: r[1] || '',
      name: r[2] || '',
      date: r[3] || '',
      check_in: r[4] || '',
      check_out: r[5] || '-',
      latitude: parseFloat(r[6]) || 0,
      longitude: parseFloat(r[7]) || 0,
      status: (r[8] as any) || 'PRESENT',
    }));

    if (date) {
      return records.filter((r) => r.date === date);
    }
    return records;
  }
  return await fileGetAttendanceRecords(date);
}

export async function recordEmployeeCheckIn(record: AttendanceRecord): Promise<void> {
  const mode = getStorageMode();
  if (mode === 'postgres_sql') {
    await sqlRecordEmployeeCheckIn(record);
    return;
  }
  if (mode === 'google_sheets') {
    await initializeSpreadsheetTabs();
    await appendTabRow(TABS.ATTENDANCE, [
      record.attendance_id,
      record.employee_id,
      record.name,
      record.date,
      record.check_in,
      record.check_out || '-',
      record.latitude,
      record.longitude,
      record.status,
    ]);
    return;
  }
  await fileRecordEmployeeCheckIn(record);
}

export async function recordEmployeeCheckOut(
  attendanceId: string,
  checkOutTime: string
): Promise<void> {
  const mode = getStorageMode();
  if (mode === 'postgres_sql') {
    await sqlRecordEmployeeCheckOut(attendanceId, checkOutTime);
    return;
  }
  if (mode === 'google_sheets') {
    const rows = await readTabRows(TABS.ATTENDANCE);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === attendanceId) {
        const rowNumber = i + 2;
        const updated = [...rows[i]];
        updated[5] = checkOutTime;
        await updateTabRow(TABS.ATTENDANCE, rowNumber, updated);
        return;
      }
    }
    return;
  }
  await fileRecordEmployeeCheckOut(attendanceId, checkOutTime);
}

// ==========================================
// SUPERVISOR ATTENDANCE REPOSITORY
// ==========================================

export async function getSupervisorAttendanceRecords(
  date?: string
): Promise<SupervisorAttendanceRecord[]> {
  const mode = getStorageMode();
  if (mode === 'postgres_sql') {
    return await sqlGetSupervisorAttendanceRecords(date);
  }
  if (mode === 'google_sheets') {
    await initializeSpreadsheetTabs();
    const rows = await readTabRows(TABS.SUPERVISOR_ATTENDANCE);
    const records: SupervisorAttendanceRecord[] = rows.map((r) => ({
      attendance_id: r[0] || '',
      supervisor_id: r[1] || '',
      name: r[2] || '',
      date: r[3] || '',
      check_in: r[4] || '',
      check_out: r[5] || '-',
      latitude: parseFloat(r[6]) || 0,
      longitude: parseFloat(r[7]) || 0,
    }));

    if (date) {
      return records.filter((r) => r.date === date);
    }
    return records;
  }
  return await fileGetSupervisorAttendanceRecords(date);
}

export async function recordSupervisorCheckIn(
  record: SupervisorAttendanceRecord
): Promise<void> {
  const mode = getStorageMode();
  if (mode === 'postgres_sql') {
    await sqlRecordSupervisorCheckIn(record);
    return;
  }
  if (mode === 'google_sheets') {
    await initializeSpreadsheetTabs();
    await appendTabRow(TABS.SUPERVISOR_ATTENDANCE, [
      record.attendance_id,
      record.supervisor_id,
      record.name,
      record.date,
      record.check_in,
      record.check_out || '-',
      record.latitude,
      record.longitude,
    ]);
    return;
  }
  await fileRecordSupervisorCheckIn(record);
}

export async function recordSupervisorCheckOut(
  attendanceId: string,
  checkOutTime: string
): Promise<void> {
  const mode = getStorageMode();
  if (mode === 'postgres_sql') {
    await sqlRecordSupervisorCheckOut(attendanceId, checkOutTime);
    return;
  }
  if (mode === 'google_sheets') {
    const rows = await readTabRows(TABS.SUPERVISOR_ATTENDANCE);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === attendanceId) {
        const rowNumber = i + 2;
        const updated = [...rows[i]];
        updated[5] = checkOutTime;
        await updateTabRow(TABS.SUPERVISOR_ATTENDANCE, rowNumber, updated);
        return;
      }
    }
    return;
  }
  await fileRecordSupervisorCheckOut(attendanceId, checkOutTime);
}
