import { describe, it, expect, vi, beforeEach } from 'vitest';
import { locationService, formatCoordinates } from './location.service';

describe('LocationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isAvailable', () => {
    it('should return true when geolocation is available', () => {
      expect(locationService.isAvailable()).toBe(true);
    });
  });

  describe('getCurrentPosition', () => {
    it('should resolve with coordinates on success', async () => {
      const mockPosition = {
        coords: {
          latitude: 52.52,
          longitude: 13.405,
          accuracy: 10,
        },
      };

      vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation(
        (success) => {
          success(mockPosition as GeolocationPosition);
        }
      );

      const result = await locationService.getCurrentPosition();
      expect(result).toEqual({
        latitude: 52.52,
        longitude: 13.405,
        accuracy: 10,
      });
    });

    it('should reject with error message on permission denied', async () => {
      const mockError = {
        code: 1,
        message: 'Permission denied',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation(
        (_, error) => {
          error!(mockError as GeolocationPositionError);
        }
      );

      await expect(locationService.getCurrentPosition()).rejects.toThrow(
        'Location permission denied'
      );
    });

    it('should reject with error message on position unavailable', async () => {
      const mockError = {
        code: 2,
        message: 'Position unavailable',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation(
        (_, error) => {
          error!(mockError as GeolocationPositionError);
        }
      );

      await expect(locationService.getCurrentPosition()).rejects.toThrow(
        'Location information unavailable'
      );
    });

    it('should reject with error message on timeout', async () => {
      const mockError = {
        code: 3,
        message: 'Timeout',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };

      vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation(
        (_, error) => {
          error!(mockError as GeolocationPositionError);
        }
      );

      await expect(locationService.getCurrentPosition()).rejects.toThrow(
        'Location request timed out'
      );
    });
  });

  describe('formatCoordinates', () => {
    it('should format coordinates with 6 decimal places', () => {
      const result = locationService.formatCoordinates(52.520008, 13.404954);
      expect(result).toBe('52.520008, 13.404954');
    });

    it('should round coordinates to 6 decimal places', () => {
      const result = locationService.formatCoordinates(
        52.5200081234,
        13.4049541234
      );
      expect(result).toBe('52.520008, 13.404954');
    });

    it('should handle negative coordinates', () => {
      const result = locationService.formatCoordinates(-33.8688, 151.2093);
      expect(result).toBe('-33.868800, 151.209300');
    });
  });

  describe('formatCoordinates (standalone)', () => {
    it('should format coordinates correctly', () => {
      const result = formatCoordinates(52.520008, 13.404954);
      expect(result).toBe('52.520008, 13.404954');
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      // Berlin to Munich (approx 504 km)
      const distance = locationService.calculateDistance(
        52.52,
        13.405,
        48.1351,
        11.582
      );
      expect(distance).toBeGreaterThan(500);
      expect(distance).toBeLessThan(510);
    });

    it('should return 0 for same coordinates', () => {
      const distance = locationService.calculateDistance(
        52.52,
        13.405,
        52.52,
        13.405
      );
      expect(distance).toBeCloseTo(0, 1);
    });

    it('should calculate distance across the equator', () => {
      // North to South
      const distance = locationService.calculateDistance(10, 0, -10, 0);
      expect(distance).toBeGreaterThan(2200);
      expect(distance).toBeLessThan(2300);
    });
  });
});
