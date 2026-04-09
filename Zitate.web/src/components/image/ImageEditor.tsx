/**
 * ImageEditor Component - Manage images in entry edit mode
 * Supports: add, delete, reorder, replace existing images
 */
import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { ImageThumbnail } from './ImageThumbnail';
import { ImageUpload, type SelectedImage } from './ImageUpload';
import { isValidImageType, isValidImageSize, readFileAsDataURL } from '../../services/image.service';
import type { ImageAttachmentWithBlob } from '../../models';
import './ImageEditor.css';

export interface ImageChanges {
  imagesToAdd: SelectedImage[];
  imagesToDelete: string[];
  imageIdsOrder: string[];
  imageReplacements: Map<string, SelectedImage>;
}

interface ImageEditorProps {
  existingImages: ImageAttachmentWithBlob[];
  maxImages?: number;
  onChange: (changes: ImageChanges) => void;
}

export function ImageEditor({
  existingImages,
  maxImages = 10,
  onChange,
}: ImageEditorProps) {
  // Local working copy of existing image IDs (reflects reorder/delete)
  const [workingImageIds, setWorkingImageIds] = useState<string[]>(
    existingImages.map((img) => img.id)
  );
  const [imagesToAdd, setImagesToAdd] = useState<SelectedImage[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [imageReplacements, setImageReplacements] = useState<Map<string, SelectedImage>>(new Map());
  const [replaceError, setReplaceError] = useState<string | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replacingImageId, setReplacingImageId] = useState<string | null>(null);

  // Sync workingImageIds when existingImages load asynchronously
  useEffect(() => {
    const ids = existingImages.map((img) => img.id);
    setWorkingImageIds((prev) => {
      // Only update if the set of IDs actually changed (avoid resetting user edits)
      if (prev.length === 0 && ids.length > 0) {
        return ids;
      }
      return prev;
    });
  }, [existingImages]);

  // Sync changes up to parent
  useEffect(() => {
    onChange({
      imagesToAdd,
      imagesToDelete,
      imageIdsOrder: workingImageIds,
      imageReplacements,
    });
  }, [imagesToAdd, imagesToDelete, workingImageIds, imageReplacements]);
  // Note: onChange intentionally excluded from deps to avoid infinite loops

  // Visible existing images (excluding deleted ones)
  const visibleExistingImages = workingImageIds
    .filter((id) => !imagesToDelete.includes(id))
    .map((id) => existingImages.find((img) => img.id === id))
    .filter((img): img is ImageAttachmentWithBlob => img !== undefined);

  const totalCount = visibleExistingImages.length + imagesToAdd.length;
  const remainingSlots = maxImages - totalCount;

  const handleDelete = (imageId: string) => {
    setImagesToDelete((prev) => [...prev, imageId]);
  };

  const handleMoveUp = (imageId: string) => {
    setWorkingImageIds((prev) => {
      // Filter out deleted to find visible positions, but move in full array
      const idx = prev.indexOf(imageId);
      if (idx <= 0) return prev;
      // Find the previous non-deleted item
      let swapIdx = idx - 1;
      while (swapIdx >= 0 && imagesToDelete.includes(prev[swapIdx])) {
        swapIdx--;
      }
      if (swapIdx < 0) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  };

  const handleMoveDown = (imageId: string) => {
    setWorkingImageIds((prev) => {
      const idx = prev.indexOf(imageId);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      // Find the next non-deleted item
      let swapIdx = idx + 1;
      while (swapIdx < prev.length && imagesToDelete.includes(prev[swapIdx])) {
        swapIdx++;
      }
      if (swapIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  };

  const handleReplace = (imageId: string) => {
    setReplacingImageId(imageId);
    setReplaceError(null);
    replaceInputRef.current?.click();
  };

  const handleReplaceFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingImageId) return;

    if (!isValidImageType(file)) {
      setReplaceError('Invalid file type. Only JPEG, PNG, HEIC, and WebP are supported.');
      return;
    }
    if (!isValidImageSize(file, 10)) {
      setReplaceError('File too large (max 10MB before compression).');
      return;
    }

    try {
      const previewUrl = await readFileAsDataURL(file);
      const selectedImage: SelectedImage = {
        file,
        previewUrl,
        id: `replace-${Date.now()}`,
      };
      setImageReplacements((prev) => {
        const next = new Map(prev);
        next.set(replacingImageId, selectedImage);
        return next;
      });
      setReplaceError(null);
    } catch {
      setReplaceError('Failed to load image preview.');
    }

    // Reset
    setReplacingImageId(null);
    if (replaceInputRef.current) {
      replaceInputRef.current.value = '';
    }
  };

  const handleNewImagesSelected = (images: SelectedImage[]) => {
    setImagesToAdd(images);
  };

  const visibleIndex = (imageId: string): number => {
    return visibleExistingImages.findIndex((img) => img.id === imageId);
  };

  return (
    <div className="image-editor">
      <div className="image-editor-header">
        <label className="form-label">Images</label>
        <span className="image-editor-count">
          {totalCount} / {maxImages}
        </span>
      </div>

      {visibleExistingImages.length > 0 && (
        <div className="image-editor-grid">
          {visibleExistingImages.map((image) => {
            const replacement = imageReplacements.get(image.id);
            const idx = visibleIndex(image.id);
            const isFirst = idx === 0;
            const isLast = idx === visibleExistingImages.length - 1;

            return (
              <div key={image.id} className="image-editor-item">
                {replacement ? (
                  <div className="image-thumbnail">
                    <img
                      src={replacement.previewUrl}
                      alt="Replacement preview"
                      className="thumbnail-image"
                    />
                  </div>
                ) : (
                  <ImageThumbnail
                    blob={image.blob}
                    alt={`Image ${idx + 1}`}
                  />
                )}

                <div className="image-editor-actions">
                  <button
                    type="button"
                    className="image-action-btn"
                    onClick={() => handleMoveUp(image.id)}
                    disabled={isFirst}
                    aria-label="Move image up"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="image-action-btn"
                    onClick={() => handleMoveDown(image.id)}
                    disabled={isLast}
                    aria-label="Move image down"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="image-action-btn image-action-replace"
                    onClick={() => handleReplace(image.id)}
                    aria-label="Replace image"
                    title="Replace"
                  >
                    ↻
                  </button>
                  <button
                    type="button"
                    className="image-action-btn image-action-delete"
                    onClick={() => handleDelete(image.id)}
                    aria-label="Delete image"
                    title="Delete"
                  >
                    ×
                  </button>
                </div>

                {replacement && (
                  <div className="image-replaced-badge">Replaced</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {replaceError && (
        <div className="upload-error" role="alert">
          {replaceError}
        </div>
      )}

      {/* Hidden file input for replace */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
        onChange={handleReplaceFileSelect}
        className="file-input-hidden"
      />

      {/* Add new images */}
      {remainingSlots > 0 && (
        <ImageUpload
          onImagesSelected={handleNewImagesSelected}
          maxImages={maxImages}
          currentImageCount={visibleExistingImages.length}
        />
      )}

      {remainingSlots <= 0 && imagesToAdd.length === 0 && (
        <p className="form-hint">Maximum number of images reached ({maxImages}).</p>
      )}
    </div>
  );
}

