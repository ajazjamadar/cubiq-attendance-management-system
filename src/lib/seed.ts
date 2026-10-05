import bcrypt from 'bcryptjs';
import {
  User,
  SiteLocation,
  Employee,
  AttendanceRecord,
  SupervisorAttendanceRecord,
} from '@/types';

// Standard salt rounds
const SALT = 10;

export async function getSeedData(): Promise<{
  users: User[];
  locations: SiteLocation[];
  employees: Employee[];
  attendance: AttendanceRecord[];
  supervisorAttendance: SupervisorAttendanceRecord[];
}> {
  const adminPasswordHash = await bcrypt.hash('admin123', SALT);
  const supervisorPasswordHash = await bcrypt.hash('sup12345', SALT);

  const today = new Date().toISOString().split('T')[0];

  const users: User[] = [
    {
      user_id: 'USR-ADMIN-1',
      name: 'System Administrator',
      role: 'ADMIN',
      username: 'admin',
      password_hash: adminPasswordHash,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    },
    {
      user_id: 'USR-SUP-1',
      name: 'Salman (Site Supervisor)',
      role: 'SUPERVISOR',
      username: 'supervisor',
      password_hash: supervisorPasswordHash,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    },
  ];

  const locations: SiteLocation[] = [
    {
      location_id: 'LOC-101',
      location_name: 'CUBIQ Site A (Headquarters)',
      address: 'MG Road, Bangalore, Karnataka',
      latitude: 12.9716,
      longitude: 77.5946,
      radius: 100, // 100 meters
      supervisor_id: 'USR-SUP-1',
      supervisor_name: 'Salman (Site Supervisor)',
      status: 'ACTIVE',
    },
    {
      location_id: 'LOC-102',
      location_name: 'CUBIQ Project Site B',
      address: 'Outer Ring Road, Marathahalli, Bangalore',
      latitude: 12.9352,
      longitude: 77.6944,
      radius: 150, // 150 meters
      supervisor_id: 'USR-SUP-1',
      supervisor_name: 'Salman (Site Supervisor)',
      status: 'ACTIVE',
    },
  ];

  const employees: Employee[] = [
    {
      employee_id: 'EMP-001',
      name: 'Sofi Ahmad',
      phone: '+91 9876543210',
      designation: 'Site Engineer',
      location_id: 'LOC-101',
      location_name: 'CUBIQ Site A (Headquarters)',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    },
    {
      employee_id: 'EMP-002',
      name: 'Salman Farooq',
      phone: '+91 9876543211',
      designation: 'Safety Officer',
      location_id: 'LOC-101',
      location_name: 'CUBIQ Site A (Headquarters)',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    },
    {
      employee_id: 'EMP-003',
      name: 'Sohail Akhtar',
      phone: '+91 9876543212',
      designation: 'Modular Interior Lead',
      location_id: 'LOC-101',
      location_name: 'CUBIQ Site A (Headquarters)',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    },
    {
      employee_id: 'EMP-004',
      name: 'Sohail Malik',
      phone: '+91 9876543213',
      designation: 'Foreman',
      location_id: 'LOC-102',
      location_name: 'CUBIQ Project Site B',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    },
    {
      employee_id: 'EMP-005',
      name: 'Sofi Tariq',
      phone: '+91 9876543214',
      designation: 'Modular Technician',
      location_id: 'LOC-102',
      location_name: 'CUBIQ Project Site B',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    },
  ];

  const attendance: AttendanceRecord[] = [
    {
      attendance_id: 'ATT-DEMO-1',
      employee_id: 'EMP-001',
      name: 'Sofi Ahmad',
      date: today,
      check_in: '09:05:12',
      check_out: '-',
      latitude: 12.97162,
      longitude: 77.59461,
      status: 'PRESENT',
      location_name: 'CUBIQ Site A (Headquarters)',
    },
    {
      attendance_id: 'ATT-DEMO-2',
      employee_id: 'EMP-002',
      name: 'Salman Farooq',
      date: today,
      check_in: '08:58:30',
      check_out: '-',
      latitude: 12.97159,
      longitude: 77.59458,
      status: 'PRESENT',
      location_name: 'CUBIQ Site A (Headquarters)',
    },
    {
      attendance_id: 'ATT-DEMO-3',
      employee_id: 'EMP-003',
      name: 'Sohail Akhtar',
      date: today,
      check_in: '09:12:05',
      check_out: '-',
      latitude: 12.9716,
      longitude: 77.5946,
      status: 'PRESENT',
      location_name: 'CUBIQ Site A (Headquarters)',
    },
  ];

  const supervisorAttendance: SupervisorAttendanceRecord[] = [
    {
      attendance_id: 'SUP-ATT-DEMO-1',
      supervisor_id: 'USR-SUP-1',
      name: 'Salman (Site Supervisor)',
      date: today,
      check_in: '08:45:00',
      check_out: '-',
      latitude: 12.9716,
      longitude: 77.5946,
      location_name: 'CUBIQ Site A (Headquarters)',
    },
  ];

  return { users, locations, employees, attendance, supervisorAttendance };
}
