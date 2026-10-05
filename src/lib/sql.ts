import { Pool } from 'pg';
import {
  User,
  SiteLocation,
  Employee,
  AttendanceRecord,
  SupervisorAttendanceRecord,
  UserStatus,
} from '@/types';
import { getSeedData } from './seed';

let pool: Pool | null = null;
let initialized = false;

export function getDatabaseUrl(): string | null {
  return (
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    null
  );
}

export function isSqlConfigured(): boolean {
  return getDatabaseUrl() !== null;
}

function getPool(): Pool {
  if (!pool) {
    const connectionString = getDatabaseUrl();
    if (!connectionString) {
      throw new Error('Database connection URL (POSTGRES_URL or DATABASE_URL) is not configured.');
    }
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 10,
    });
  }
  return pool;
}

/**
 * Initializes SQL tables and seeds initial data if tables are empty.
 */
export async function initializeSqlTables(): Promise<void> {
  if (initialized || !isSqlConfigured()) return;

  const client = getPool();

  // Create Users table
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(32) NOT NULL,
      username VARCHAR(128) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Locations table
  await client.query(`
    CREATE TABLE IF NOT EXISTS locations (
      location_id VARCHAR(64) PRIMARY KEY,
      location_name VARCHAR(255) NOT NULL,
      address TEXT NOT NULL,
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      radius DOUBLE PRECISION NOT NULL DEFAULT 100,
      supervisor_id VARCHAR(64),
      status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE'
    );
  `);

  // Create Employees table
  await client.query(`
    CREATE TABLE IF NOT EXISTS employees (
      employee_id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(64) NOT NULL,
      designation VARCHAR(128) NOT NULL,
      location_id VARCHAR(64) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Attendance table
  await client.query(`
    CREATE TABLE IF NOT EXISTS attendance (
      attendance_id VARCHAR(64) PRIMARY KEY,
      employee_id VARCHAR(64) NOT NULL,
      name VARCHAR(255) NOT NULL,
      date VARCHAR(32) NOT NULL,
      check_in VARCHAR(32) NOT NULL,
      check_out VARCHAR(32) DEFAULT '-',
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'PRESENT',
      location_name VARCHAR(255)
    );
  `);

  // Create Supervisor Attendance table
  await client.query(`
    CREATE TABLE IF NOT EXISTS supervisor_attendance (
      attendance_id VARCHAR(64) PRIMARY KEY,
      supervisor_id VARCHAR(64) NOT NULL,
      name VARCHAR(255) NOT NULL,
      date VARCHAR(32) NOT NULL,
      check_in VARCHAR(32) NOT NULL,
      check_out VARCHAR(32) DEFAULT '-',
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      location_name VARCHAR(255)
    );
  `);

  // Check if seeding is required
  const userCheck = await client.query('SELECT COUNT(*) as count FROM users');
  if (parseInt(userCheck.rows[0].count) === 0) {
    const seed = await getSeedData();

    for (const u of seed.users) {
      await client.query(
        `INSERT INTO users (user_id, name, role, username, password_hash, status)
         VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
        [u.user_id, u.name, u.role, u.username, u.password_hash, u.status]
      );
    }

    for (const loc of seed.locations) {
      await client.query(
        `INSERT INTO locations (location_id, location_name, address, latitude, longitude, radius, supervisor_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
        [
          loc.location_id,
          loc.location_name,
          loc.address,
          loc.latitude,
          loc.longitude,
          loc.radius,
          loc.supervisor_id,
        ]
      );
    }

    for (const emp of seed.employees) {
      await client.query(
        `INSERT INTO employees (employee_id, name, phone, designation, location_id, status)
         VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
        [emp.employee_id, emp.name, emp.phone, emp.designation, emp.location_id, emp.status]
      );
    }

    for (const att of seed.attendance) {
      await client.query(
        `INSERT INTO attendance (attendance_id, employee_id, name, date, check_in, check_out, latitude, longitude, status, location_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT DO NOTHING`,
        [
          att.attendance_id,
          att.employee_id,
          att.name,
          att.date,
          att.check_in,
          att.check_out,
          att.latitude,
          att.longitude,
          att.status,
          att.location_name,
        ]
      );
    }

    for (const supAtt of seed.supervisorAttendance) {
      await client.query(
        `INSERT INTO supervisor_attendance (attendance_id, supervisor_id, name, date, check_in, check_out, latitude, longitude, location_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT DO NOTHING`,
        [
          supAtt.attendance_id,
          supAtt.supervisor_id,
          supAtt.name,
          supAtt.date,
          supAtt.check_in,
          supAtt.check_out,
          supAtt.latitude,
          supAtt.longitude,
          supAtt.location_name,
        ]
      );
    }
  }

  initialized = true;
}

// ==========================================
// SQL CRUD METHODS
// ==========================================

export async function sqlFindUserByUsername(username: string): Promise<User | null> {
  await initializeSqlTables();
  const pool = getPool();
  const res = await pool.query(
    'SELECT * FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1',
    [username.trim()]
  );
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    user_id: r.user_id,
    name: r.name,
    role: r.role,
    username: r.username,
    password_hash: r.password_hash,
    status: r.status,
    created_at: r.created_at,
  };
}

export async function sqlGetAllUsers(): Promise<User[]> {
  await initializeSqlTables();
  const pool = getPool();
  const res = await pool.query('SELECT * FROM users ORDER BY created_at ASC');
  return res.rows.map((r) => ({
    user_id: r.user_id,
    name: r.name,
    role: r.role,
    username: r.username,
    password_hash: r.password_hash,
    status: r.status,
    created_at: r.created_at,
  }));
}

export async function sqlCreateUser(user: User): Promise<void> {
  await initializeSqlTables();
  const pool = getPool();
  await pool.query(
    `INSERT INTO users (user_id, name, role, username, password_hash, status)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [user.user_id, user.name, user.role, user.username, user.password_hash, user.status]
  );
}

export async function sqlUpdateUserStatus(userId: string, status: UserStatus): Promise<void> {
  await initializeSqlTables();
  const pool = getPool();
  await pool.query('UPDATE users SET status = $1 WHERE user_id = $2', [status, userId]);
}

export async function sqlGetAllLocations(): Promise<SiteLocation[]> {
  await initializeSqlTables();
  const pool = getPool();
  const res = await pool.query(`
    SELECT l.*, u.name as supervisor_name
    FROM locations l
    LEFT JOIN users u ON l.supervisor_id = u.user_id
    ORDER BY l.location_name ASC
  `);
  return res.rows.map((r) => ({
    location_id: r.location_id,
    location_name: r.location_name,
    address: r.address,
    latitude: parseFloat(r.latitude),
    longitude: parseFloat(r.longitude),
    radius: parseFloat(r.radius),
    supervisor_id: r.supervisor_id || '',
    supervisor_name: r.supervisor_name || 'Unassigned',
    status: r.status || 'ACTIVE',
  }));
}

export async function sqlGetLocationById(id: string): Promise<SiteLocation | null> {
  await initializeSqlTables();
  const pool = getPool();
  const res = await pool.query(
    `SELECT l.*, u.name as supervisor_name
     FROM locations l
     LEFT JOIN users u ON l.supervisor_id = u.user_id
     WHERE l.location_id = $1`,
    [id]
  );
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    location_id: r.location_id,
    location_name: r.location_name,
    address: r.address,
    latitude: parseFloat(r.latitude),
    longitude: parseFloat(r.longitude),
    radius: parseFloat(r.radius),
    supervisor_id: r.supervisor_id || '',
    supervisor_name: r.supervisor_name || 'Unassigned',
    status: r.status || 'ACTIVE',
  };
}

export async function sqlCreateLocation(location: SiteLocation): Promise<void> {
  await initializeSqlTables();
  const pool = getPool();
  await pool.query(
    `INSERT INTO locations (location_id, location_name, address, latitude, longitude, radius, supervisor_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      location.location_id,
      location.location_name,
      location.address,
      location.latitude,
      location.longitude,
      location.radius,
      location.supervisor_id || null,
      location.status || 'ACTIVE',
    ]
  );
}

export async function sqlAssignSupervisorToLocation(
  locationId: string,
  supervisorId: string
): Promise<void> {
  await initializeSqlTables();
  const pool = getPool();
  await pool.query('UPDATE locations SET supervisor_id = $1 WHERE location_id = $2', [
    supervisorId,
    locationId,
  ]);
}

export async function sqlGetAllEmployees(): Promise<Employee[]> {
  await initializeSqlTables();
  const pool = getPool();
  const res = await pool.query(`
    SELECT e.*, l.location_name
    FROM employees e
    LEFT JOIN locations l ON e.location_id = l.location_id
    ORDER BY e.name ASC
  `);
  return res.rows.map((r) => ({
    employee_id: r.employee_id,
    name: r.name,
    phone: r.phone,
    designation: r.designation,
    location_id: r.location_id,
    location_name: r.location_name || 'Unknown Site',
    status: r.status,
    created_at: r.created_at,
  }));
}

export async function sqlGetEmployeesByLocation(locationId: string): Promise<Employee[]> {
  await initializeSqlTables();
  const pool = getPool();
  const res = await pool.query(
    `SELECT e.*, l.location_name
     FROM employees e
     LEFT JOIN locations l ON e.location_id = l.location_id
     WHERE e.location_id = $1
     ORDER BY e.name ASC`,
    [locationId]
  );
  return res.rows.map((r) => ({
    employee_id: r.employee_id,
    name: r.name,
    phone: r.phone,
    designation: r.designation,
    location_id: r.location_id,
    location_name: r.location_name || 'Unknown Site',
    status: r.status,
  }));
}

export async function sqlCreateEmployee(emp: Employee): Promise<void> {
  await initializeSqlTables();
  const pool = getPool();
  await pool.query(
    `INSERT INTO employees (employee_id, name, phone, designation, location_id, status)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [emp.employee_id, emp.name, emp.phone, emp.designation, emp.location_id, emp.status]
  );
}

export async function sqlUpdateEmployee(emp: Employee): Promise<void> {
  await initializeSqlTables();
  const pool = getPool();
  await pool.query(
    `UPDATE employees
     SET name = $1, phone = $2, designation = $3, location_id = $4, status = $5
     WHERE employee_id = $6`,
    [emp.name, emp.phone, emp.designation, emp.location_id, emp.status, emp.employee_id]
  );
}

export async function sqlGetAttendanceRecords(date?: string): Promise<AttendanceRecord[]> {
  await initializeSqlTables();
  const pool = getPool();
  let query = 'SELECT * FROM attendance';
  const params: any[] = [];
  if (date) {
    query += ' WHERE date = $1';
    params.push(date);
  }
  query += ' ORDER BY check_in DESC';
  const res = await pool.query(query, params);
  return res.rows.map((r) => ({
    attendance_id: r.attendance_id,
    employee_id: r.employee_id,
    name: r.name,
    date: r.date,
    check_in: r.check_in,
    check_out: r.check_out || '-',
    latitude: parseFloat(r.latitude),
    longitude: parseFloat(r.longitude),
    status: r.status,
    location_name: r.location_name,
  }));
}

export async function sqlRecordEmployeeCheckIn(record: AttendanceRecord): Promise<void> {
  await initializeSqlTables();
  const pool = getPool();
  await pool.query(
    `INSERT INTO attendance (attendance_id, employee_id, name, date, check_in, check_out, latitude, longitude, status, location_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      record.attendance_id,
      record.employee_id,
      record.name,
      record.date,
      record.check_in,
      record.check_out || '-',
      record.latitude,
      record.longitude,
      record.status,
      record.location_name || '',
    ]
  );
}

export async function sqlRecordEmployeeCheckOut(
  attendanceId: string,
  checkOutTime: string
): Promise<void> {
  await initializeSqlTables();
  const pool = getPool();
  await pool.query('UPDATE attendance SET check_out = $1 WHERE attendance_id = $2', [
    checkOutTime,
    attendanceId,
  ]);
}

export async function sqlGetSupervisorAttendanceRecords(
  date?: string
): Promise<SupervisorAttendanceRecord[]> {
  await initializeSqlTables();
  const pool = getPool();
  let query = 'SELECT * FROM supervisor_attendance';
  const params: any[] = [];
  if (date) {
    query += ' WHERE date = $1';
    params.push(date);
  }
  query += ' ORDER BY check_in DESC';
  const res = await pool.query(query, params);
  return res.rows.map((r) => ({
    attendance_id: r.attendance_id,
    supervisor_id: r.supervisor_id,
    name: r.name,
    date: r.date,
    check_in: r.check_in,
    check_out: r.check_out || '-',
    latitude: parseFloat(r.latitude),
    longitude: parseFloat(r.longitude),
    location_name: r.location_name,
  }));
}

export async function sqlRecordSupervisorCheckIn(
  record: SupervisorAttendanceRecord
): Promise<void> {
  await initializeSqlTables();
  const pool = getPool();
  await pool.query(
    `INSERT INTO supervisor_attendance (attendance_id, supervisor_id, name, date, check_in, check_out, latitude, longitude, location_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      record.attendance_id,
      record.supervisor_id,
      record.name,
      record.date,
      record.check_in,
      record.check_out || '-',
      record.latitude,
      record.longitude,
      record.location_name || '',
    ]
  );
}

export async function sqlRecordSupervisorCheckOut(
  attendanceId: string,
  checkOutTime: string
): Promise<void> {
  await initializeSqlTables();
  const pool = getPool();
  await pool.query('UPDATE supervisor_attendance SET check_out = $1 WHERE attendance_id = $2', [
    checkOutTime,
    attendanceId,
  ]);
}
