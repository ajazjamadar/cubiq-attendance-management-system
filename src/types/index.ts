export type UserRole = 'ADMIN' | 'SUPERVISOR';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'CHECKED_IN';

export interface User {
  user_id: string;
  name: string;
  role: UserRole;
  username: string;
  password_hash: string;
  status: UserStatus;
  created_at?: string;
}

export interface SiteLocation {
  location_id: string;
  location_name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  supervisor_id?: string;
  supervisor_name?: string;
  status?: UserStatus;
}

export interface Employee {
  employee_id: string;
  name: string;
  phone: string;
  designation: string;
  location_id: string;
  location_name?: string;
  status: UserStatus;
  created_at?: string;
}

export interface AttendanceRecord {
  attendance_id: string;
  employee_id: string;
  name: string;
  date: string; // YYYY-MM-DD
  check_in: string; // HH:mm:ss
  check_out: string; // HH:mm:ss or '-'
  latitude: number;
  longitude: number;
  status: AttendanceStatus;
  location_name?: string;
}

export interface SupervisorAttendanceRecord {
  attendance_id: string;
  supervisor_id: string;
  name: string;
  date: string; // YYYY-MM-DD
  check_in: string; // HH:mm:ss
  check_out: string; // HH:mm:ss or '-'
  latitude: number;
  longitude: number;
  location_name?: string;
}

export interface AuthSession {
  user_id: string;
  name: string;
  username: string;
  role: UserRole;
  assigned_location_id?: string;
  assigned_location_name?: string;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface CheckInValidationResult {
  isValid: boolean;
  distanceMeters: number;
  allowedRadiusMeters: number;
  message: string;
}
