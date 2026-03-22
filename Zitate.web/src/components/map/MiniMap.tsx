import { useState, useMemo } from 'react';
import './MiniMap.css';

interface MiniMapProps {
  latitude: number;
  longitude: number;
  size?: 'small' | 'medium';
  onClick?: () => void;
  className?: string;
}

const TILE_SIZE = 256;

/**
 * Convert lat/lng to fractional tile coordinates at a given zoom level.
 * Returns { tileX, tileY, fracX, fracY } where fracX/fracY are 0..1
 * indicating where within the tile the point falls.
 */
function latLngToTile(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return {
    tileX: Math.floor(x),
    tileY: Math.floor(y),
    fracX: x - Math.floor(x),
    fracY: y - Math.floor(y),
  };
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

  const zoom = size === 'small' ? 13 : 15;

  // Build a 3x3 grid of tiles centered on the tile that contains the pin.
  // Then shift the whole grid so the pin ends up at the container center.
  const tileData = useMemo(() => {
    const { tileX, tileY, fracX, fracY } = latLngToTile(latitude, longitude, zoom);
    const n = Math.pow(2, zoom);

    // Pin position within the center tile (row=1, col=1 in the 3x3 grid)
    // In the 3x3 grid the center tile starts at (TILE_SIZE, TILE_SIZE),
    // so the pin's absolute position in the grid is:
    const pinX = TILE_SIZE + fracX * TILE_SIZE;
    const pinY = TILE_SIZE + fracY * TILE_SIZE;

    const tiles: { x: number; y: number; col: number; row: number }[] = [];
    for (let row = -1; row <= 1; row++) {
      for (let col = -1; col <= 1; col++) {
        tiles.push({
          x: (tileX + col + n) % n,
          y: tileY + row,
          col: col + 1,  // 0, 1, 2
          row: row + 1,  // 0, 1, 2
        });
      }
    }

    return { tiles, pinX, pinY };
  }, [latitude, longitude, zoom]);

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
      {/* 3x3 tile grid, shifted so the pin is at the container center */}
      <div
        className="mini-map-tiles"
        style={{
          position: 'absolute',
          width: TILE_SIZE * 3,
          height: TILE_SIZE * 3,
          left: `calc(50% - ${tileData.pinX}px)`,
          top: `calc(50% - ${tileData.pinY}px)`,
        }}
      >
        {tileData.tiles.map((tile) => (
          <img
            key={`${tile.x}-${tile.y}`}
            src={`https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`}
            alt=""
            style={{
              position: 'absolute',
              left: tile.col * TILE_SIZE,
              top: tile.row * TILE_SIZE,
              width: TILE_SIZE,
              height: TILE_SIZE,
            }}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ))}
      </div>

      {/* Map marker overlay - centered in the visible area */}
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
