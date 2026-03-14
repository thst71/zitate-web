/**
 * Location Service - Handles browser Geolocation API
 */

export interface GeolocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

class LocationService {
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
}

export const locationService = new LocationService();

/**
 * Export formatCoordinates as standalone function
 */
export const formatCoordinates = (latitude: number, longitude: number): string => {
  return locationService.formatCoordinates(latitude, longitude);
};
