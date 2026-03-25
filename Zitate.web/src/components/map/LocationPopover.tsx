/**
 * LocationPopover – Shows a MiniMap popup on hover over location text.
 * Click passes through to parent's onClick handler.
 */
import { useState, useRef, useCallback, type ReactNode } from 'react';
import { MiniMap } from './MiniMap';
import './LocationPopover.css';

interface LocationPopoverProps {
  latitude: number;
  longitude: number;
  children: ReactNode;
  onClick?: () => void;
}

export function LocationPopover({ latitude, longitude, children, onClick }: LocationPopoverProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const showPopover = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(true), 300);
  }, []);

  const hidePopover = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(false), 150);
  }, []);

  const handleClick = () => {
    // On touch devices the first tap shows the popover; hide it and delegate click
    setVisible(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onClick?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className="location-popover-anchor"
      ref={containerRef}
      onMouseEnter={showPopover}
      onMouseLeave={hidePopover}
    >
      <span
        className={`location-popover-trigger ${onClick ? 'clickable' : ''}`}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={onClick ? 'Open location on map' : undefined}
      >
        {children}
      </span>

      {visible && (
        <div
          className="location-popover"
          onMouseEnter={showPopover}
          onMouseLeave={hidePopover}
        >
          <MiniMap
            latitude={latitude}
            longitude={longitude}
            size="medium"
          />
        </div>
      )}
    </div>
  );
}

