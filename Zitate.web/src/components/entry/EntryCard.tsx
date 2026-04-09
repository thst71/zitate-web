import React, { useState, useEffect } from 'react';
import { Entry, EntryLink } from '../../models';
import type { ImageAttachmentWithBlob } from '../../models';
import { formatCoordinates, locationService, type ReverseGeocodeResult } from '../../services/location.service';
import { useAuthors } from '../../hooks/useAuthors';
import { useLabels } from '../../hooks/useLabels';
import { useEntries } from '../../hooks/useEntries';
import { formatLabelForDisplay } from '../../utils/validators';
import { ImageGrid } from '../image/ImageGrid';
import { ImageViewer } from '../image/ImageViewer';
import { LocationPopover } from '../map/LocationPopover';
import './EntryCard.css';

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
  const [images, setImages] = useState<ImageAttachmentWithBlob[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [linksOpen, setLinksOpen] = useState(false);
  // Fallback geocoding only for legacy entries without persisted address
  const [fallbackGeo, setFallbackGeo] = useState<ReverseGeocodeResult | null | undefined>(
    entry.addressShort ? undefined : undefined // will be set by effect
  );

  const author = entry.authorId ? getAuthorById(entry.authorId) : undefined;
  const labels = getLabelsByIds(entry.labelIds);
  const links = entry.links ?? [];

  useEffect(() => {
    if (entry.imageAttachments && entry.imageAttachments.length > 0) {
      getImagesForEntry(entry.id).then(setImages);
    }
  }, [entry.id, entry.imageAttachments, getImagesForEntry]);

  const hasLocation = entry.latitude !== undefined && entry.longitude !== undefined;

  // Use persisted address if available; otherwise fallback-geocode for legacy entries
  const addressShort = entry.addressShort ?? fallbackGeo?.short;
  const addressFull = entry.addressFull ?? fallbackGeo?.full;
  const addressLoading = hasLocation && !entry.addressShort && fallbackGeo === undefined;

  useEffect(() => {
    // Only geocode if entry has location but no persisted address (legacy data)
    if (!hasLocation || entry.addressShort) {
      setFallbackGeo(null); // not loading
      return;
    }

    let cancelled = false;
    setFallbackGeo(undefined); // loading
    locationService.reverseGeocode(entry.latitude!, entry.longitude!).then((result) => {
      if (!cancelled) {
        setFallbackGeo(result ?? null);
      }
    });
    return () => { cancelled = true; };
  }, [hasLocation, entry.latitude, entry.longitude, entry.addressShort]);
  const formatDate = (timestamp: number | undefined): string => {
    if (timestamp === undefined) {
      return '';
    }
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

  const formatLinkDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getFaviconSrc = (link: EntryLink) => {
    try {
      return `${new URL(link.url).origin}/favicon.ico`;
    } catch {
      return '/favicon.ico';
    }
  };

  const renderAuthorLine = () => {
    const citationStr = formatDate(entry.citationDate);
    const creationStr = formatDate(entry.createdAt);

    // Case 1: Author, Citation Date, Creation Date
    if (author && citationStr) {
      return <>{author.name}, {citationStr} <span className="added-date">(added {creationStr})</span></>;
    }
    // Case 2: No Author, Citation Date, Creation Date
    if (!author && citationStr) {
      return <>{citationStr} <span className="added-date">(added {creationStr})</span></>;
    }
    // Case 4: Author, No Citation Date, Creation Date
    if (author && !citationStr) {
      return <>{author.name} <span className="added-date">(added {creationStr})</span></>;
    }
    // Case 3: No Author, No Citation Date, Creation Date
    return <><span className="added-date">added {creationStr}</span></>;
  };

  return (
    <div className="entry-card">
      <div className="entry-card-content">
        <div className="entry-text-wrapper">
          <p className="entry-text">{entry.text}</p>
          {links.length > 0 && (
            <div className="entry-links-menu-wrapper">
              <button
                type="button"
                className="entry-links-toggle"
                onClick={() => setLinksOpen((prev) => !prev)}
                aria-label="Show attached URLs"
                aria-expanded={linksOpen}
                title="Show attached URLs"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
              </button>

              {linksOpen && (
                <div className="entry-links-dropdown" role="menu" aria-label="Attached URLs">
                  {links.map((link) => (
                    <a
                      key={link.id}
                      className="entry-link-item"
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        className="entry-link-favicon"
                        src={getFaviconSrc(link)}
                        alt=""
                        aria-hidden="true"
                        onError={(e) => {
                          if (e.currentTarget.dataset.fallbackApplied === 'true') {
                            return;
                          }
                          e.currentTarget.dataset.fallbackApplied = 'true';
                          e.currentTarget.src = '/favicon.ico';
                        }}
                      />
                      <span className="entry-link-content">
                        <span className="entry-link-url">{link.url}</span>
                        <span className="entry-link-date">Added {formatLinkDate(link.addedAt)}</span>
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="entry-author">
          — {renderAuthorLine()}
        </div>

        {images.length > 0 && (
          <ImageGrid
            images={images}
            onImageClick={handleImageClick}
            maxDisplay={3}
            showMoreIndicator={true}
          />
        )}

        {hasLocation && (
          <div className="entry-meta">
            <div className="entry-location">
              <LocationPopover
                latitude={entry.latitude!}
                longitude={entry.longitude!}
                onClick={onLocationClick ? () => onLocationClick(
                  entry.latitude!,
                  entry.longitude!,
                  addressFull,
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
                  {addressLoading ? (
                    <span className="location-loading-text">Loading location…</span>
                  ) : addressShort ? (
                    <>{addressShort} ({formatCoordinates(entry.latitude!, entry.longitude!)})</>
                  ) : (
                    formatCoordinates(entry.latitude!, entry.longitude!)
                  )}
                </span>
              </LocationPopover>
            </div>
          </div>
        )}

        <div className="entry-footer">
          {labels.length > 0 && (
            <div className="entry-labels">
              {labels.map((label) => (
                <span key={label.id} className="entry-label">
                  {formatLabelForDisplay(label.name)}
                </span>
              ))}
            </div>
          )}

          {(onEdit || onDelete) && (
            <div className="entry-actions">
              {onEdit && (
                <button
                  className="entry-edit"
                  onClick={() => onEdit(entry)}
                  aria-label="Edit entry"
                  title="Edit entry"
                >
                  <svg
                    width="18"
                    height="18"
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
                    width="18"
                    height="18"
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
          )}
        </div>
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
