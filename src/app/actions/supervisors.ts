'use server';

import {
  createUser,
  getAllUsers,
  updateUserStatus,
  getAllLocations,
  assignSupervisorToLocation,
} from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { User, UserStatus } from '@/types';
import { revalidatePath } from 'next/cache';

export async function createSupervisorAction(formData: FormData) {
  const name = (formData.get('name') as string)?.trim();
  let username = (formData.get('username') as string)?.trim().toLowerCase();
  let password = (formData.get('password') as string)?.trim();
  const locationId = (formData.get('location_id') as string)?.trim();

  if (!name) {
    return { success: false, error: 'Supervisor Name is required.' };
  }

  // Auto-generate username if omitted
  if (!username) {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    username = `${cleanName}${Math.floor(100 + Math.random() * 900)}`;
  }

  // Auto-generate password if omitted
  if (!password) {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let generated = 'sup-';
    for (let i = 0; i < 6; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    password = generated;
  }

  const existingUsers = await getAllUsers();
  if (existingUsers.some((u) => u.username.toLowerCase() === username)) {
    return { success: false, error: `Username "${username}" already exists. Please pick another.` };
  }

  const userId = `USR-SUP-${Date.now().toString().slice(-4)}`;
  const passwordHash = await hashPassword(password);

  const newUser: User = {
    user_id: userId,
    name,
    role: 'SUPERVISOR',
    username,
    password_hash: passwordHash,
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
  };

  try {
    await createUser(newUser);

    // If location selected, assign immediately
    if (locationId) {
      await assignSupervisorToLocation(locationId, userId);
    }

    revalidatePath('/admin/supervisors');
    revalidatePath('/admin/locations');

    return {
      success: true,
      user: {
        user_id: newUser.user_id,
        name: newUser.name,
        username: newUser.username,
        plainPassword: password, // Returned once so admin can copy and share with supervisor
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create supervisor.' };
  }
}

export async function toggleUserStatusAction(userId: string, currentStatus: UserStatus) {
  const newStatus: UserStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  try {
    await updateUserStatus(userId, newStatus);
    revalidatePath('/admin/supervisors');
    return { success: true, status: newStatus };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update user status.' };
  }
}

export async function getSupervisorsAction() {
  const users = await getAllUsers();
  const locations = await getAllLocations();

  const supervisors = users.filter((u) => u.role === 'SUPERVISOR');

  return supervisors.map((s) => {
    const assignedLoc = locations.find((l) => l.supervisor_id === s.user_id);
    return {
      ...s,
      assigned_location_id: assignedLoc?.location_id,
      assigned_location_name: assignedLoc?.location_name,
    };
  });
}
