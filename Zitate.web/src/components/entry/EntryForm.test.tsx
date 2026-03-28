import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EntryForm } from './EntryForm';

describe('EntryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form elements', () => {
    render(<EntryForm onSave={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByLabelText(/quote text/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/citation date/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should show character counter', () => {
    render(<EntryForm onSave={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText(/0 \/ 10,000/)).toBeInTheDocument();
  });

  it('should update character counter when typing', async () => {
    const user = userEvent.setup();
    render(<EntryForm onSave={vi.fn()} onCancel={vi.fn()} />);

    const textarea = screen.getByLabelText(/quote text/i);
    await user.type(textarea, 'Hello');

    expect(screen.getByText(/5 \/ 10,000/)).toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(<EntryForm onSave={vi.fn()} onCancel={onCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should disable save button when text is empty', () => {
    render(<EntryForm onSave={vi.fn()} onCancel={vi.fn()} />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeDisabled();
  });

  it('should enable save button when valid text is entered', async () => {
    const user = userEvent.setup();
    render(<EntryForm onSave={vi.fn()} onCancel={vi.fn()} />);

    const textarea = screen.getByLabelText(/quote text/i);
    await user.type(textarea, 'Valid entry text');

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).not.toBeDisabled();
  });

  it('should call onSave with text and default citation date when save is clicked', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const fixedDate = new Date(2024, 5, 15);
    vi.spyOn(globalThis.Date, 'now').mockReturnValue(fixedDate.getTime());

    render(<EntryForm onSave={onSave} onCancel={vi.fn()} />);

    const textarea = screen.getByLabelText(/quote text/i);
    await user.type(textarea, 'Test entry');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        'Test entry',          // text
        fixedDate.getTime(),   // citationDate
        undefined,             // latitude
        undefined,             // longitude
        undefined,             // authorId
        [],                    // labelIds
        [],                    // selectedImages
        undefined,             // imagesToDelete
        undefined,             // imageIdsOrder
        undefined,             // imageReplacements
        undefined,             // addressShort
        undefined,             // addressFull
        []                     // links
      );
    });
  });

  it('should allow changing the citation date and pass it on save', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(<EntryForm onSave={onSave} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText(/quote text/i), 'Test entry');
    const dateInput = screen.getByLabelText(/citation date/i);
    
    // Use fireEvent for date inputs
    fireEvent.change(dateInput, { target: { value: '2023-01-01' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      // The getTime() for a date string like '2023-01-01' can be timezone-dependent.
      // It's safer to create the date object in the same way the component does.
      const expectedDate = new Date('2023-01-01').getTime();
      expect(onSave).toHaveBeenCalledWith(
        'Test entry',          // text
        expectedDate,          // citationDate
        undefined,             // latitude
        undefined,             // longitude
        undefined,             // authorId
        [],                    // labelIds
        [],                    // selectedImages
        undefined,             // imagesToDelete
        undefined,             // imageIdsOrder
        undefined,             // imageReplacements
        undefined,             // addressShort
        undefined,             // addressFull
        []                     // links
      );
    });
  });

  it('should show error for text exceeding 10,000 characters', async () => {
    const user = userEvent.setup();
    render(<EntryForm onSave={vi.fn()} onCancel={vi.fn()} />);

    const longText = 'a'.repeat(10001);
    const textarea = screen.getByLabelText(/quote text/i) as HTMLTextAreaElement;

    // Use React testing approach - clear and paste
    await user.clear(textarea);
    await user.click(textarea);

    // Simulate paste event with long text
    await user.paste(longText);

    await waitFor(() => {
      const errorElement = screen.queryByText(/text cannot exceed 10000 characters/i);
      expect(errorElement).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should auto-fetch location on mount', async () => {
    const mockPosition = {
      coords: {
        latitude: 52.52,
        longitude: 13.405,
        accuracy: 10,
      },
    };

    vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation(
      (success) => {
        success(mockPosition as GeolocationPosition);
      }
    );

    render(<EntryForm onSave={vi.fn()} onCancel={vi.fn()} />);

    // Should auto-fetch location and display it
    await waitFor(() => {
      expect(screen.getByText(/52.520000, 13.405000/i)).toBeInTheDocument();
    });
  });

  it('should call onSave with location when location is auto-fetched', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const mockPosition = {
      coords: {
        latitude: 52.52,
        longitude: 13.405,
        accuracy: 10,
      },
    };

    vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation(
      (success) => {
        success(mockPosition as GeolocationPosition);
      }
    );

    render(<EntryForm onSave={onSave} onCancel={vi.fn()} />);

    // Wait for auto-fetch to complete
    await waitFor(() => {
      expect(screen.getByText(/52.520000, 13.405000/i)).toBeInTheDocument();
    });

    const textarea = screen.getByLabelText(/quote text/i);
    await user.type(textarea, 'Entry with location');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        'Entry with location', // text
        expect.any(Number),    // citationDate
        52.52,                 // latitude
        13.405,                // longitude
        undefined,             // authorId
        [],                    // labelIds
        [],                    // selectedImages
        undefined,             // imagesToDelete
        undefined,             // imageIdsOrder
        undefined,             // imageReplacements
        undefined,             // addressShort
        undefined,             // addressFull
        []                     // links
      );
    });
  });

  it('should allow adding URLs and pass them on save', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(<EntryForm onSave={onSave} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText(/quote text/i), 'Entry with source');
    await user.click(screen.getByRole('button', { name: /add url/i }));
    await user.type(screen.getByLabelText('Attached URL'), 'https://example.com/source');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });

    const links = onSave.mock.calls[0][12];
    expect(links).toHaveLength(1);
    expect(links[0].url).toBe('https://example.com/source');
    expect(typeof links[0].id).toBe('string');
    expect(typeof links[0].addedAt).toBe('number');
  });

  it('should disable save when an entered URL is invalid', async () => {
    const user = userEvent.setup();

    render(<EntryForm onSave={vi.fn()} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText(/quote text/i), 'Entry with invalid url');
    await user.click(screen.getByRole('button', { name: /add url/i }));
    await user.type(screen.getByLabelText('Attached URL'), 'not-a-url');

    expect(screen.getByText(/invalid url format/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('should show loading state when saving', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<EntryForm onSave={onSave} onCancel={vi.fn()} />);

    const textarea = screen.getByLabelText(/quote text/i);
    await user.type(textarea, 'Test entry');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    expect(screen.getByText(/saving/i)).toBeInTheDocument();
  });

  it('should show error when location auto-fetch fails', async () => {
    const mockError = {
      code: 1,
      message: 'Permission denied',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation(
      (_, error) => {
        error!(mockError as GeolocationPositionError);
      }
    );

    render(<EntryForm onSave={vi.fn()} onCancel={vi.fn()} />);

    // Should show error from auto-fetch
    await waitFor(() => {
      expect(screen.getByText(/location permission denied/i)).toBeInTheDocument();
    });
  });

  it('should trim whitespace from text before validation', async () => {
    const user = userEvent.setup();
    render(<EntryForm onSave={vi.fn()} onCancel={vi.fn()} />);

    const textarea = screen.getByLabelText(/quote text/i);
    await user.type(textarea, '   ');

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeDisabled();
  });
});
