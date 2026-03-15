/**
 * ImageThumbnail Component - Individual image thumbnail
 */
import { useState, useEffect } from 'react';
import { createImageURL, revokeImageURL } from '../../services/image.service';
import './ImageThumbnail.css';

interface ImageThumbnailProps {
  blob: Blob;
  alt?: string;
  onDelete?: () => void;
  onClick?: () => void;
}

export function ImageThumbnail({ blob, alt = 'Image', onDelete, onClick }: ImageThumbnailProps) {
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    // Create object URL for the blob
    const url = createImageURL(blob);
    setImageUrl(url);

    // Cleanup: revoke object URL when component unmounts
    return () => {
      revokeImageURL(url);
    };
  }, [blob]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <div
      className={`image-thumbnail ${onClick ? 'clickable' : ''}`}
      onClick={handleClick}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={alt}
          className="thumbnail-image"
          loading="lazy"
        />
      )}
      {onDelete && (
        <button
          type="button"
          className="thumbnail-delete"
          onClick={handleDelete}
          aria-label="Delete image"
        >
          ×
        </button>
      )}
    </div>
  );
}
