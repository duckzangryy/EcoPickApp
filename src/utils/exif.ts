/**
 * exif.ts
 * Cross-platform EXIF GPS parser for Expo ImagePicker / Camera metadata.
 * Handles Android, iOS, and Web EXIF formats (decimal degrees, DMS arrays,
 * rational strings, and iOS {GPS} dictionaries with hemisphere refs).
 */

export interface ExifCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Parses coordinate value into decimal degrees.
 * Handles numbers, DMS arrays, rational fraction strings (e.g. "12/1"),
 * and applies hemisphere reference (S, W -> negative).
 */
export function parseExifCoordinate(coord: unknown, ref?: unknown): number | null {
  if (coord == null) return null;

  let decimal: number | null = null;

  if (typeof coord === 'number' && !isNaN(coord)) {
    decimal = coord;
  } else if (Array.isArray(coord) && coord.length >= 3) {
    const parsePart = (val: unknown): number => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        if (val.includes('/')) {
          const [num, den] = val.split('/').map(Number);
          return den ? num / den : 0;
        }
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    const deg = parsePart(coord[0]);
    const min = parsePart(coord[1]);
    const sec = parsePart(coord[2]);
    decimal = deg + min / 60 + sec / 3600;
  } else if (typeof coord === 'string') {
    if (coord.includes(',')) {
      const parts = coord.split(',').map((s) => s.trim());
      return parseExifCoordinate(parts, ref);
    }
    const parsed = parseFloat(coord);
    if (!isNaN(parsed)) decimal = parsed;
  }

  if (decimal == null || isNaN(decimal)) return null;

  if (ref) {
    const r = String(ref).trim().toUpperCase();
    if (r === 'S' || r === 'W') {
      decimal = -Math.abs(decimal);
    } else if (r === 'N' || r === 'E') {
      decimal = Math.abs(decimal);
    }
  }

  return decimal;
}

/**
 * Extracts latitude and longitude from raw EXIF metadata.
 * Checks top-level EXIF keys and nested `{GPS}` / `GPS` dictionaries.
 */
export function extractGpsFromExif(exif: any): ExifCoordinates | null {
  if (!exif || typeof exif !== 'object') return null;

  // iOS nests GPS properties inside {GPS} or GPS dictionary
  const gps = exif['{GPS}'] || exif.GPS || exif;

  const latRaw = gps.GPSLatitude ?? gps.Latitude ?? exif.GPSLatitude ?? exif.Latitude;
  const latRef = gps.GPSLatitudeRef ?? gps.LatitudeRef ?? exif.GPSLatitudeRef ?? exif.LatitudeRef;
  const lngRaw = gps.GPSLongitude ?? gps.Longitude ?? exif.GPSLongitude ?? exif.Longitude;
  const lngRef = gps.GPSLongitudeRef ?? gps.LongitudeRef ?? exif.GPSLongitudeRef ?? exif.LongitudeRef;

  const latitude = parseExifCoordinate(latRaw, latRef);
  const longitude = parseExifCoordinate(lngRaw, lngRef);

  if (latitude !== null && longitude !== null && !isNaN(latitude) && !isNaN(longitude)) {
    // Basic coordinate bounds check
    if (
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180 &&
      (latitude !== 0 || longitude !== 0)
    ) {
      return { latitude, longitude };
    }
  }

  return null;
}
