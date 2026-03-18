/**
 * Location Service - Handles browser Geolocation API and geocoding
 */

export interface GeolocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface LocationResult {
  coords: GeolocationCoords;
  address?: string;
}

export interface AddressResult {
  display_name: string;
  lat: string;
  lon: string;
}

class LocationService {
  private readonly NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

  /**
   * Check if Geolocation API is available
   */
  isAvailable(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Get current position from browser
   */
  async getCurrentPosition(): Promise<GeolocationCoords> {
    if (!this.isAvailable()) {
      throw new Error('Geolocation is not supported by this browser');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error('Location permission denied'));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error('Location information unavailable'));
              break;
            case error.TIMEOUT:
              reject(new Error('Location request timed out'));
              break;
            default:
              reject(new Error('Unknown error occurred'));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  /**
   * Get current position with optional address resolution
   */
  async getCurrentPositionWithAddress(): Promise<LocationResult> {
    const coords = await this.getCurrentPosition();

    try {
      const address = await this.reverseGeocode(coords.latitude, coords.longitude);
      return { coords, address };
    } catch {
      return { coords };
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string | undefined> {
    try {
      const response = await fetch(
        `${this.NOMINATIM_BASE_URL}/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Zitate-Web-App',
          }
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const data = await response.json();
      return data.display_name;
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      return undefined;
    }
  }

  /**
   * Search for addresses
   */
  async searchAddress(query: string): Promise<AddressResult[]> {
    try {
      const response = await fetch(
        `${this.NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        {
          headers: {
            'User-Agent': 'Zitate-Web-App',
          }
        }
      );

      if (!response.ok) {
        throw new Error('Address search failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Address search failed:', error);
      return [];
    }
  }

  /**
   * Format coordinates as string
   */
  formatCoordinates(latitude: number, longitude: number): string {
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }

  /**
   * Calculate distance between two coordinates in kilometers (Haversine formula)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Format distance in human readable format
   */
  formatDistance(km: number): string {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    } else if (km < 10) {
      return `${km.toFixed(1)}km`;
    } else {
      return `${Math.round(km)}km`;
    }
  }
}

export const locationService = new LocationService();

/**
 * Export formatCoordinates as standalone function
 */
export const formatCoordinates = (latitude: number, longitude: number): string => {
  return locationService.formatCoordinates(latitude, longitude);
};
