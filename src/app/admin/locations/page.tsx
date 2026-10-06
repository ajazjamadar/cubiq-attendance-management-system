import React from 'react';
import { getAllLocations, getAllUsers } from '@/lib/db';
import LocationsManagerClient from './LocationsManagerClient';

export const revalidate = 0;

export default async function AdminLocationsPage() {
  const [locations, users] = await Promise.all([getAllLocations(), getAllUsers()]);
  const supervisors = users.filter((u) => u.role === 'SUPERVISOR');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Site Locations Management
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Create job sites, define geofence allowed radius (in meters), and assign site supervisors.
        </p>
      </div>

      <LocationsManagerClient initialLocations={locations} supervisors={supervisors} />
    </div>
  );
}
