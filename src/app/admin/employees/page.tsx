import React from 'react';
import { getAllEmployees, getAllLocations } from '@/lib/db';
import AdminEmployeesClient from './AdminEmployeesClient';

export const revalidate = 0;

export default async function AdminEmployeesPage() {
  const [employees, locations] = await Promise.all([getAllEmployees(), getAllLocations()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Master Employee Directory
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Complete company-wide list of employees registered across all site locations.
        </p>
      </div>

      <AdminEmployeesClient employees={employees} locations={locations} />
    </div>
  );
}
