import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageEditor, type ImageChanges } from './ImageEditor';
import type { ImageAttachment } from '../../models';

// Mock useEntries to avoid IndexedDB dependency
vi.mock('../../hooks/useEntries', () => ({
  useEntries: () => ({
    getImagesForEntry: vi.fn().mockResolvedValue([]),
  }),
}));

// Mock image service functions
vi.mock('../../services/image.service', () => ({
  createImageURL: vi.fn((blob: Blob) => `blob:mock-${blob.size}`),
  revokeImageURL: vi.fn(),
  isValidImageType: vi.fn(() => true),
  isValidImageSize: vi.fn(() => true),
  readFileAsDataURL: vi.fn(() => Promise.resolve('data:image/png;base64,mock')),
  compressImage: vi.fn((file: File) => Promise.resolve(file)),
}));

function createMockImage(id: string, order: number): ImageAttachment {
  return {
    id,
    entryId: 'entry-1',
    blob: new Blob(['mock-image-data'], { type: 'image/png' }),
    mimeType: 'image/png',
    size: 1024,
    order,
    createdAt: Date.now(),
  };
}

describe('ImageEditor', () => {
  let onChange: ReturnType<typeof vi.fn>;
  let mockImages: ImageAttachment[];

  beforeEach(() => {
    vi.clearAllMocks();
    onChange = vi.fn();
    mockImages = [
      createMockImage('img-1', 0),
      createMockImage('img-2', 1),
      createMockImage('img-3', 2),
    ];
  });

  it('should render existing images', () => {
    const { container } = render(
      <ImageEditor existingImages={mockImages} onChange={onChange} />
    );

    const editorCount = container.querySelector('.image-editor-count');
    expect(editorCount?.textContent).toMatch(/3\s*\/\s*10/);
    expect(screen.getAllByLabelText(/delete image/i)).toHaveLength(3);
    expect(screen.getAllByLabelText(/move image up/i)).toHaveLength(3);
    expect(screen.getAllByLabelText(/move image down/i)).toHaveLength(3);
    expect(screen.getAllByLabelText(/replace image/i)).toHaveLength(3);
  });

  it('should render empty state with upload only', () => {
    const { container } = render(
      <ImageEditor existingImages={[]} onChange={onChange} />
    );

    const editorCount = container.querySelector('.image-editor-count');
    expect(editorCount?.textContent).toMatch(/0\s*\/\s*10/);
    expect(screen.queryAllByLabelText(/delete image/i)).toHaveLength(0);
  });

  it('should call onChange with imagesToDelete when delete button clicked', async () => {
    const user = userEvent.setup();
    render(
      <ImageEditor existingImages={mockImages} onChange={onChange} />
    );

    const deleteButtons = screen.getAllByLabelText(/delete image/i);
    await user.click(deleteButtons[0]);

    // onChange should have been called with img-1 in imagesToDelete
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as ImageChanges;
    expect(lastCall.imagesToDelete).toContain('img-1');
  });

  it('should remove deleted image from the grid', async () => {
    const user = userEvent.setup();
    render(
      <ImageEditor existingImages={mockImages} onChange={onChange} />
    );

    // Initially 3 delete buttons
    expect(screen.getAllByLabelText(/delete image/i)).toHaveLength(3);

    const deleteButtons = screen.getAllByLabelText(/delete image/i);
    await user.click(deleteButtons[0]);

    // Now 2 delete buttons
    expect(screen.getAllByLabelText(/delete image/i)).toHaveLength(2);
  });

  it('should update count when image is deleted', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ImageEditor existingImages={mockImages} onChange={onChange} />
    );

    const editorCount = container.querySelector('.image-editor-count')!;
    expect(editorCount.textContent).toMatch(/3\s*\/\s*10/);

    const deleteButtons = screen.getAllByLabelText(/delete image/i);
    await user.click(deleteButtons[0]);

    expect(editorCount.textContent).toMatch(/2\s*\/\s*10/);
  });

  it('should call onChange with updated order when move-up clicked', async () => {
    const user = userEvent.setup();
    render(
      <ImageEditor existingImages={mockImages} onChange={onChange} />
    );

    // Click move-up on the second image (img-2)
    const moveUpButtons = screen.getAllByLabelText(/move image up/i);
    await user.click(moveUpButtons[1]);

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as ImageChanges;
    // img-2 should now be before img-1
    expect(lastCall.imageIdsOrder[0]).toBe('img-2');
    expect(lastCall.imageIdsOrder[1]).toBe('img-1');
    expect(lastCall.imageIdsOrder[2]).toBe('img-3');
  });

  it('should call onChange with updated order when move-down clicked', async () => {
    const user = userEvent.setup();
    render(
      <ImageEditor existingImages={mockImages} onChange={onChange} />
    );

    // Click move-down on the first image (img-1)
    const moveDownButtons = screen.getAllByLabelText(/move image down/i);
    await user.click(moveDownButtons[0]);

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as ImageChanges;
    // img-1 should now be after img-2
    expect(lastCall.imageIdsOrder[0]).toBe('img-2');
    expect(lastCall.imageIdsOrder[1]).toBe('img-1');
    expect(lastCall.imageIdsOrder[2]).toBe('img-3');
  });

  it('should disable move-up for the first image', () => {
    render(
      <ImageEditor existingImages={mockImages} onChange={onChange} />
    );

    const moveUpButtons = screen.getAllByLabelText(/move image up/i);
    expect(moveUpButtons[0]).toBeDisabled();
    expect(moveUpButtons[1]).not.toBeDisabled();
  });

  it('should disable move-down for the last image', () => {
    render(
      <ImageEditor existingImages={mockImages} onChange={onChange} />
    );

    const moveDownButtons = screen.getAllByLabelText(/move image down/i);
    expect(moveDownButtons[2]).toBeDisabled();
    expect(moveDownButtons[1]).not.toBeDisabled();
  });

  it('should report empty changes initially', () => {
    render(
      <ImageEditor existingImages={mockImages} onChange={onChange} />
    );

    // The initial onChange call should have no deletions/additions/replacements
    const firstCall = onChange.mock.calls[0][0] as ImageChanges;
    expect(firstCall.imagesToAdd).toEqual([]);
    expect(firstCall.imagesToDelete).toEqual([]);
    expect(firstCall.imageIdsOrder).toEqual(['img-1', 'img-2', 'img-3']);
    expect(firstCall.imageReplacements.size).toBe(0);
  });

  it('should show maximum reached message when at limit', () => {
    const tenImages = Array.from({ length: 10 }, (_, i) =>
      createMockImage(`img-${i}`, i)
    );

    render(
      <ImageEditor existingImages={tenImages} maxImages={10} onChange={onChange} />
    );

    expect(screen.getByText(/maximum number of images reached/i)).toBeInTheDocument();
  });

  it('should handle multiple deletes correctly', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ImageEditor existingImages={mockImages} onChange={onChange} />
    );

    // Delete first image
    let deleteButtons = screen.getAllByLabelText(/delete image/i);
    await user.click(deleteButtons[0]);

    // Delete what is now the first image (was img-2)
    deleteButtons = screen.getAllByLabelText(/delete image/i);
    await user.click(deleteButtons[0]);

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as ImageChanges;
    expect(lastCall.imagesToDelete).toContain('img-1');
    expect(lastCall.imagesToDelete).toContain('img-2');

    const editorCount = container.querySelector('.image-editor-count')!;
    expect(editorCount.textContent).toMatch(/1\s*\/\s*10/);
  });
});

