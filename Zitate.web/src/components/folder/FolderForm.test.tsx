import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FolderForm } from './FolderForm';

// Mock the hooks
vi.mock('../../hooks/useAuthors', () => ({
  useAuthors: () => ({
    authors: [],
    loading: false,
    addAuthor: vi.fn(),
  }),
}));

vi.mock('../../hooks/useLabels', () => ({
  useLabels: () => ({
    labels: [],
    loading: false,
    addLabel: vi.fn(),
    searchLabels: vi.fn(() => []),
    getLabelsByIds: vi.fn(() => []),
  }),
}));

describe('FolderForm', () => {
  it('should render folder name input', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(<FolderForm onSave={onSave} onCancel={onCancel} />);

    expect(screen.getByLabelText(/folder name/i)).toBeInTheDocument();
  });

  it('should render form sections', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(<FolderForm onSave={onSave} onCancel={onCancel} />);

    expect(screen.getByText(/filter criteria/i)).toBeInTheDocument();
  });

  it('should render location radio buttons', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(<FolderForm onSave={onSave} onCancel={onCancel} />);

    expect(screen.getByText(/any.*with or without location/i)).toBeInTheDocument();
    expect(screen.getByText(/^with location$/i)).toBeInTheDocument();
    expect(screen.getByText(/^without location$/i)).toBeInTheDocument();
  });

  it('should update folder name when typed', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(<FolderForm onSave={onSave} onCancel={onCancel} />);

    const input = screen.getByLabelText(/folder name/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'My Folder' } });

    expect(input.value).toBe('My Folder');
  });

  it('should call onCancel when cancel button is clicked', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(<FolderForm onSave={onSave} onCancel={onCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('should disable submit button when folder name is empty', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(<FolderForm onSave={onSave} onCancel={onCancel} />);

    const submitButton = screen.getByRole('button', { name: /create folder/i });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when folder name is provided', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(<FolderForm onSave={onSave} onCancel={onCancel} />);

    const input = screen.getByLabelText(/folder name/i);
    fireEvent.change(input, { target: { value: 'Test Folder' } });

    const submitButton = screen.getByRole('button', { name: /create folder/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('should call onSave with folder name and criteria when form is submitted', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();

    render(<FolderForm onSave={onSave} onCancel={onCancel} />);

    const nameInput = screen.getByLabelText(/folder name/i);
    fireEvent.change(nameInput, { target: { value: 'Test Folder' } });

    const submitButton = screen.getByRole('button', { name: /create folder/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('Test Folder', expect.any(Object));
    });
  });

  it('should update hasLocation when radio buttons are clicked', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();

    render(<FolderForm onSave={onSave} onCancel={onCancel} />);

    const nameInput = screen.getByLabelText(/folder name/i);
    fireEvent.change(nameInput, { target: { value: 'Test Folder' } });

    // Find and click "With location" radio button
    const withLocationLabel = screen.getByText(/^With location$/);
    const withLocationRadio = withLocationLabel.previousElementSibling as HTMLInputElement;
    fireEvent.click(withLocationRadio);

    const submitButton = screen.getByRole('button', { name: /create folder/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('Test Folder',
        expect.objectContaining({ hasLocation: true })
      );
    });
  });

  it('should show Update Folder button when editing existing folder', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();

    const existingFolder = {
      id: '1',
      name: 'Existing Folder',
      criteria: {},
      order: 0,
      createdAt: new Date().getTime(),
    };

    render(<FolderForm onSave={onSave} onCancel={onCancel} initialFolder={existingFolder} />);

    expect(screen.getByRole('button', { name: /update folder/i })).toBeInTheDocument();
  });

  it('should pre-fill form when editing existing folder', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();

    const existingFolder = {
      id: '1',
      name: 'Existing Folder',
      criteria: {
        textMatch: 'important',
      },
      order: 0,
      createdAt: new Date().getTime(),
    };

    render(<FolderForm onSave={onSave} onCancel={onCancel} initialFolder={existingFolder} />);

    const nameInput = screen.getByLabelText(/folder name/i) as HTMLInputElement;
    expect(nameInput.value).toBe('Existing Folder');

    const textInput = screen.getByLabelText(/text contains/i) as HTMLInputElement;
    expect(textInput.value).toBe('important');
  });

  it('should show error message when save fails', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Save failed'));
    const onCancel = vi.fn();

    render(<FolderForm onSave={onSave} onCancel={onCancel} />);

    const nameInput = screen.getByLabelText(/folder name/i);
    fireEvent.change(nameInput, { target: { value: 'Test Folder' } });

    const submitButton = screen.getByRole('button', { name: /create folder/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/save failed/i)).toBeInTheDocument();
    });
  });

  it('should update text contains field', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(<FolderForm onSave={onSave} onCancel={onCancel} />);

    const textInput = screen.getByLabelText(/text contains/i) as HTMLInputElement;
    fireEvent.change(textInput, { target: { value: 'important meeting' } });

    expect(textInput.value).toBe('important meeting');
  });
});
