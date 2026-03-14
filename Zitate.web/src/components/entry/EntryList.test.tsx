import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EntryList } from './EntryList';
import { Entry } from '../../models';

describe('EntryList', () => {
  const mockEntries: Entry[] = [
    {
      id: 'entry-1',
      text: 'First entry',
      labelIds: [],
      imageIds: [],
      createdAt: Date.now() - 2000,
      updatedAt: Date.now() - 2000,
    },
    {
      id: 'entry-2',
      text: 'Second entry',
      latitude: 52.52,
      longitude: 13.405,
      labelIds: [],
      imageIds: [],
      createdAt: Date.now() - 1000,
      updatedAt: Date.now() - 1000,
    },
  ];

  it('should render all entries', () => {
    render(<EntryList entries={mockEntries} />);

    expect(screen.getByText('First entry')).toBeInTheDocument();
    expect(screen.getByText('Second entry')).toBeInTheDocument();
  });

  it('should show empty state when no entries', () => {
    render(<EntryList entries={[]} />);

    expect(screen.getByText('No Entries Yet')).toBeInTheDocument();
    expect(
      screen.getByText('Tap the + button to create your first entry')
    ).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<EntryList entries={[]} loading={true} />);

    expect(screen.getByText('Loading entries...')).toBeInTheDocument();
  });

  it('should show error state', () => {
    render(<EntryList entries={[]} error="Failed to load entries" />);

    expect(screen.getByText('Failed to load entries')).toBeInTheDocument();
  });

  it('should pass onDeleteEntry to EntryCard components', async () => {
    const user = userEvent.setup();
    const onDeleteEntry = vi.fn();

    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<EntryList entries={mockEntries} onDeleteEntry={onDeleteEntry} />);

    const deleteButtons = screen.getAllByLabelText('Delete entry');
    expect(deleteButtons).toHaveLength(2);

    await user.click(deleteButtons[0]);

    expect(onDeleteEntry).toHaveBeenCalledWith('entry-1');

    confirmSpy.mockRestore();
  });

  it('should not render delete buttons when onDeleteEntry is not provided', () => {
    render(<EntryList entries={mockEntries} />);

    expect(screen.queryByLabelText('Delete entry')).not.toBeInTheDocument();
  });

  it('should render entries in order', () => {
    const { container } = render(<EntryList entries={mockEntries} />);

    const entryCards = container.querySelectorAll('.entry-card');
    expect(entryCards).toHaveLength(2);

    // First card should contain "First entry"
    expect(entryCards[0].textContent).toContain('First entry');
    // Second card should contain "Second entry"
    expect(entryCards[1].textContent).toContain('Second entry');
  });

  it('should show spinner in loading state', () => {
    const { container } = render(<EntryList entries={[]} loading={true} />);

    const spinner = container.querySelector('.spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('should render empty state icon', () => {
    const { container } = render(<EntryList entries={[]} />);

    const svg = container.querySelector('.entry-list-empty svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render error icon in error state', () => {
    const { container } = render(
      <EntryList entries={[]} error="Test error" />
    );

    const svg = container.querySelector('.entry-list-empty svg');
    expect(svg).toBeInTheDocument();
  });

  it('should handle single entry', () => {
    render(<EntryList entries={[mockEntries[0]]} />);

    expect(screen.getByText('First entry')).toBeInTheDocument();
    expect(screen.queryByText('Second entry')).not.toBeInTheDocument();
  });

  it('should handle many entries', () => {
    const manyEntries: Entry[] = Array.from({ length: 50 }, (_, i) => ({
      id: `entry-${i}`,
      text: `Entry ${i}`,
      labelIds: [],
      imageIds: [],
      createdAt: Date.now() - i * 1000,
      updatedAt: Date.now() - i * 1000,
    }));

    const { container } = render(<EntryList entries={manyEntries} />);

    const entryCards = container.querySelectorAll('.entry-card');
    expect(entryCards).toHaveLength(50);
  });

  it('should show error even when entries are present', () => {
    render(
      <EntryList
        entries={mockEntries}
        loading={false}
        error="Some error"
      />
    );

    // Should show error, not entries (error takes precedence)
    expect(screen.getByText('Some error')).toBeInTheDocument();
    expect(screen.queryByText('First entry')).not.toBeInTheDocument();
  });

  it('should prioritize loading state over error', () => {
    render(<EntryList entries={[]} loading={true} error="Test error" />);

    expect(screen.getByText('Loading entries...')).toBeInTheDocument();
    expect(screen.queryByText('Test error')).not.toBeInTheDocument();
  });

  it('should prioritize error state over empty state', () => {
    render(<EntryList entries={[]} loading={false} error="Test error" />);

    expect(screen.getByText('Test error')).toBeInTheDocument();
    expect(screen.queryByText('No Entries Yet')).not.toBeInTheDocument();
  });
});
