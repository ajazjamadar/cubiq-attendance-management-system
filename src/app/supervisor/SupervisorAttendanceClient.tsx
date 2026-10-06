'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  AuthSession,
  SiteLocation,
  Employee,
  AttendanceRecord,
  SupervisorAttendanceRecord,
} from '@/types';
import { calculateDistanceInMeters } from '@/lib/geo';
import {
  markEmployeeCheckInAction,
  markEmployeeCheckOutAction,
  markSupervisorCheckInAction,
  markSupervisorCheckOutAction,
} from '@/app/actions/attendance';
import {
  MapPin,
  Users,
  CalendarCheck,
  Clock,
  Compass,
  CheckCircle2,
  AlertCircle,
  Crosshair,
  UserCheck,
  Loader2,
  RefreshCw,
  LogOut,
  Sparkles,
} from 'lucide-react';

const MapPicker = dynamic(() => import('@/components/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-xs text-slate-400">
      Loading Site Geofence Map...
    </div>
  ),
});

interface Props {
  session: AuthSession;
  location: SiteLocation | null;
  allLocations: SiteLocation[];
  initialEmployees: Employee[];
  todayAttendance: AttendanceRecord[];
  todaySupervisorAttendance: SupervisorAttendanceRecord[];
}

export default function SupervisorAttendanceClient({
  session,
  location: activeLocation,
  allLocations,
  initialEmployees,
  todayAttendance: initialTodayAttendance,
  todaySupervisorAttendance: initialSupervisorAttendance,
}: Props) {
  const [currentLocation, setCurrentLocation] = useState<SiteLocation | null>(activeLocation);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>(initialTodayAttendance);
  const [supervisorAttendance, setSupervisorAttendance] = useState<SupervisorAttendanceRecord[]>(
    initialSupervisorAttendance
  );

  // GPS state
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Actions state
  const [actionLoading, setActionLoading] = useState<string | null>(null); // employeeId or 'supervisor'
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    details?: string;
  } | null>(null);

  // Acquire Browser GPS
  const getGpsPosition = async (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser.'));
        return;
      }
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: parseFloat(pos.coords.latitude.toFixed(6)),
            lng: parseFloat(pos.coords.longitude.toFixed(6)),
          };
          setUserCoords(coords);
          setGpsLoading(false);
          setGpsError(null);
          resolve(coords);
        },
        (err) => {
          setGpsLoading(false);
          setGpsError(err.message);
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  // Initial GPS fetch on load
  useEffect(() => {
    getGpsPosition().catch(() => {});
  }, []);

  // Distance to current active location
  const distanceToSite =
    userCoords && currentLocation
      ? calculateDistanceInMeters(
          userCoords.lat,
          userCoords.lng,
          currentLocation.latitude,
          currentLocation.longitude
        )
      : null;

  const isWithinGeofence =
    distanceToSite !== null && currentLocation
      ? distanceToSite <= currentLocation.radius
      : false;

  // Simulator helper: snaps GPS to the site coordinates for demonstration/testing
  const handleSimulateAtSite = () => {
    if (!currentLocation) return;
    setUserCoords({
      lat: currentLocation.latitude,
      lng: currentLocation.longitude,
    });
    setGpsError(null);
    setFeedback({
      type: 'success',
      message: 'GPS simulated inside site boundary.',
      details: `Distance: 0m (Allowed: ${currentLocation.radius}m)`,
    });
  };

  // Check if supervisor checked in today
  const mySupervisorRecord = supervisorAttendance.find(
    (s) => s.supervisor_id === session.user_id
  );
  const isSupervisorCheckedIn = !!mySupervisorRecord;
  const isSupervisorCheckedOut =
    isSupervisorCheckedIn &&
    mySupervisorRecord.check_out &&
    mySupervisorRecord.check_out !== '-';

  // Handle Supervisor Check-In
  const handleSupervisorCheckIn = async () => {
    if (!currentLocation) {
      setFeedback({ type: 'error', message: 'No site location selected.' });
      return;
    }

    setActionLoading('supervisor-in');
    setFeedback(null);

    try {
      let coords = userCoords;
      if (!coords) {
        coords = await getGpsPosition();
      }

      const res = await markSupervisorCheckInAction({
        supervisorId: session.user_id,
        supervisorName: session.name,
        locationId: currentLocation.location_id,
        latitude: coords.lat,
        longitude: coords.lng,
      });

      if (!res.success) {
        setFeedback({
          type: 'error',
          message: res.message || 'You are not within your assigned work location.',
          details: res.details,
        });
      } else {
        setSupervisorAttendance([res.record!, ...supervisorAttendance]);
        setFeedback({
          type: 'success',
          message: res.message,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to acquire GPS location for check-in.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Supervisor Check-Out
  const handleSupervisorCheckOut = async () => {
    if (!mySupervisorRecord) return;
    setActionLoading('supervisor-out');
    setFeedback(null);

    const res = await markSupervisorCheckOutAction(mySupervisorRecord.attendance_id);
    if (res.success) {
      const now = new Date().toTimeString().split(' ')[0];
      setSupervisorAttendance(
        supervisorAttendance.map((s) =>
          s.attendance_id === mySupervisorRecord.attendance_id ? { ...s, check_out: now } : s
        )
      );
      setFeedback({ type: 'success', message: res.message });
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
    setActionLoading(null);
  };

  // Handle Employee Check-In
  const handleEmployeeCheckIn = async (employee: Employee) => {
    if (!currentLocation) return;
    setActionLoading(employee.employee_id);
    setFeedback(null);

    try {
      let coords = userCoords;
      if (!coords) {
        coords = await getGpsPosition();
      }

      const res = await markEmployeeCheckInAction({
        employeeId: employee.employee_id,
        employeeName: employee.name,
        locationId: currentLocation.location_id,
        latitude: coords.lat,
        longitude: coords.lng,
      });

      if (!res.success) {
        setFeedback({
          type: 'error',
          message: res.message,
          details: res.details,
        });
      } else {
        setTodayAttendance([res.record!, ...todayAttendance]);
        setFeedback({
          type: 'success',
          message: `${employee.name}: ${res.message}`,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to acquire GPS location.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Employee Check-Out
  const handleEmployeeCheckOut = async (attendanceId: string, employeeName: string) => {
    if (!currentLocation) return;
    setActionLoading(attendanceId);
    setFeedback(null);

    const res = await markEmployeeCheckOutAction({
      attendanceId,
      locationId: currentLocation.location_id,
      latitude: userCoords?.lat,
      longitude: userCoords?.lng,
    });

    if (!res.success) {
      setFeedback({
        type: 'error',
        message: res.message,
        details: res.details,
      });
    } else {
      const now = new Date().toTimeString().split(' ')[0];
      setTodayAttendance(
        todayAttendance.map((rec) =>
          rec.attendance_id === attendanceId ? { ...rec, check_out: now } : rec
        )
      );
      setFeedback({
        type: 'success',
        message: `${employeeName}: ${res.message}`,
      });
    }
    setActionLoading(null);
  };

  const presentCount = initialEmployees.filter((emp) =>
    todayAttendance.some((r) => r.employee_id === emp.employee_id)
  ).length;

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-start justify-between shadow-xs transition ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            )}
            <div>
              <p className="font-bold text-sm">{feedback.message}</p>
              {feedback.details && (
                <p className="text-xs mt-1 text-slate-600 dark:text-slate-300 leading-relaxed font-mono">
                  {feedback.details}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Info & Location Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Supervisor Field Portal
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Site-based attendance with real-time GPS geofence verification.
          </p>
        </div>

        {/* Location Picker (useful if supervisor manages multiple or admin previewing) */}
        {allLocations.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Site:</span>
            <select
              value={currentLocation?.location_id || ''}
              onChange={(e) => {
                const found = allLocations.find((l) => l.location_id === e.target.value);
                if (found) setCurrentLocation(found);
              }}
              className="text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-white shadow-xs focus:ring-2 focus:ring-teal-500"
            >
              {allLocations.map((loc) => (
                <option key={loc.location_id} value={loc.location_id}>
                  {loc.location_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Geofence Status & GPS Monitor Bar */}
      {currentLocation ? (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {currentLocation.location_name}
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{currentLocation.address}</p>
              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 mt-2 font-mono">
                <span>Site Center: {currentLocation.latitude}, {currentLocation.longitude}</span>
                <span>•</span>
                <span className="font-semibold text-teal-700 dark:text-teal-400">
                  Allowed Radius: {currentLocation.radius}m
                </span>
              </div>
            </div>

            {/* GPS Range Indicator */}
            <div className="flex flex-col sm:items-end gap-2">
              {userCoords ? (
                <div
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border ${
                    isWithinGeofence
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isWithinGeofence ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                    }`}
                  />
                  {isWithinGeofence
                    ? `Within Site Geofence (${distanceToSite}m)`
                    : `Outside Allowed Radius (${distanceToSite}m / ${currentLocation.radius}m allowed)`}
                </div>
              ) : (
                <div className="text-xs text-slate-400 dark:text-slate-500">GPS location acquiring...</div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => getGpsPosition()}
                  disabled={gpsLoading}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 transition"
                >
                  <RefreshCw className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} />
                  Refresh GPS
                </button>

                {/* Simulation Button for Testing */}
                <button
                  onClick={handleSimulateAtSite}
                  title="Snap GPS to site coordinates for demo testing"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 dark:text-teal-300 hover:text-teal-800 dark:hover:text-teal-200 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 px-2.5 py-1 rounded-md border border-teal-200 dark:border-teal-800 transition"
                >
                  <Sparkles className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                  Simulate At Site (Demo)
                </button>
              </div>
            </div>
          </div>

          {/* Leaflet Map Visualizer */}
          <div className="mt-3">
            <MapPicker
              initialLat={currentLocation.latitude}
              initialLng={currentLocation.longitude}
              radiusMeters={currentLocation.radius}
              locationName={currentLocation.location_name}
              userLocation={userCoords}
              className="h-56 w-full rounded-xl border border-slate-300 dark:border-slate-700"
            />
          </div>
        </div>
      ) : (
        <div className="p-8 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-amber-900 dark:text-amber-200 text-sm">
          No work location is currently assigned to your account. Please ask an Admin to assign you to a site location.
        </div>
      )}

      {/* Grid: Supervisor Self Attendance Card & Site Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Supervisor Self Attendance */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">My Supervisor Attendance</h3>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Today
            </span>
          </div>

          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Supervisor Name:</div>
            <div className="text-sm font-bold text-slate-800 dark:text-white">{session.name}</div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Check-In:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">
                {mySupervisorRecord ? mySupervisorRecord.check_in : 'Not Checked In'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Check-Out:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">
                {mySupervisorRecord && mySupervisorRecord.check_out !== '-'
                  ? mySupervisorRecord.check_out
                  : 'Pending'}
              </span>
            </div>
          </div>

          {/* Action Button */}
          {!isSupervisorCheckedIn ? (
            <button
              onClick={handleSupervisorCheckIn}
              disabled={actionLoading === 'supervisor-in'}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {actionLoading === 'supervisor-in' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CalendarCheck className="w-4 h-4" />
              )}
              Mark My Check-In (GPS)
            </button>
          ) : !isSupervisorCheckedOut ? (
            <button
              onClick={handleSupervisorCheckOut}
              disabled={actionLoading === 'supervisor-out'}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {actionLoading === 'supervisor-out' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              Mark My Check-Out
            </button>
          ) : (
            <div className="text-center py-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300">
              ✓ Shift Completed for Today
            </div>
          )}
        </div>

        {/* Site Stats */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Site Attendance Stats</h3>
              </div>
              <span className="text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-2.5 py-0.5 rounded-full">
                {currentLocation?.location_name || 'Site'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Total Assigned</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 block">
                  {initialEmployees.length}
                </span>
              </div>
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium block">Marked Present</span>
                <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1 block">{presentCount}</span>
              </div>
              <div className="p-4 bg-amber-50/50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-center">
                <span className="text-xs text-amber-700 dark:text-amber-400 font-medium block">Pending Check-In</span>
                <span className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1 block">
                  {Math.max(0, initialEmployees.length - presentCount)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-teal-50/50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl text-xs text-teal-900 dark:text-teal-200 flex items-center justify-between">
            <span>Only employees within the site radius ({currentLocation?.radius}m) can be checked in.</span>
            <span className="font-bold font-mono">
              Turnout: {initialEmployees.length > 0 ? Math.round((presentCount / initialEmployees.length) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Employees Attendance List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Employee Attendance Checklist</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mark 1-tap GPS verified Check-In and Check-Out for employees on site today.
            </p>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {presentCount} of {initialEmployees.length} Present
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Employee Details</th>
                <th className="px-6 py-3.5">Contact</th>
                <th className="px-6 py-3.5">Today Check-In</th>
                <th className="px-6 py-3.5">Today Check-Out</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {initialEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                    No employees registered under this location yet. Go to{' '}
                    <a href="/supervisor/employees" className="text-teal-600 dark:text-teal-400 font-bold underline">
                      Site Employees
                    </a>{' '}
                    to add workers.
                  </td>
                </tr>
              ) : (
                initialEmployees.map((emp) => {
                  const record = todayAttendance.find((r) => r.employee_id === emp.employee_id);
                  const isCheckedIn = !!record;
                  const isCheckedOut = isCheckedIn && record.check_out && record.check_out !== '-';
                  const isLoading = actionLoading === emp.employee_id || (record && actionLoading === record.attendance_id);

                  return (
                    <tr key={emp.employee_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">{emp.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{emp.designation}</div>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                          {emp.employee_id}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-600 dark:text-slate-400">
                        {emp.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isCheckedIn ? (
                          <div className="flex items-center gap-1.5 text-xs font-mono text-teal-700 dark:text-teal-400 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                            {record.check_in}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500 italic">Not Marked</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isCheckedOut ? (
                          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-700 dark:text-slate-300">
                            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            {record.check_out}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!isCheckedIn ? (
                          <button
                            onClick={() => handleEmployeeCheckIn(emp)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
                          >
                            {isLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            Check-In
                          </button>
                        ) : !isCheckedOut ? (
                          <button
                            onClick={() => handleEmployeeCheckOut(record.attendance_id, emp.name)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
                          >
                            {isLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <LogOut className="w-3.5 h-3.5" />
                            )}
                            Check-Out
                          </button>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
