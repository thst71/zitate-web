import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthorSelect } from './AuthorSelect';
import { dbService } from '../../services/db.service';
import { STORES } from '../../db/schema';
import type { Author } from '../../models';

const seedAuthors: Author[] = [
  { id: 'a1', name: 'Albert Einstein' },
  { id: 'a2', name: 'Alan Turing' },
  { id: 'a3', name: 'Ada Lovelace' },
  { id: 'a4', name: 'Bertrand Russell' },
];

async function clearAndSeed() {
  const all = await dbService.getAll<Author>(STORES.AUTHORS);
  for (const item of all) {
    await dbService.delete(STORES.AUTHORS, item.id);
  }
  for (const author of seedAuthors) {
    await dbService.add(STORES.AUTHORS, author);
  }
}

describe('AuthorSelect', () => {
  beforeEach(async () => {
    await clearAndSeed();
  });

  // ---------- Rendering ----------

  it('should render the input with placeholder', async () => {
    render(<AuthorSelect onSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type to search or create author/i)).toBeInTheDocument();
    });
  });

  it('should show suggestions when input is focused', async () => {
    const user = userEvent.setup();
    render(<AuthorSelect onSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type to search or create author/i)).toBeInTheDocument();
    });

    const input = screen.getByRole('combobox');
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  it('should filter suggestions when typing', async () => {
    const user = userEvent.setup();
    render(<AuthorSelect onSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const input = screen.getByRole('combobox');
    await user.type(input, 'Al');

    await waitFor(() => {
      expect(screen.getByText('Albert Einstein')).toBeInTheDocument();
      expect(screen.getByText('Alan Turing')).toBeInTheDocument();
    });

    // Non-matching items should not appear
    expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument();
    expect(screen.queryByText('Bertrand Russell')).not.toBeInTheDocument();
  });

  // ---------- Mouse interaction ----------

  it('should select an author on mouse click', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<AuthorSelect onSelect={onSelect} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const input = screen.getByRole('combobox');
    await user.type(input, 'Al');

    await waitFor(() => {
      expect(screen.getByText('Albert Einstein')).toBeInTheDocument();
    });

    // mouseDown is used (not click) to prevent blur before selection
    await user.click(screen.getByText('Albert Einstein'));

    expect(onSelect).toHaveBeenCalledWith('a1');
  });

  it('should show "Create" option when no exact match exists', async () => {
    const user = userEvent.setup();
    render(<AuthorSelect onSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const input = screen.getByRole('combobox');
    await user.type(input, 'Nikola');

    await waitFor(() => {
      expect(screen.getByText(/Create "Nikola"/)).toBeInTheDocument();
    });
  });

  // ---------- Keyboard interaction ----------

  it('should highlight suggestions with ArrowDown and ArrowUp', async () => {
    const user = userEvent.setup();
    render(<AuthorSelect onSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const input = screen.getByRole('combobox');
    await user.type(input, 'A');

    // Wait for suggestions to appear
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    // Press ArrowDown to highlight first item
    await user.keyboard('{ArrowDown}');

    const firstOption = screen.getByText('Ada Lovelace').closest('[role="option"]');
    expect(firstOption).toHaveAttribute('aria-selected', 'true');
    expect(firstOption).toHaveClass('highlighted');

    // Press ArrowDown again to highlight second item
    await user.keyboard('{ArrowDown}');

    const secondOption = screen.getByText('Alan Turing').closest('[role="option"]');
    expect(secondOption).toHaveAttribute('aria-selected', 'true');
    expect(secondOption).toHaveClass('highlighted');

    // First should no longer be highlighted
    expect(firstOption).toHaveAttribute('aria-selected', 'false');

    // Press ArrowUp to go back to first
    await user.keyboard('{ArrowUp}');

    expect(firstOption).toHaveAttribute('aria-selected', 'true');
  });

  it('should select highlighted suggestion with Enter', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<AuthorSelect onSelect={onSelect} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const input = screen.getByRole('combobox');
    await user.type(input, 'Al');

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    // ArrowDown to first, then Enter
    await user.keyboard('{ArrowDown}{Enter}');

    expect(onSelect).toHaveBeenCalledWith('a2'); // Alan Turing (alphabetically first match for "Al")
  });

  it('should select highlighted suggestion with Tab', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<AuthorSelect onSelect={onSelect} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const input = screen.getByRole('combobox');
    await user.type(input, 'Al');

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    // ArrowDown to first, then Tab
    await user.keyboard('{ArrowDown}{Tab}');

    expect(onSelect).toHaveBeenCalledWith('a2');
  });

  it('should close suggestions with Escape', async () => {
    const user = userEvent.setup();
    render(<AuthorSelect onSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const input = screen.getByRole('combobox');
    await user.type(input, 'Al');

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('should wrap around when pressing ArrowDown past the last item', async () => {
    const user = userEvent.setup();
    render(<AuthorSelect onSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const input = screen.getByRole('combobox');
    await user.type(input, 'Bert');

    await waitFor(() => {
      expect(screen.getByText('Bertrand Russell')).toBeInTheDocument();
    });

    // There should be 1 suggestion + 1 create option = 2 items total
    // Press ArrowDown 3 times to wrap around
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');

    const option = screen.getByText('Bertrand Russell').closest('[role="option"]');
    expect(option).toHaveAttribute('aria-selected', 'true');
  });

  // ---------- Clear button ----------

  it('should show clear button when author is selected and clear on click', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<AuthorSelect selectedAuthorId="a1" onSelect={onSelect} />);

    await waitFor(() => {
      const input = screen.getByRole('combobox') as HTMLInputElement;
      expect(input.value).toBe('Albert Einstein');
    });

    const clearButton = screen.getByLabelText('Clear author');
    expect(clearButton).toBeInTheDocument();

    await user.click(clearButton);

    expect(onSelect).toHaveBeenCalledWith(undefined);
  });

  // ---------- ARIA attributes ----------

  it('should have correct ARIA attributes', async () => {
    const user = userEvent.setup();
    render(<AuthorSelect onSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');

    await user.click(input);

    await waitFor(() => {
      expect(input).toHaveAttribute('aria-expanded', 'true');
    });
  });

  it('should set aria-activedescendant when navigating', async () => {
    const user = userEvent.setup();
    render(<AuthorSelect onSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const input = screen.getByRole('combobox');
    await user.type(input, 'A');

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    // Initially no active descendant
    expect(input).not.toHaveAttribute('aria-activedescendant');

    await user.keyboard('{ArrowDown}');

    expect(input).toHaveAttribute('aria-activedescendant', 'author-option-0');
  });

  // ---------- Create new author via Enter ----------

  it('should create a new author when pressing Enter with non-matching text', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<AuthorSelect onSelect={onSelect} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const input = screen.getByRole('combobox');
    await user.type(input, 'Nikola Tesla');
    await user.keyboard('{Enter}');

    // Should have called onSelect with the new author's id
    await waitFor(() => {
      expect(onSelect).toHaveBeenCalled();
    });

    // The argument should be a string (the new author's UUID)
    const callArg = onSelect.mock.calls[onSelect.mock.calls.length - 1][0];
    expect(typeof callArg).toBe('string');
    expect(callArg).not.toBe(undefined);
  });
});

