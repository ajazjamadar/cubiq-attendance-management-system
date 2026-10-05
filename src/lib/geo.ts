import { CheckInValidationResult } from '@/types';

/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 *
 * @param lat1 Latitude of point 1 in degrees
 * @param lon1 Longitude of point 1 in degrees
 * @param lat2 Latitude of point 2 in degrees
 * @param lon2 Longitude of point 2 in degrees
 * @returns Distance in meters
 */
export function calculateDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's mean radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Validates if a user's current GPS position is within the allowed radius of a site location.
 */
export function validateGeofence(
  userLat: number,
  userLon: number,
  siteLat: number,
  siteLon: number,
  allowedRadiusMeters: number
): CheckInValidationResult {
  const distanceMeters = calculateDistanceInMeters(userLat, userLon, siteLat, siteLon);
  const isValid = distanceMeters <= allowedRadiusMeters;

  return {
    isValid,
    distanceMeters,
    allowedRadiusMeters,
    message: isValid
      ? `Within allowed radius (${distanceMeters}m from site center, allowed: ${allowedRadiusMeters}m).`
      : `You are not within your assigned work location. Distance is ${distanceMeters}m (Allowed radius: ${allowedRadiusMeters}m).`,
  };
}

/**
 * Formats distance nicely (e.g. "85 m" or "1.2 km")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Formats coordinates for display
 */
export function formatCoordinates(lat: number, lon: number): string {
  return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}
