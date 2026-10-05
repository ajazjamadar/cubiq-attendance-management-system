'use server';

import { findUserByUsername, getAllLocations } from '@/lib/db';
import { verifyPassword, setSessionCookie, clearSessionCookie, getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AuthSession } from '@/types';

export async function loginAction(formData: FormData) {
  const username = (formData.get('username') as string)?.trim();
  const password = (formData.get('password') as string)?.trim();

  if (!username || !password) {
    return { success: false, error: 'Please enter both username and password.' };
  }

  const user = await findUserByUsername(username);
  if (!user) {
    return { success: false, error: 'Invalid username or password.' };
  }

  if (user.status === 'INACTIVE') {
    return { success: false, error: 'This account is inactive. Please contact the administrator.' };
  }

  const isMatch = await verifyPassword(password, user.password_hash);
  if (!isMatch) {
    return { success: false, error: 'Invalid username or password.' };
  }

  // Find assigned location if supervisor
  let assignedLocationId: string | undefined;
  let assignedLocationName: string | undefined;

  if (user.role === 'SUPERVISOR') {
    const locations = await getAllLocations();
    const assignedLoc = locations.find((l) => l.supervisor_id === user.user_id);
    if (assignedLoc) {
      assignedLocationId = assignedLoc.location_id;
      assignedLocationName = assignedLoc.location_name;
    }
  }

  const session: AuthSession = {
    user_id: user.user_id,
    name: user.name,
    username: user.username,
    role: user.role,
    assigned_location_id: assignedLocationId,
    assigned_location_name: assignedLocationName,
  };

  await setSessionCookie(session);

  return {
    success: true,
    role: user.role,
    redirectUrl: user.role === 'ADMIN' ? '/admin' : '/supervisor',
  };
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect('/login');
}

export async function getCurrentSession() {
  return await getSession();
}
