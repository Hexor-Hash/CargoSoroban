import { Pool } from 'pg';

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function findNearbyTransporters(lat: number, lng: number, radiusKm: number, pool: Pool) {
  const { rows } = await pool.query(
    `SELECT *, (6371 * acos(
      cos(radians($1)) * cos(radians(lat)) * cos(radians(lng) - radians($2)) +
      sin(radians($1)) * sin(radians(lat))
    )) AS distance_km
    FROM users
    WHERE role = 'transporter' AND lat IS NOT NULL AND lng IS NOT NULL
    HAVING (6371 * acos(
      cos(radians($1)) * cos(radians(lat)) * cos(radians(lng) - radians($2)) +
      sin(radians($1)) * sin(radians(lat))
    )) <= $3
    ORDER BY distance_km`,
    [lat, lng, radiusKm]
  );
  return rows;
}

export function estimateETA(distanceKm: number, avgSpeedKmh = 40): number {
  return Math.round((distanceKm / avgSpeedKmh) * 60);
}
