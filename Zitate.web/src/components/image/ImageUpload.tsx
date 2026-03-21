/**
 * ImageUpload Component - File picker for uploading images
 */
import { useState, useRef, ChangeEvent } from 'react';
import { isValidImageType, isValidImageSize, readFileAsDataURL } from '../../services/image.service';
import './ImageUpload.css';

export interface SelectedImage {
  file: File;
  previewUrl: string;
  id: string;
}

interface ImageUploadProps {
  onImagesSelected: (images: SelectedImage[]) => void;
  maxImages?: number;
  currentImageCount?: number;
}

export function ImageUpload({
  onImagesSelected,
  maxImages = 10,
  currentImageCount = 0
}: ImageUploadProps) {
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);

    const newImages: SelectedImage[] = [];
    const errors: string[] = [];

    // Check total count
    const totalCount = currentImageCount + selectedImages.length + files.length;
    if (totalCount > maxImages) {
      setError(`Maximum ${maxImages} images allowed per entry`);
      return;
    }

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate type
      if (!isValidImageType(file)) {
        errors.push(`${file.name}: Invalid file type. Only JPEG, PNG, HEIC, and WebP are supported.`);
        continue;
      }

      // Validate size (before compression)
      if (!isValidImageSize(file, 10)) {
        errors.push(`${file.name}: File too large (max 10MB before compression)`);
        continue;
      }

      try {
        // Create preview URL
        const previewUrl = await readFileAsDataURL(file);
        newImages.push({
          file,
          previewUrl,
          id: `preview-${Date.now()}-${i}`,
        });
      } catch {
        errors.push(`${file.name}: Failed to load preview`);
      }
    }

    if (errors.length > 0) {
      setError(errors.join(' '));
    }

    if (newImages.length > 0) {
      const updatedImages = [...selectedImages, ...newImages];
      setSelectedImages(updatedImages);
      onImagesSelected(updatedImages);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (id: string) => {
    const updatedImages = selectedImages.filter(img => img.id !== id);
    setSelectedImages(updatedImages);
    onImagesSelected(updatedImages);
    setError(null);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const remainingSlots = maxImages - currentImageCount - selectedImages.length;

  return (
    <div className="image-upload">
      <div className="upload-header">
        <label className="form-label">Images (Optional)</label>
        <span className="image-count">
          {currentImageCount + selectedImages.length} / {maxImages}
        </span>
      </div>

      {selectedImages.length > 0 && (
        <div className="image-preview-grid">
          {selectedImages.map((image) => (
            <div key={image.id} className="image-preview-item">
              <img
                src={image.previewUrl}
                alt={image.file.name}
                className="preview-thumbnail"
              />
              <button
                type="button"
                className="remove-image"
                onClick={() => handleRemoveImage(image.id)}
                aria-label="Remove image"
              >
                ×
              </button>
              <div className="image-name">{image.file.name}</div>
            </div>
          ))}
        </div>
      )}

      {remainingSlots > 0 && (
        <button
          type="button"
          className="btn btn-secondary upload-button"
          onClick={handleClick}
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
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          Add Images ({remainingSlots} remaining)
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
        multiple
        onChange={handleFileSelect}
        className="file-input-hidden"
      />

      {error && (
        <div className="upload-error" role="alert">
          {error}
        </div>
      )}

      <p className="form-hint">
        Supported formats: JPEG, PNG, HEIC, WebP. Max 10MB per file (will be compressed to 2MB).
      </p>
    </div>
  );
}
