'use server';

import {
  createEmployee,
  updateEmployee,
  getAllEmployees,
  getEmployeesByLocation,
  getLocationById,
} from '@/lib/db';
import { Employee, UserStatus } from '@/types';
import { revalidatePath } from 'next/cache';

export async function createEmployeeAction(formData: FormData) {
  const name = (formData.get('name') as string)?.trim();
  const phone = (formData.get('phone') as string)?.trim();
  const designation = (formData.get('designation') as string)?.trim();
  const locationId = (formData.get('location_id') as string)?.trim();

  if (!name || !phone || !designation || !locationId) {
    return { success: false, error: 'All fields (Name, Phone, Designation, Location) are required.' };
  }

  const location = await getLocationById(locationId);
  const locationName = location ? location.location_name : 'Site';

  // Generate employee ID like EMP-4921
  const employeeId = `EMP-${Date.now().toString().slice(-4)}`;

  const newEmployee: Employee = {
    employee_id: employeeId,
    name,
    phone,
    designation,
    location_id: locationId,
    location_name: locationName,
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
  };

  try {
    await createEmployee(newEmployee);
    revalidatePath('/supervisor');
    revalidatePath('/supervisor/employees');
    revalidatePath('/admin/employees');
    revalidatePath('/admin');
    return { success: true, employee: newEmployee };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create employee.' };
  }
}

export async function updateEmployeeAction(formData: FormData) {
  const employeeId = (formData.get('employee_id') as string)?.trim();
  const name = (formData.get('name') as string)?.trim();
  const phone = (formData.get('phone') as string)?.trim();
  const designation = (formData.get('designation') as string)?.trim();
  const locationId = (formData.get('location_id') as string)?.trim();
  const status = ((formData.get('status') as string)?.trim() as UserStatus) || 'ACTIVE';

  if (!employeeId || !name || !phone || !designation || !locationId) {
    return { success: false, error: 'All fields are required.' };
  }

  const location = await getLocationById(locationId);

  const updatedEmployee: Employee = {
    employee_id: employeeId,
    name,
    phone,
    designation,
    location_id: locationId,
    location_name: location ? location.location_name : undefined,
    status,
  };

  try {
    await updateEmployee(updatedEmployee);
    revalidatePath('/supervisor');
    revalidatePath('/supervisor/employees');
    revalidatePath('/admin/employees');
    return { success: true, employee: updatedEmployee };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update employee.' };
  }
}

export async function getEmployeesAction(locationId?: string) {
  if (locationId) {
    return await getEmployeesByLocation(locationId);
  }
  return await getAllEmployees();
}
