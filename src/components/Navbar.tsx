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
} from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';
import { AuthSession } from '@/types';

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
  ];

  const supervisorLinks = [
    { href: '/supervisor', label: 'Today Attendance', icon: CalendarCheck },
    { href: '/supervisor/employees', label: 'Site Employees', icon: Users },
    { href: '/supervisor/history', label: 'History', icon: FileSpreadsheet },
  ];

  const navLinks = isAdmin ? adminLinks : supervisorLinks;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
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
                className="h-10 w-auto object-contain rounded-lg border border-slate-200/80 shadow-2xs group-hover:scale-105 transition"
              />
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-slate-900 group-hover:text-teal-600 transition flex items-center gap-1.5">
                  CUBIQ
                  <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 border border-teal-200/60 px-1.5 py-0.2 rounded">
                    Attendance
                  </span>
                </span>
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
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
                        ? 'bg-teal-50 text-teal-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-800">{session.name}</span>
              <div className="flex items-center justify-end gap-1.5">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isAdmin
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : 'bg-teal-100 text-teal-800 border border-teal-200'
                  }`}
                >
                  {session.role}
                </span>
                {session.assigned_location_name && (
                  <span className="text-xs text-slate-500 truncate max-w-[120px]">
                    • {session.assigned_location_name}
                  </span>
                )}
              </div>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition border border-slate-200 hover:border-red-200"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </form>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-between border-t border-slate-100 py-2 overflow-x-auto gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-100 text-teal-800 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
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
