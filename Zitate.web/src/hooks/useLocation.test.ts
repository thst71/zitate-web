import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useLocation } from './useLocation';

describe('useLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null coords and not loading', () => {
    const { result } = renderHook(() => useLocation());

    expect(result.current.coords).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should auto-fetch location when autoFetch is true', async () => {
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

    const { result } = renderHook(() => useLocation({ autoFetch: true }));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.coords).toEqual({
      latitude: 52.52,
      longitude: 13.405,
      accuracy: 10,
    });
    expect(result.current.error).toBeNull();
  });

  it('should not auto-fetch when autoFetch is false', () => {
    const { result } = renderHook(() => useLocation({ autoFetch: false }));

    expect(result.current.loading).toBe(false);
    expect(result.current.coords).toBeNull();
  });

  it('should manually fetch location', async () => {
    const mockPosition = {
      coords: {
        latitude: 48.8566,
        longitude: 2.3522,
        accuracy: 15,
      },
    };

    vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation(
      (success) => {
        success(mockPosition as GeolocationPosition);
      }
    );

    const { result } = renderHook(() => useLocation({ autoFetch: false }));

    await act(async () => {
      await result.current.fetchLocation();
    });

    expect(result.current.coords).toEqual({
      latitude: 48.8566,
      longitude: 2.3522,
      accuracy: 15,
    });
  });

  it('should handle location errors', async () => {
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

    const { result } = renderHook(() => useLocation({ autoFetch: true }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Location permission denied');
    expect(result.current.coords).toBeNull();
  });

  it('should format coordinates', () => {
    const mockPosition = {
      coords: {
        latitude: 52.520008,
        longitude: 13.404954,
        accuracy: 10,
      },
    };

    vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation(
      (success) => {
        success(mockPosition as GeolocationPosition);
      }
    );

    const { result } = renderHook(() => useLocation({ autoFetch: true }));

    waitFor(() => {
      expect(result.current.formatCoords()).toBe('52.520008, 13.404954');
    });
  });

  it('should return empty string when formatting null coords', () => {
    const { result } = renderHook(() => useLocation({ autoFetch: false }));

    expect(result.current.formatCoords()).toBe('');
  });

  it('should clear error on successful fetch after error', async () => {
    const mockError = {
      code: 1,
      message: 'Permission denied',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    const mockPosition = {
      coords: {
        latitude: 52.52,
        longitude: 13.405,
        accuracy: 10,
      },
    };

    const getCurrentPositionSpy = vi
      .spyOn(navigator.geolocation, 'getCurrentPosition')
      .mockImplementationOnce((_, error) => {
        error!(mockError as GeolocationPositionError);
      })
      .mockImplementationOnce((success) => {
        success(mockPosition as GeolocationPosition);
      });

    const { result } = renderHook(() => useLocation({ autoFetch: true }));

    await waitFor(() => {
      expect(result.current.error).toBe('Location permission denied');
    });

    await act(async () => {
      await result.current.fetchLocation();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.coords).toEqual({
      latitude: 52.52,
      longitude: 13.405,
      accuracy: 10,
    });
  });
});
