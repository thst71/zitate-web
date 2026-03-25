import { useState, useEffect, useRef } from 'react';
import { Map as LeafletMap, TileLayer, Marker } from 'leaflet';
import { locationService } from '../../services/location.service';
import 'leaflet/dist/leaflet.css';
import './LocationViewer.css';

// Fix Leaflet default markers
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIconRetina,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface LocationViewerProps {
  latitude: number;
  longitude: number;
  address?: string;
  title?: string;
  onClose: () => void;
}

export const LocationViewer = ({
  latitude,
  longitude,
  address,
  title = 'Location',
  onClose
}: LocationViewerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<LeafletMap | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string | undefined>(address);

  // If no address was passed, fetch it ourselves
  useEffect(() => {
    if (address) {
      setResolvedAddress(address);
      return;
    }
    let cancelled = false;
    locationService.reverseGeocode(latitude, longitude).then((result) => {
      if (!cancelled && result) {
        setResolvedAddress(result.full);
      }
    });
    return () => { cancelled = true; };
  }, [latitude, longitude, address]);

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    const map = new LeafletMap(mapRef.current).setView([latitude, longitude], 15);

    new TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add marker at the specified location
    new Marker([latitude, longitude]).addTo(map);

    leafletMapRef.current = map;

    // Leaflet calculates tile positions from the container size at init time.
    // If the modal is still animating/rendering, the size is wrong and tiles
    // appear shifted. invalidateSize() forces a recalculation.
    requestAnimationFrame(() => {
      map.invalidateSize();
      map.setView([latitude, longitude], 15);
    });

    // Handle ESC key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      map.remove();
      leafletMapRef.current = null;
    };
  }, [latitude, longitude, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="location-viewer-overlay" 
      onClick={handleOverlayClick}
      role="dialog"
      aria-labelledby="location-viewer-title"
      aria-modal="true"
    >
      <div className="location-viewer-modal">
        <div className="location-viewer-header">
          <h3 id="location-viewer-title">{title}</h3>
          <button 
            className="close-button" 
            onClick={onClose}
            aria-label="Close location viewer"
          >
            ×
          </button>
        </div>

        <div className="location-viewer-content">
          <div className="map-container" ref={mapRef}></div>

          <div className="location-info">
            <div className="coordinates">
              <strong>Coordinates:</strong> {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </div>
            {resolvedAddress && (
              <div className="address">
                <strong>Address:</strong> {resolvedAddress}
              </div>
            )}
          </div>
        </div>

        <div className="location-viewer-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => {
              const url = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`;
              window.open(url, '_blank', 'noopener,noreferrer');
            }}
            aria-label="Open location in OpenStreetMap"
          >
            🌍 Open in Maps
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
