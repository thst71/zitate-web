/**
 * useLocation hook - Manages geolocation state
 */
import { useState, useEffect } from 'react';
import { locationService, type GeolocationCoords } from '../services/location.service';

interface UseLocationOptions {
  autoFetch?: boolean;
}

export function useLocation(options: UseLocationOptions = {}) {
  const { autoFetch = false } = options;
  const [coords, setCoords] = useState<GeolocationCoords | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = async () => {
    if (!locationService.isAvailable()) {
      setError('Geolocation not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const position = await locationService.getCurrentPosition();
      setCoords(position);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchLocation();
    }
  }, [autoFetch]);

  const formatCoords = () => {
    if (!coords) return '';
    return locationService.formatCoordinates(coords.latitude, coords.longitude);
  };

  return {
    coords,
    loading,
    error,
    fetchLocation,
    formatCoords,
  };
}
