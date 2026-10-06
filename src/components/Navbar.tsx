'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Boxes,
  MapPin,
  Users,
  UserCheck,
  FileSpreadsheet,
  LogOut,
  CalendarCheck,
  ShieldAlert,
  Banknote,
} from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';
import { AuthSession } from '@/types';
import ThemeToggle from '@/components/ThemeToggle';

interface NavbarProps {
  session: AuthSession;
}

export default function Navbar({ session }: NavbarProps) {
  const pathname = usePathname();
  const isAdmin = session.role === 'ADMIN';

  const adminLinks = [
    { href: '/admin', label: 'Dashboard', icon: Boxes },
    { href: '/admin/locations', label: 'Locations', icon: MapPin },
    { href: '/admin/supervisors', label: 'Supervisors', icon: ShieldAlert },
    { href: '/admin/employees', label: 'Employees', icon: Users },
    { href: '/admin/reports', label: 'Reports & Export', icon: FileSpreadsheet },
    { href: '/admin/payroll', label: 'Payroll & Salary', icon: Banknote },
  ];

  const supervisorLinks = [
    { href: '/supervisor', label: 'Today Attendance', icon: CalendarCheck },
    { href: '/supervisor/employees', label: 'Site Employees', icon: Users },
    { href: '/supervisor/history', label: 'History', icon: FileSpreadsheet },
  ];

  const navLinks = isAdmin ? adminLinks : supervisorLinks;

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link
              href={isAdmin ? '/admin' : '/supervisor'}
              className="flex items-center gap-3 group"
            >
              <img
                src="/logo.png"
                alt="CUBIQ Logo"
                className="h-10 w-10 object-contain rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-2xs group-hover:scale-105 transition bg-white dark:bg-slate-800 p-0.5"
              />
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition flex items-center gap-1.5">
                  CUBIQ
                  <span className="text-[10px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 border border-teal-200/60 dark:border-teal-800 px-1.5 py-0.2 rounded">
                    Attendance
                  </span>
                </span>
                <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-400 tracking-wider">
                  Interior & Modular
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-400'}`} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{session.name}</span>
              <div className="flex items-center justify-end gap-1.5">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isAdmin
                      ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                      : 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                  }`}
                >
                  {session.role}
                </span>
                {session.assigned_location_name && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                    • {session.assigned_location_name}
                  </span>
                )}
              </div>
            </div>

            {/* Dark Mode Theme Toggle */}
            <ThemeToggle />

            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-900"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </form>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-between border-t border-slate-100 dark:border-slate-800 py-2 overflow-x-auto gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
