import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EntryForm } from './EntryForm';

describe('EntryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form elements', () => {
    render(<EntryForm onSave={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByLabelText(/quote text/i)).toBeInTheDocument();
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

  it('should call onSave with text when save button is clicked', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(<EntryForm onSave={onSave} onCancel={vi.fn()} />);

    const textarea = screen.getByLabelText(/quote text/i);
    await user.type(textarea, 'Test entry');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('Test entry', undefined, undefined, undefined, []);
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
      expect(onSave).toHaveBeenCalledWith('Entry with location', 52.52, 13.405, undefined, []);
    });
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
