/**
 * ImageViewer Component - Full-size image viewer modal with navigation
 */
import { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { createImageURL, revokeImageURL } from '../../services/image.service';
import type { ImageAttachment } from '../../models';
import './ImageViewer.css';

interface ImageViewerProps {
  images: ImageAttachment[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageViewer({ images, initialIndex, isOpen, onClose }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen && images[currentIndex]) {
      const url = createImageURL(images[currentIndex].blob);
      setImageUrl(url);

      return () => {
        revokeImageURL(url);
      };
    }
  }, [currentIndex, images, isOpen]);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  if (!isOpen || images.length === 0) {
    return null;
  }

  const showNavigation = images.length > 1;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Image ${currentIndex + 1} of ${images.length}`}
      className="image-viewer-modal"
    >
      <div className="image-viewer">
        <div className="viewer-content">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={`Image ${currentIndex + 1}`}
              className="viewer-image"
            />
          )}

          {showNavigation && (
            <>
              <button
                type="button"
                className="viewer-nav viewer-nav-prev"
                onClick={handlePrevious}
                aria-label="Previous image"
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>

              <button
                type="button"
                className="viewer-nav viewer-nav-next"
                onClick={handleNext}
                aria-label="Next image"
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </>
          )}
        </div>

        {showNavigation && (
          <div className="viewer-counter">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </Modal>
  );
}
