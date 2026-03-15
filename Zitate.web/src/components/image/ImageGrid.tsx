/**
 * ImageGrid Component - Grid display for multiple image thumbnails
 */
import { ImageThumbnail } from './ImageThumbnail';
import type { ImageAttachment } from '../../models';
import './ImageGrid.css';

interface ImageGridProps {
  images: ImageAttachment[];
  onImageClick?: (index: number) => void;
  onImageDelete?: (imageId: string) => void;
  maxDisplay?: number;
  showMoreIndicator?: boolean;
}

export function ImageGrid({
  images,
  onImageClick,
  onImageDelete,
  maxDisplay = 3,
  showMoreIndicator = true,
}: ImageGridProps) {
  if (images.length === 0) {
    return null;
  }

  const displayImages = images.slice(0, maxDisplay);
  const remainingCount = images.length - maxDisplay;

  return (
    <div className="image-grid">
      <div className="image-grid-thumbnails">
        {displayImages.map((image, index) => (
          <ImageThumbnail
            key={image.id}
            blob={image.blob}
            alt={`Image ${index + 1}`}
            onClick={onImageClick ? () => onImageClick(index) : undefined}
            onDelete={onImageDelete ? () => onImageDelete(image.id) : undefined}
          />
        ))}
      </div>

      {showMoreIndicator && remainingCount > 0 && (
        <div className="image-more-indicator">
          +{remainingCount} more {remainingCount === 1 ? 'image' : 'images'}
        </div>
      )}
    </div>
  );
}
