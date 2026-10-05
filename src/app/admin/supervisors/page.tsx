import React from 'react';
import { getAllUsers, getAllLocations } from '@/lib/db';
import SupervisorsManagerClient from './SupervisorsManagerClient';

export const revalidate = 0;

export default async function AdminSupervisorsPage() {
  const [users, locations] = await Promise.all([getAllUsers(), getAllLocations()]);

  const supervisors = users.filter((u) => u.role === 'SUPERVISOR');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Site Supervisors Management
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Register new site supervisors, auto-generate login credentials, assign site locations, and manage active status.
        </p>
      </div>

      <SupervisorsManagerClient initialSupervisors={supervisors} locations={locations} />
    </div>
  );
}
