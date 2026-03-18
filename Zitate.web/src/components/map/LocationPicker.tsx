import { useEffect, useRef, useState } from 'react';
import { Map as LeafletMap, TileLayer, Marker } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { locationService, AddressResult } from '../../services/location.service';
import './LocationPicker.css';

// Fix Leaflet default markers
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIconRetina,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface LocationPickerProps {
  initialLatitude?: number;
  initialLongitude?: number;
  onLocationSelect: (latitude: number, longitude: number, address?: string) => void;
  onCancel: () => void;
}

export const LocationPicker = ({
  initialLatitude,
  initialLongitude,
  onLocationSelect,
  onCancel
}: LocationPickerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  
  const [selectedLat, setSelectedLat] = useState(initialLatitude || 0);
  const [selectedLng, setSelectedLng] = useState(initialLongitude || 0);
  const [address, setAddress] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AddressResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    const defaultLat = initialLatitude || 51.505;
    const defaultLng = initialLongitude || -0.09;

    const map = new LeafletMap(mapRef.current).setView([defaultLat, defaultLng], 13);

    new TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add initial marker
    const marker = new Marker([defaultLat, defaultLng], { draggable: true })
      .addTo(map);

    // Handle marker drag
    marker.on('dragend', () => {
      const position = marker.getLatLng();
      setSelectedLat(position.lat);
      setSelectedLng(position.lng);
      geocodePosition(position.lat, position.lng);
    });

    // Handle map click
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setSelectedLat(lat);
      setSelectedLng(lng);
      geocodePosition(lat, lng);
    });

    leafletMapRef.current = map;
    markerRef.current = marker;

    // Get initial address if coordinates provided
    if (initialLatitude && initialLongitude) {
      geocodePosition(initialLatitude, initialLongitude);
    }

    return () => {
      map.remove();
      leafletMapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  const geocodePosition = async (lat: number, lng: number) => {
    setIsGeocodingAddress(true);
    try {
      const addressResult = await locationService.reverseGeocode(lat, lng);
      setAddress(addressResult || '');
    } catch (error) {
      console.warn('Failed to geocode position:', error);
      setAddress('');
    } finally {
      setIsGeocodingAddress(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 2) {
      searchAddresses(query);
    } else {
      setSearchResults([]);
    }
  };

  const searchAddresses = async (query: string) => {
    setIsSearching(true);
    try {
      const results = await locationService.searchAddress(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Address search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchResultClick = (result: AddressResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    setSelectedLat(lat);
    setSelectedLng(lng);
    setAddress(result.display_name);
    setSearchQuery(result.display_name);
    setSearchResults([]);

    if (leafletMapRef.current && markerRef.current) {
      leafletMapRef.current.setView([lat, lng], 15);
      markerRef.current.setLatLng([lat, lng]);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const result = await locationService.getCurrentPositionWithAddress();
      const { latitude, longitude } = result.coords;
      
      setSelectedLat(latitude);
      setSelectedLng(longitude);
      setAddress(result.address || '');

      if (leafletMapRef.current && markerRef.current) {
        leafletMapRef.current.setView([latitude, longitude], 15);
        markerRef.current.setLatLng([latitude, longitude]);
      }
    } catch (error) {
      console.error('Failed to get current location:', error);
      alert('Failed to get your current location. Please select a location manually.');
    }
  };

  const handleConfirm = () => {
    onLocationSelect(selectedLat, selectedLng, address);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="location-picker-overlay" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="location-picker-modal">
        <div className="location-picker-header">
          <h3>Select Location</h3>
          <button 
            className="close-button" 
            onClick={onCancel}
            aria-label="Close location picker"
          >
            ×
          </button>
        </div>

        <div className="location-picker-search">
          <input
            type="text"
            placeholder="Search for an address..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
            aria-label="Search for address"
          />
          
          <button 
            className="current-location-btn"
            onClick={getCurrentLocation}
            aria-label="Use current location"
          >
            📍 Current Location
          </button>

          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  className="search-result-item"
                  onClick={() => handleSearchResultClick(result)}
                >
                  {result.display_name}
                </button>
              ))}
            </div>
          )}

          {isSearching && (
            <div className="search-loading">Searching...</div>
          )}
        </div>

        <div className="map-container" ref={mapRef}></div>

        <div className="location-picker-info">
          <div className="coordinates">
            <strong>Coordinates:</strong> {selectedLat.toFixed(6)}, {selectedLng.toFixed(6)}
          </div>
          {address && (
            <div className="address">
              <strong>Address:</strong> 
              {isGeocodingAddress ? ' Loading...' : ` ${address}`}
            </div>
          )}
        </div>

        <div className="location-picker-actions">
          <button className="btn btn-primary" onClick={handleConfirm}>
            Confirm Location
          </button>
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
