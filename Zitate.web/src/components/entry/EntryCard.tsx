import React, { useState, useEffect } from 'react';
import { Entry, ImageAttachment } from '../../models';
import { formatCoordinates, locationService, type ReverseGeocodeResult } from '../../services/location.service';
import { useAuthors } from '../../hooks/useAuthors';
import { useLabels } from '../../hooks/useLabels';
import { useEntries } from '../../hooks/useEntries';
import { formatLabelForDisplay } from '../../utils/validators';
import { ImageGrid } from '../image/ImageGrid';
import { ImageViewer } from '../image/ImageViewer';
import { LocationPopover } from '../map/LocationPopover';
import './EntryCard.css';

// Simple in-memory cache for reverse geocoded addresses
const addressCache = new Map<string, ReverseGeocodeResult | null>();

interface EntryCardProps {
  entry: Entry;
  onEdit?: (entry: Entry) => void;
  onDelete?: (id: string) => void;
  onLocationClick?: (latitude: number, longitude: number, address?: string, title?: string) => void;
}

export const EntryCard: React.FC<EntryCardProps> = ({ entry, onEdit, onDelete, onLocationClick }) => {
  const { getAuthorById } = useAuthors();
  const { getLabelsByIds } = useLabels();
  const { getImagesForEntry } = useEntries();
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [geoResult, setGeoResult] = useState<ReverseGeocodeResult | null | undefined>(undefined); // undefined = loading

  const author = entry.authorId ? getAuthorById(entry.authorId) : undefined;
  const labels = getLabelsByIds(entry.labelIds);

  useEffect(() => {
    if (entry.imageIds.length > 0) {
      getImagesForEntry(entry.id).then(setImages);
    }
  }, [entry.id, entry.imageIds, getImagesForEntry]);

  // Reverse geocode the location
  const hasLocation = entry.latitude !== undefined && entry.longitude !== undefined;

  useEffect(() => {
    if (!hasLocation) return;

    const cacheKey = `${entry.latitude!.toFixed(6)},${entry.longitude!.toFixed(6)}`;
    if (addressCache.has(cacheKey)) {
      setGeoResult(addressCache.get(cacheKey)!);
      return;
    }

    let cancelled = false;
    locationService.reverseGeocode(entry.latitude!, entry.longitude!).then((result) => {
      if (!cancelled) {
        const geo = result ?? null;
        addressCache.set(cacheKey, geo);
        setGeoResult(geo);
      }
    });

    return () => { cancelled = true; };
  }, [hasLocation, entry.latitude, entry.longitude]);
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this entry?')) {
      onDelete(entry.id);
    }
  };

  const handleImageClick = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  return (
    <div className="entry-card">
      <div className="entry-card-content">
        <p className="entry-text">{entry.text}</p>

        {author && (
          <div className="entry-author">
            — {author.name}
          </div>
        )}


        {images.length > 0 && (
          <ImageGrid
            images={images}
            onImageClick={handleImageClick}
            maxDisplay={3}
            showMoreIndicator={true}
          />
        )}

        <div className="entry-meta">
          <span className="entry-date">{formatDate(entry.createdAt)}</span>

          {hasLocation && (
            <div className="entry-location">
              <LocationPopover
                latitude={entry.latitude!}
                longitude={entry.longitude!}
                onClick={onLocationClick ? () => onLocationClick(
                  entry.latitude!,
                  entry.longitude!,
                  geoResult?.full,
                  `Quote from ${formatDate(entry.createdAt)}`
                ) : undefined}
              >
                <svg
                  className="location-icon"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span className="location-text-content">
                  {geoResult === undefined ? (
                    <span className="location-loading-text">Loading location…</span>
                  ) : geoResult ? (
                    <>{geoResult.short} ({formatCoordinates(entry.latitude!, entry.longitude!)})</>
                  ) : (
                    formatCoordinates(entry.latitude!, entry.longitude!)
                  )}
                </span>
              </LocationPopover>
            </div>
          )}
        </div>

        {labels.length > 0 && (
          <div className="entry-labels">
            {labels.map((label) => (
              <span key={label.id} className="entry-label">
                {formatLabelForDisplay(label.name)}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="entry-actions">
        {onEdit && (
          <button
            className="entry-edit"
            onClick={() => onEdit(entry)}
            aria-label="Edit entry"
            title="Edit entry"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        )}
        {onDelete && (
          <button
            className="entry-delete"
            onClick={handleDelete}
            aria-label="Delete entry"
            title="Delete entry"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        )}
      </div>

      <ImageViewer
        images={images}
        initialIndex={viewerIndex}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
};
