import fs from 'fs';
import path from 'path';
import {
  User,
  SiteLocation,
  Employee,
  AttendanceRecord,
  SupervisorAttendanceRecord,
  UserStatus,
} from '@/types';
import { getSeedData } from './seed';

interface DatabaseSchema {
  users: User[];
  locations: SiteLocation[];
  employees: Employee[];
  attendance: AttendanceRecord[];
  supervisorAttendance: SupervisorAttendanceRecord[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'cubic_database.json');

// Memory cache to avoid synchronous disk bottleneck on rapid reads
let cachedData: DatabaseSchema | null = null;

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

async function loadData(): Promise<DatabaseSchema> {
  if (cachedData) return cachedData;

  ensureDataDirectory();

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      cachedData = JSON.parse(raw);
      if (cachedData && Array.isArray(cachedData.users) && cachedData.users.length > 0) {
        return cachedData;
      }
    } catch (err) {
      console.error('Error reading local database file, reinitializing:', err);
    }
  }

  // Initialize with seed data
  const seed = await getSeedData();
  cachedData = {
    users: [...seed.users],
    locations: [...seed.locations],
    employees: [...seed.employees],
    attendance: [...seed.attendance],
    supervisorAttendance: [...seed.supervisorAttendance],
  };

  saveData(cachedData);
  return cachedData;
}

function saveData(data: DatabaseSchema) {
  try {
    ensureDataDirectory();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    cachedData = data;
  } catch (err) {
    console.error('Failed to save to local database file:', err);
  }
}

// ==========================================
// REPOSITORY METHODS
// ==========================================

export async function fileFindUserByUsername(username: string): Promise<User | null> {
  const db = await loadData();
  const normalized = username.trim().toLowerCase();
  return (
    db.users.find((u) => {
      const uName = u.username.toLowerCase();
      const fullName = u.name.toLowerCase();
      if (uName === normalized || fullName === normalized) return true;
      if (
        u.role === 'ADMIN' &&
        ['admin', 'md afnan', 'mdafnan', 'afnan@cubiq.com', 'afnan'].includes(normalized)
      ) {
        return true;
      }
      return false;
    }) || null
  );
}

export async function fileGetAllUsers(): Promise<User[]> {
  const db = await loadData();
  return [...db.users];
}

export async function fileCreateUser(user: User): Promise<void> {
  const db = await loadData();
  db.users.push(user);
  saveData(db);
}

export async function fileUpdateUserStatus(userId: string, status: UserStatus): Promise<void> {
  const db = await loadData();
  const user = db.users.find((u) => u.user_id === userId);
  if (user) {
    user.status = status;
    saveData(db);
  }
}

export async function fileGetAllLocations(): Promise<SiteLocation[]> {
  const db = await loadData();
  const userMap = new Map(db.users.map((u) => [u.user_id, u.name]));
  return db.locations.map((loc) => ({
    ...loc,
    supervisor_name: loc.supervisor_id ? userMap.get(loc.supervisor_id) || 'Unassigned' : 'Unassigned',
  }));
}

export async function fileGetLocationById(id: string): Promise<SiteLocation | null> {
  const locations = await fileGetAllLocations();
  return locations.find((l) => l.location_id === id) || null;
}

export async function fileCreateLocation(location: SiteLocation): Promise<void> {
  const db = await loadData();
  db.locations.push(location);
  saveData(db);
}

export async function fileAssignSupervisorToLocation(
  locationId: string,
  supervisorId: string
): Promise<void> {
  const db = await loadData();
  const loc = db.locations.find((l) => l.location_id === locationId);
  if (loc) {
    loc.supervisor_id = supervisorId;
    saveData(db);
  }
}

export async function fileGetAllEmployees(): Promise<Employee[]> {
  const db = await loadData();
  const locMap = new Map(db.locations.map((l) => [l.location_id, l.location_name]));
  return db.employees.map((e) => ({
    ...e,
    location_name: locMap.get(e.location_id) || 'Unknown Site',
  }));
}

export async function fileGetEmployeesByLocation(locationId: string): Promise<Employee[]> {
  const all = await fileGetAllEmployees();
  return all.filter((e) => e.location_id === locationId);
}

export async function fileCreateEmployee(emp: Employee): Promise<void> {
  const db = await loadData();
  db.employees.push(emp);
  saveData(db);
}

export async function fileUpdateEmployee(emp: Employee): Promise<void> {
  const db = await loadData();
  const idx = db.employees.findIndex((e) => e.employee_id === emp.employee_id);
  if (idx !== -1) {
    db.employees[idx] = { ...db.employees[idx], ...emp };
    saveData(db);
  }
}

export async function fileGetAttendanceRecords(date?: string): Promise<AttendanceRecord[]> {
  const db = await loadData();
  if (date) {
    return db.attendance.filter((r) => r.date === date);
  }
  return [...db.attendance];
}

export async function fileRecordEmployeeCheckIn(record: AttendanceRecord): Promise<void> {
  const db = await loadData();
  db.attendance.push(record);
  saveData(db);
}

export async function fileRecordEmployeeCheckOut(
  attendanceId: string,
  checkOutTime: string
): Promise<void> {
  const db = await loadData();
  const rec = db.attendance.find((r) => r.attendance_id === attendanceId);
  if (rec) {
    rec.check_out = checkOutTime;
    saveData(db);
  }
}

export async function fileGetSupervisorAttendanceRecords(
  date?: string
): Promise<SupervisorAttendanceRecord[]> {
  const db = await loadData();
  if (date) {
    return db.supervisorAttendance.filter((r) => r.date === date);
  }
  return [...db.supervisorAttendance];
}

export async function fileRecordSupervisorCheckIn(
  record: SupervisorAttendanceRecord
): Promise<void> {
  const db = await loadData();
  db.supervisorAttendance.push(record);
  saveData(db);
}

export async function fileRecordSupervisorCheckOut(
  attendanceId: string,
  checkOutTime: string
): Promise<void> {
  const db = await loadData();
  const rec = db.supervisorAttendance.find((r) => r.attendance_id === attendanceId);
  if (rec) {
    rec.check_out = checkOutTime;
    saveData(db);
  }
}
