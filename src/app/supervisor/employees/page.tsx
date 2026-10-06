import React from 'react';
import { getSession } from '@/lib/auth';
import { getAllLocations, getEmployeesByLocation, getAllEmployees } from '@/lib/db';
import SupervisorEmployeesClient from './SupervisorEmployeesClient';

export const revalidate = 0;

export default async function SupervisorEmployeesPage() {
  const session = await getSession();
  const allLocations = await getAllLocations();

  let assignedLocation = allLocations.find((l) => l.supervisor_id === session?.user_id);
  if (!assignedLocation && allLocations.length > 0) {
    assignedLocation = allLocations[0];
  }

  const employees = assignedLocation
    ? await getEmployeesByLocation(assignedLocation.location_id)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Site Employees Management
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Register new field workers for your assigned site and update details.
        </p>
      </div>

      <SupervisorEmployeesClient
        assignedLocation={assignedLocation || null}
        initialEmployees={employees}
      />
    </div>
  );
}
