'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { SiteLocation, User } from '@/types';
import { createLocationAction, assignSupervisorAction } from '@/app/actions/locations';
import {
  MapPin,
  Plus,
  Compass,
  Check,
  AlertCircle,
  X,
  Crosshair,
  UserCheck,
  Eye,
  Loader2,
} from 'lucide-react';

// Dynamic import to avoid SSR issues with Leaflet
const MapPicker = dynamic(() => import('@/components/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-xs text-slate-400">
      Loading interactive map...
    </div>
  ),
});

interface Props {
  initialLocations: SiteLocation[];
  supervisors: User[];
}

export default function LocationsManagerClient({ initialLocations, supervisors }: Props) {
  const [locations, setLocations] = useState<SiteLocation[]>(initialLocations);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocationForMap, setSelectedLocationForMap] = useState<SiteLocation | null>(null);

  // Form State
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(12.9716);
  const [longitude, setLongitude] = useState(77.5946);
  const [radius, setRadius] = useState(100);
  const [supervisorId, setSupervisorId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [detectingGps, setDetectingGps] = useState(false);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(parseFloat(pos.coords.latitude.toFixed(6)));
        setLongitude(parseFloat(pos.coords.longitude.toFixed(6)));
        setDetectingGps(false);
      },
      (err) => {
        alert(`Failed to get location: ${err.message}`);
        setDetectingGps(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('location_name', locationName);
    formData.append('address', address);
    formData.append('latitude', latitude.toString());
    formData.append('longitude', longitude.toString());
    formData.append('radius', radius.toString());
    formData.append('supervisor_id', supervisorId);

    const res = await createLocationAction(formData);
    if (!res.success) {
      setError(res.error || 'Failed to create location');
      setLoading(false);
    } else {
      setLocations([res.location!, ...locations]);
      setSuccessMsg(`Site location "${locationName}" created successfully!`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setIsModalOpen(false);
      // Reset form
      setLocationName('');
      setAddress('');
      setRadius(100);
      setSupervisorId('');
      setLoading(false);
    }
  };

  const handleSupervisorReassign = async (locId: string, newSupId: string) => {
    const res = await assignSupervisorAction(locId, newSupId);
    if (res.success) {
      setLocations(
        locations.map((loc) => {
          if (loc.location_id === locId) {
            const sup = supervisors.find((s) => s.user_id === newSupId);
            return {
              ...loc,
              supervisor_id: newSupId,
              supervisor_name: sup ? sup.name : 'Unassigned',
            };
          }
          return loc;
        })
      );
    }
  };

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-medium text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}>
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="text-sm text-slate-600">
          Showing <span className="font-bold text-slate-900">{locations.length}</span> site
          locations
        </div>
        <button
          onClick={() => {
            setError(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          Add Site Location
        </button>
      </div>

      {/* Locations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 text-slate-500 text-xs font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Site Name & Address</th>
                <th className="px-6 py-3.5">GPS Coordinates</th>
                <th className="px-6 py-3.5">Geofence Radius</th>
                <th className="px-6 py-3.5">Assigned Supervisor</th>
                <th className="px-6 py-3.5 text-right">Map View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {locations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-sm">
                    No site locations found. Click "Add Site Location" to create one.
                  </td>
                </tr>
              ) : (
                locations.map((loc) => (
                  <tr key={loc.location_id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{loc.location_name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{loc.address}</div>
                      <span className="text-[10px] font-mono text-slate-400 mt-1 inline-block">
                        ID: {loc.location_id}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-teal-600" />
                        {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                        {loc.radius} meters
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={loc.supervisor_id || ''}
                        onChange={(e) => handleSupervisorReassign(loc.location_id, e.target.value)}
                        className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="">-- Unassigned --</option>
                        {supervisors.map((s) => (
                          <option key={s.user_id} value={s.user_id}>
                            {s.name} ({s.username})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedLocationForMap(loc)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Geofence
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View Geofence Map */}
      {selectedLocationForMap && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="font-bold text-slate-900">
                    {selectedLocationForMap.location_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Geofence Radius: {selectedLocationForMap.radius}m • Coordinates:{' '}
                    {selectedLocationForMap.latitude}, {selectedLocationForMap.longitude}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLocationForMap(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <MapPicker
              initialLat={selectedLocationForMap.latitude}
              initialLng={selectedLocationForMap.longitude}
              radiusMeters={selectedLocationForMap.radius}
              locationName={selectedLocationForMap.location_name}
              className="h-80 w-full rounded-xl border border-slate-200"
            />

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>Shaded teal circle represents the permitted check-in radius.</span>
              <button
                onClick={() => setSelectedLocationForMap(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Site Location */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-base">Add New Site Location</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Location Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CUBIQ Site A (Headquarters)"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. MG Road, Bangalore, Karnataka"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Coordinates & GPS auto-detect */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    GPS Coordinates & Geofence
                  </label>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={detectingGps}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    {detectingGps ? 'Detecting GPS...' : 'Use My Current GPS'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-500">Latitude</span>
                    <input
                      type="number"
                      step="any"
                      required
                      value={latitude}
                      onChange={(e) => setLatitude(parseFloat(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">Longitude</span>
                    <input
                      type="number"
                      step="any"
                      required
                      value={longitude}
                      onChange={(e) => setLongitude(parseFloat(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Leaflet interactive picker */}
                <div className="mt-2">
                  <MapPicker
                    initialLat={latitude}
                    initialLng={longitude}
                    radiusMeters={radius}
                    isInteractive={true}
                    onLocationSelect={(lat, lng) => {
                      setLatitude(parseFloat(lat.toFixed(6)));
                      setLongitude(parseFloat(lng.toFixed(6)));
                    }}
                    className="h-56 w-full rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* Radius and Supervisor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Allowed Radius (meters) *
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    required
                    value={radius}
                    onChange={(e) => setRadius(parseFloat(e.target.value) || 100)}
                    className="mt-1 w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Assign Supervisor
                  </label>
                  <select
                    value={supervisorId}
                    onChange={(e) => setSupervisorId(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">-- Assign Later --</option>
                    {supervisors.map((s) => (
                      <option key={s.user_id} value={s.user_id}>
                        {s.name} ({s.username})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold shadow-xs transition disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Site Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
