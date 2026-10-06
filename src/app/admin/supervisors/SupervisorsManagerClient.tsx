'use client';

import React, { useState } from 'react';
import { User, SiteLocation, UserStatus } from '@/types';
import { createSupervisorAction, toggleUserStatusAction } from '@/app/actions/supervisors';
import {
  UserCheck,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  RefreshCw,
  X,
  AlertCircle,
  MapPin,
  Loader2,
  KeyRound,
} from 'lucide-react';

interface Props {
  initialSupervisors: User[];
  locations: SiteLocation[];
}

export default function SupervisorsManagerClient({ initialSupervisors, locations }: Props) {
  const [supervisors, setSupervisors] = useState<User[]>(initialSupervisors);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form inputs
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [locationId, setLocationId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Newly created credentials pop-up
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    username: string;
    plainPassword: string;
    locationName?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Helper generators
  const handleAutoGenerate = () => {
    if (!name) {
      setError('Please type supervisor name first.');
      return;
    }
    const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    setUsername(`${clean}${rand}`);

    const chars = 'abcdefghjkmnpqrstuvwxyz23456789!@#$';
    let pass = 'sup-';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
    setError(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('username', username);
    formData.append('password', password);
    formData.append('location_id', locationId);

    const res = await createSupervisorAction(formData);
    if (!res.success) {
      setError(res.error || 'Failed to create supervisor');
      setLoading(false);
    } else {
      const assignedLoc = locations.find((l) => l.location_id === locationId);
      const newUser: User = {
        user_id: res.user!.user_id,
        name: res.user!.name,
        role: 'SUPERVISOR',
        username: res.user!.username,
        password_hash: '***',
        status: 'ACTIVE',
      };

      setSupervisors([newUser, ...supervisors]);
      setCreatedCredentials({
        name: res.user!.name,
        username: res.user!.username,
        plainPassword: res.user!.plainPassword,
        locationName: assignedLoc?.location_name,
      });

      // Reset form
      setName('');
      setUsername('');
      setPassword('');
      setLocationId('');
      setIsModalOpen(false);
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: UserStatus) => {
    const res = await toggleUserStatusAction(userId, currentStatus);
    if (res.success) {
      setSupervisors(
        supervisors.map((s) => (s.user_id === userId ? { ...s, status: res.status! } : s))
      );
    }
  };

  const copyCredentials = () => {
    if (!createdCredentials) return;
    const text = `CUBIQ Attendance Login:\nURL: ${window.location.origin}/login\nUsername: ${createdCredentials.username}\nPassword: ${createdCredentials.plainPassword}\nAssigned Site: ${createdCredentials.locationName || 'To be assigned'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Alert with generated credentials */}
      {createdCredentials && (
        <div className="p-5 bg-teal-50 dark:bg-teal-950/70 border-2 border-teal-500/50 dark:border-teal-700/80 rounded-2xl shadow-sm text-slate-800 dark:text-slate-100 space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h3 className="font-bold text-teal-900 dark:text-teal-200 text-sm">
                Supervisor Login Credentials Generated
              </h3>
            </div>
            <button
              onClick={() => setCreatedCredentials(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300">
            Share these login details with <strong>{createdCredentials.name}</strong>. The password
            is stored as an encrypted hash in Google Sheets.
          </p>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-teal-200 dark:border-teal-800 font-mono text-xs space-y-1">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Username:</span>{' '}
              <span className="font-bold text-slate-900 dark:text-white">{createdCredentials.username}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Password:</span>{' '}
              <span className="font-bold text-teal-700 dark:text-teal-400">{createdCredentials.plainPassword}</span>
            </div>
            {createdCredentials.locationName && (
              <div>
                <span className="text-slate-500 dark:text-slate-400">Assigned Site:</span>{' '}
                <span className="text-slate-800 dark:text-slate-200 font-semibold">{createdCredentials.locationName}</span>
              </div>
            )}
          </div>

          <button
            onClick={copyCredentials}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                Copied to Clipboard!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Login Details
              </>
            )}
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs transition-colors">
        <div className="text-sm text-slate-600 dark:text-slate-300">
          Showing <span className="font-bold text-slate-900 dark:text-white">{supervisors.length}</span> site
          supervisors
        </div>
        <button
          onClick={() => {
            setError(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          Create Supervisor
        </button>
      </div>

      {/* Supervisors Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Supervisor Name</th>
                <th className="px-6 py-3.5">Username</th>
                <th className="px-6 py-3.5">Assigned Site Location</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {supervisors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 dark:text-slate-500 text-sm">
                    No supervisors found. Click "Create Supervisor" to register one.
                  </td>
                </tr>
              ) : (
                supervisors.map((s) => {
                  const assignedLoc = locations.find((l) => l.supervisor_id === s.user_id);
                  const isActive = s.status === 'ACTIVE';

                  return (
                    <tr key={s.user_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                          {s.name}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">ID: {s.user_id}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                        {s.username}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {assignedLoc ? (
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                            <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                            <span>{assignedLoc.location_name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            isActive
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(s.user_id, s.status)}
                          className={`text-xs font-semibold px-3 py-1 rounded-lg border transition ${
                            isActive
                              ? 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/40'
                              : 'text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                        >
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Supervisor */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-300 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Create Site Supervisor</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Salman (Site Supervisor)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Username
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoGenerate}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Auto-generated if left blank"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="text"
                  placeholder="Auto-generated if left blank"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-xs"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                  Password will be hashed using bcrypt before persisting to Google Sheets.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Assign to Work Location
                </label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">-- Select Location --</option>
                  {locations.map((loc) => (
                    <option key={loc.location_id} value={loc.location_id}>
                      {loc.location_name} ({loc.address})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold shadow-xs transition disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Supervisor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
