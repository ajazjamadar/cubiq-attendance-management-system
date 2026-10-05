import React from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import StorageModeBanner from '@/components/StorageModeBanner';
import { getStorageMode } from '@/lib/db';

export default async function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || (session.role !== 'SUPERVISOR' && session.role !== 'ADMIN')) {
    redirect('/login');
  }

  const storageMode = getStorageMode();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <StorageModeBanner mode={storageMode} />
      <Navbar session={session} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
