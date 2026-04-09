import { describe, it, vi, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EntryCard } from './EntryCard';
import { Entry, Author } from '../../models';

// Mock fetch for reverse geocoding – return minimal Nominatim response
globalThis.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ display_name: 'Berlin, Germany', address: { city: 'Berlin' } }),
});

const mockAuthor: Author = {
  id: 'author-1',
  name: 'John Doe',
};

// Mock hooks so EntryCard tests don't trigger async IndexedDB operations
vi.mock('../../hooks/useAuthors', () => ({
  useAuthors: () => ({
    getAuthorById: (id: string) => (id === mockAuthor.id ? mockAuthor : undefined),
  }),
}));

vi.mock('../../hooks/useLabels', () => ({
  useLabels: () => ({
    getLabelsByIds: () => [],
  }),
}));

vi.mock('../../hooks/useEntries', () => ({
  useEntries: () => ({
    getImagesForEntry: vi.fn().mockResolvedValue([]),
  }),
}));

describe('EntryCard', () => {
  const baseEntry: Entry = {
    id: 'entry-1',
    text: 'This is a test entry',
    latitude: 52.52,
    longitude: 13.405,
    labelIds: [],
    imageAttachments: [],
    links: [],
    createdAt: new Date('2024-06-15').getTime(),
    updatedAt: new Date('2024-06-15').getTime(),
  };

  it('should render entry text', () => {
    render(<EntryCard entry={baseEntry} />);
    expect(screen.getByText('This is a test entry')).toBeInTheDocument();
  });

  describe('Author and Date Line Rendering', () => {
    it('Case 1: Renders author, citation date, and added date', () => {
      const entry: Entry = {
        ...baseEntry,
        authorId: 'author-1',
        citationDate: new Date('2023-01-01').getTime(),
      };
      render(<EntryCard entry={entry} />);
      const authorLine = screen.getByText(/John Doe/);
      expect(authorLine).toBeInTheDocument();
      expect(authorLine.textContent).toContain('John Doe, Jan 1, 2023');
      expect(authorLine.textContent).toContain('added Jun 15, 2024');
    });

    it('Case 2: Renders citation date and added date (no author)', () => {
      const entry: Entry = {
        ...baseEntry,
        citationDate: new Date('2023-01-01').getTime(),
      };
      render(<EntryCard entry={entry} />);
      const authorLine = screen.getByText(/Jan 1, 2023/);
      expect(authorLine).toBeInTheDocument();
      expect(authorLine.textContent).toContain('added Jun 15, 2024');
      expect(authorLine.textContent).not.toContain('John Doe');
    });

    it('Case 3: Renders only added date (no author, no citation date)', () => {
      render(<EntryCard entry={baseEntry} />);
      const authorLine = screen.getByText(/Added Jun 15, 2024/i);
      expect(authorLine).toBeInTheDocument();
      expect(authorLine.textContent).not.toContain('John Doe');
    });

    it('Case 4: Renders author and added date (no citation date)', () => {
      const entry: Entry = {
        ...baseEntry,
        authorId: 'author-1',
      };
      render(<EntryCard entry={entry} />);
      const authorLine = screen.getByText(/John Doe/);
      expect(authorLine).toBeInTheDocument();
      expect(authorLine.textContent).toContain('added Jun 15, 2024');
      expect(authorLine.textContent).not.toContain('Jan 1, 2023');
    });

    it('should render "Today" for recent dates', () => {
      const entry: Entry = {
        ...baseEntry,
        createdAt: Date.now(),
        citationDate: Date.now() - 86400000, // Yesterday
      };
      render(<EntryCard entry={entry} />);
      const authorLine = screen.getByText(/Yesterday/);
      expect(authorLine.textContent).toContain('added Today');
    });
  });


  it('should render location when coordinates are present', async () => {
    render(<EntryCard entry={baseEntry} />);
    await waitFor(() => {
      expect(screen.getByText(/52.520000, 13.405000/i)).toBeInTheDocument();
    });
  });

  it('should not render location when coordinates are missing', () => {
    const entryWithoutLocation: Entry = {
      ...baseEntry,
      latitude: undefined,
      longitude: undefined,
    };
    render(<EntryCard entry={entryWithoutLocation} />);
    expect(screen.queryByText(/52.520000/)).not.toBeInTheDocument();
  });

  it('should render delete button when onDelete is provided', () => {
    render(<EntryCard entry={baseEntry} onDelete={vi.fn()} />);
    const deleteButton = screen.getByLabelText('Delete entry');
    expect(deleteButton).toBeInTheDocument();
  });

  it('should call onDelete when delete is clicked and confirmed', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<EntryCard entry={baseEntry} onDelete={onDelete} />);
    const deleteButton = screen.getByLabelText('Delete entry');
    await user.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalledWith('entry-1');
    confirmSpy.mockRestore();
  });

  it('should render URL toggle when entry has attached links', () => {
    render(
      <EntryCard
        entry={{
          ...baseEntry,
          links: [{ id: 'link-1', url: 'https://example.com', addedAt: Date.now() }],
        }}
      />
    );
    expect(screen.getByLabelText(/show attached urls/i)).toBeInTheDocument();
  });
});
