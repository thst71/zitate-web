import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EntryCard } from './EntryCard';
import { Entry } from '../../models';

describe('EntryCard', () => {
  const mockEntry: Entry = {
    id: 'entry-1',
    text: 'This is a test entry',
    latitude: 52.52,
    longitude: 13.405,
    labelIds: [],
    imageIds: [],
    createdAt: Date.now() - 86400000, // 1 day ago
    updatedAt: Date.now() - 86400000,
  };

  it('should render entry text', () => {
    render(<EntryCard entry={mockEntry} />);

    expect(screen.getByText('This is a test entry')).toBeInTheDocument();
  });

  it('should render location when coordinates are present', () => {
    render(<EntryCard entry={mockEntry} />);

    expect(screen.getByText(/52.520000, 13.405000/i)).toBeInTheDocument();
  });

  it('should not render location when coordinates are missing', () => {
    const entryWithoutLocation: Entry = {
      ...mockEntry,
      latitude: undefined,
      longitude: undefined,
    };

    render(<EntryCard entry={entryWithoutLocation} />);

    expect(screen.queryByText(/52.520000/)).not.toBeInTheDocument();
  });

  it('should render "Yesterday" for entry from 1 day ago', () => {
    render(<EntryCard entry={mockEntry} />);

    expect(screen.getByText('Yesterday')).toBeInTheDocument();
  });

  it('should render "Today" for entry from today', () => {
    const todayEntry: Entry = {
      ...mockEntry,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    render(<EntryCard entry={todayEntry} />);

    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('should render "X days ago" for recent entries', () => {
    const threeDaysAgo: Entry = {
      ...mockEntry,
      createdAt: Date.now() - 3 * 86400000,
      updatedAt: Date.now() - 3 * 86400000,
    };

    render(<EntryCard entry={threeDaysAgo} />);

    expect(screen.getByText('3 days ago')).toBeInTheDocument();
  });

  it('should render formatted date for older entries', () => {
    const oldEntry: Entry = {
      ...mockEntry,
      createdAt: Date.now() - 30 * 86400000, // 30 days ago
      updatedAt: Date.now() - 30 * 86400000,
    };

    render(<EntryCard entry={oldEntry} />);

    // Should show formatted date instead of "X days ago"
    const dateElement = screen.getByText(/\w{3}\s+\d{1,2},\s+\d{4}/);
    expect(dateElement).toBeInTheDocument();
  });

  it('should render delete button when onDelete is provided', () => {
    render(<EntryCard entry={mockEntry} onDelete={vi.fn()} />);

    const deleteButton = screen.getByLabelText('Delete entry');
    expect(deleteButton).toBeInTheDocument();
  });

  it('should not render delete button when onDelete is not provided', () => {
    render(<EntryCard entry={mockEntry} />);

    expect(screen.queryByLabelText('Delete entry')).not.toBeInTheDocument();
  });

  it('should show confirmation dialog and call onDelete when delete is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<EntryCard entry={mockEntry} onDelete={onDelete} />);

    const deleteButton = screen.getByLabelText('Delete entry');
    await user.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalledWith(
      'Are you sure you want to delete this entry?'
    );
    expect(onDelete).toHaveBeenCalledWith('entry-1');

    confirmSpy.mockRestore();
  });

  it('should not call onDelete when confirmation is cancelled', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    // Mock window.confirm to return false
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<EntryCard entry={mockEntry} onDelete={onDelete} />);

    const deleteButton = screen.getByLabelText('Delete entry');
    await user.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('should render location icon when coordinates are present', () => {
    const { container } = render(<EntryCard entry={mockEntry} />);

    const locationIcon = container.querySelector('.location-icon');
    expect(locationIcon).toBeInTheDocument();
  });

  it('should handle very long text', () => {
    const longTextEntry: Entry = {
      ...mockEntry,
      text: 'a'.repeat(1000),
    };

    render(<EntryCard entry={longTextEntry} />);

    expect(screen.getByText('a'.repeat(1000))).toBeInTheDocument();
  });

  it('should handle text with special characters', () => {
    const specialTextEntry: Entry = {
      ...mockEntry,
      text: 'Text with émojis 🎉 and symbols @#$%',
    };

    render(<EntryCard entry={specialTextEntry} />);

    expect(
      screen.getByText('Text with émojis 🎉 and symbols @#$%')
    ).toBeInTheDocument();
  });
});
