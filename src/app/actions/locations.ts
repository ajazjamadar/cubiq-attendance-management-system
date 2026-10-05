'use server';

import { createLocation, getAllLocations, assignSupervisorToLocation } from '@/lib/db';
import { SiteLocation } from '@/types';
import { revalidatePath } from 'next/cache';

export async function createLocationAction(formData: FormData) {
  const locationName = (formData.get('location_name') as string)?.trim();
  const address = (formData.get('address') as string)?.trim();
  const latitude = parseFloat(formData.get('latitude') as string);
  const longitude = parseFloat(formData.get('longitude') as string);
  const radius = parseFloat(formData.get('radius') as string) || 100;
  const supervisorId = (formData.get('supervisor_id') as string)?.trim() || '';

  if (!locationName) {
    return { success: false, error: 'Location Name is required.' };
  }
  if (isNaN(latitude) || isNaN(longitude)) {
    return { success: false, error: 'Valid Latitude and Longitude are required.' };
  }
  if (isNaN(radius) || radius <= 0) {
    return { success: false, error: 'Radius must be a positive number of meters.' };
  }

  const locationId = `LOC-${Date.now().toString().slice(-5)}`;

  const newLocation: SiteLocation = {
    location_id: locationId,
    location_name: locationName,
    address: address || 'Site Address',
    latitude,
    longitude,
    radius,
    supervisor_id: supervisorId || undefined,
    status: 'ACTIVE',
  };

  try {
    await createLocation(newLocation);
    revalidatePath('/admin/locations');
    revalidatePath('/admin');
    return { success: true, location: newLocation };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create location.' };
  }
}

export async function assignSupervisorAction(locationId: string, supervisorId: string) {
  try {
    await assignSupervisorToLocation(locationId, supervisorId);
    revalidatePath('/admin/locations');
    revalidatePath('/admin/supervisors');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to assign supervisor.' };
  }
}

export async function getLocationsAction() {
  return await getAllLocations();
}
