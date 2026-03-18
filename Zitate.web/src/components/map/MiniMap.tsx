import { useState } from 'react';
import './MiniMap.css';

interface MiniMapProps {
  latitude: number;
  longitude: number;
  size?: 'small' | 'medium';
  onClick?: () => void;
  className?: string;
}

export const MiniMap = ({ 
  latitude, 
  longitude, 
  size = 'medium',
  onClick,
  className = ''
}: MiniMapProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Generate static map tile URL using OpenStreetMap
  const getStaticMapUrl = () => {
    const zoom = size === 'small' ? 13 : 15;
    const width = size === 'small' ? 150 : 200;
    const height = size === 'small' ? 100 : 120;
    
    // Use OpenStreetMap static tiles via a service that provides static maps
    // For production, you might want to use a dedicated static map service
    const centerX = longitude;
    const centerY = latitude;
    const z = zoom;
    
    // Calculate tile coordinates for the center
    const tileX = Math.floor((centerX + 180) / 360 * Math.pow(2, z));
    const tileY = Math.floor((1 - Math.log(Math.tan(centerY * Math.PI / 180) + 1 / Math.cos(centerY * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
    
    // Use OpenStreetMap tile server
    return `https://tile.openstreetmap.org/${z}/${tileX}/${tileY}.png`;
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick) {
      e.preventDefault();
      onClick();
    }
  };

  if (imageError) {
    return (
      <div 
        className={`mini-map mini-map-${size} mini-map-error ${className} ${onClick ? 'clickable' : ''}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={onClick ? 0 : undefined}
        role={onClick ? 'button' : undefined}
        aria-label={onClick ? 'Open location on map' : 'Location coordinates'}
      >
        <div className="mini-map-error-content">
          <span className="mini-map-icon">📍</span>
          <span className="mini-map-coords">
            {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`mini-map mini-map-${size} ${className} ${onClick ? 'clickable' : ''} ${!imageLoaded ? 'loading' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? 'Open location on map' : 'Location map'}
    >
      <img
        src={getStaticMapUrl()}
        alt={`Map showing location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}
        className="mini-map-image"
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
      
      {/* Map marker overlay */}
      <div className="mini-map-marker">
        <span className="marker-icon">📍</span>
      </div>
      
      {!imageLoaded && !imageError && (
        <div className="mini-map-loading">
          <div className="loading-spinner"></div>
        </div>
      )}
      
      {onClick && (
        <div className="mini-map-overlay">
          <span className="mini-map-hover-text">Click to view</span>
        </div>
      )}
    </div>
  );
};
