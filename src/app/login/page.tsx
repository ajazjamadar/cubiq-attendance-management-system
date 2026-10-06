'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/app/actions/auth';
import {
  Lock,
  User,
  ArrowRight,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  MapPin,
  Clock,
  Banknote,
  Sparkles,
  Code2,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const res = await loginAction(formData);
      if (!res.success) {
        setError(res.error || 'Failed to authenticate');
        setLoading(false);
      } else {
        router.push(res.redirectUrl || '/');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-slate-50 via-slate-100 to-teal-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/60 text-slate-800 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-teal-400/10 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/5 dark:bg-teal-400/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Floating Bar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="CUBIQ Logo"
            className="h-9 w-9 object-contain rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 shadow-xs"
          />
          <div className="flex flex-col">
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              CUBIQ
              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-100/70 dark:bg-teal-950 border border-teal-200/60 dark:border-teal-800 px-1.5 py-0.2 rounded-md">
                Attendance
              </span>
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Interior & Modular
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Showcase */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Visual Representation & Highlights (Hidden on small, prominent on lg) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-100/80 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/80 w-fit shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Next-Gen Enterprise Site Management</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                GPS Geofenced Attendance & Automated Payroll
              </h1>
              <p className="text-sm xl:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Seamless site attendance tracking with cryptographic geofence radius validation, automated shift classifications, and real-time compensation calculations.
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 backdrop-blur-xs shadow-2xs">
                <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 shrink-0 border border-teal-200 dark:border-teal-900">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    GPS Geofence Verification
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Strict boundary radius enforcement ensures check-ins occur strictly inside active site coordinates.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 backdrop-blur-xs shadow-2xs">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 shrink-0 border border-blue-200 dark:border-blue-900">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Automated Salary & Leaves Engine
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Calculates full days, half days (4-7h), and auto-deducted leaves on a standard 26-day monthly base.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 backdrop-blur-xs shadow-2xs">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 shrink-0 border border-purple-200 dark:border-purple-900">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Multi-Role Architecture
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Dedicated portals for Administrators and Site Supervisors with instant CSV report generation.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Tag */}
            <div className="flex items-center gap-6 pt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Zero Latency Geofencing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Google Sheets & SQL Sync</span>
              </div>
            </div>
          </div>

          {/* Right Column: High-End Glassmorphic Login Form */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/40 border border-slate-300 dark:border-slate-800 p-7 sm:p-9 transition-all">
              
              {/* Brand Centerpiece */}
              <div className="text-center">
                <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-teal-50 to-slate-100 dark:from-slate-800 dark:to-teal-950/40 border border-slate-300 dark:border-slate-700/80 shadow-md">
                  <img
                    src="/logo.png"
                    alt="CUBIQ"
                    className="h-14 w-14 object-contain drop-shadow-md"
                  />
                </div>
                <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Welcome to CUBIQ
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Enter your credentials to securely access your portal
                </p>
              </div>

              {/* Login Form */}
              <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
                {error && (
                  <div className="p-3.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 rounded-xl text-xs font-medium text-red-700 dark:text-red-300 flex items-center gap-2.5 animate-in fade-in duration-200">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Username Input */}
                <div>
                  <label
                    htmlFor="username"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5"
                  >
                    Username or Email
                  </label>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. admin or supervisor_north"
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* Password Input with Visibility Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="password"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                    >
                      Password
                    </label>
                  </div>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="block w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                      tabIndex={-1}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Security Access...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to Portal</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Security Pill */}
              <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-center">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  Encrypted Session • GPS Geofenced Verification
                </span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Modern Developer Credit Footer */}
      <footer className="w-full py-5 px-4 sm:px-6 relative z-10 border-t border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          
          {/* System Tag */}
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              CUBIQ Systems
            </span>
            <span>•</span>
            <span>Attendance & Platform Engine v2.0</span>
          </div>

          {/* User Requested Developer Signature Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs shadow-2xs">
            <Code2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              Build and Developed by <strong className="font-bold text-slate-900 dark:text-white">MD Ejazuddin Jamadar</strong> | <span className="text-teal-700 dark:text-teal-400 font-semibold">Software & Platform Engineer</span>.
            </span>
          </div>

        </div>
      </footer>
    </div>
  );
}
