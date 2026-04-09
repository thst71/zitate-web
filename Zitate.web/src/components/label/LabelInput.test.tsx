import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LabelInput } from './LabelInput';
import { dbService } from '../../services/db.service';
import { STORES } from '../../db/schema';
import type { Label } from '../../models';

const seedLabels: Label[] = [
  { id: 'l1', name: 'philosophy' },
  { id: 'l2', name: 'physics' },
  { id: 'l3', name: 'poetry' },
  { id: 'l4', name: 'mathematics' },
];

async function clearAndSeed() {
  await dbService.clear(STORES.LABELS);
  for (const label of seedLabels) {
    await dbService.add(STORES.LABELS, label);
  }
}

describe('LabelInput', () => {
  beforeEach(async () => {
    await clearAndSeed();
  });

  /** Wait until useLabels has finished loading from PouchDB */
  async function waitForLabelsLoaded() {
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-busy', 'false');
    });
  }

  it('should render the input with placeholder', () => {
    render(<LabelInput selectedLabelIds={[]} onLabelsChange={vi.fn()} />);
    expect(screen.getByPlaceholderText(/type to search or create labels/i)).toBeInTheDocument();
  });

  it('should show suggestions when typing', async () => {
    const user = userEvent.setup();
    render(<LabelInput selectedLabelIds={[]} onLabelsChange={vi.fn()} />);
    await waitForLabelsLoaded();

    await user.type(screen.getByRole('combobox'), 'ph');

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getByText('philosophy')).toBeInTheDocument();
      expect(screen.getByText('physics')).toBeInTheDocument();
    });

    expect(screen.queryByText('poetry')).not.toBeInTheDocument();
  });

  it('should select a label on mouse click', async () => {
    const user = userEvent.setup();
    const onLabelsChange = vi.fn();
    render(<LabelInput selectedLabelIds={[]} onLabelsChange={onLabelsChange} />);
    await waitForLabelsLoaded();

    await user.type(screen.getByRole('combobox'), 'ph');
    await waitFor(() => expect(screen.getByText('philosophy')).toBeInTheDocument());

    await user.click(screen.getByText('philosophy'));
    expect(onLabelsChange).toHaveBeenCalledWith(['l1']);
  });

  it('should show Create option when no exact match', async () => {
    const user = userEvent.setup();
    render(<LabelInput selectedLabelIds={[]} onLabelsChange={vi.fn()} />);
    await waitForLabelsLoaded();

    await user.type(screen.getByRole('combobox'), 'science');
    await waitFor(() => expect(screen.getByText(/Create "science"/)).toBeInTheDocument());
  });

  it('should highlight suggestions with ArrowDown/ArrowUp', async () => {
    const user = userEvent.setup();
    render(<LabelInput selectedLabelIds={[]} onLabelsChange={vi.fn()} />);
    await waitForLabelsLoaded();

    await user.type(screen.getByRole('combobox'), 'p');
    await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('philosophy')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('physics')).toBeInTheDocument());

    await user.keyboard('{ArrowDown}');
    const first = screen.getByText('philosophy').closest('[role="option"]');
    expect(first).toHaveAttribute('aria-selected', 'true');
    expect(first).toHaveClass('highlighted');

    await user.keyboard('{ArrowDown}');
    const second = screen.getByText('physics').closest('[role="option"]');
    expect(second).toHaveAttribute('aria-selected', 'true');
    expect(first).toHaveAttribute('aria-selected', 'false');

    await user.keyboard('{ArrowUp}');
    expect(first).toHaveAttribute('aria-selected', 'true');
  });

  it('should select highlighted suggestion with Enter', async () => {
    const user = userEvent.setup();
    const onLabelsChange = vi.fn();
    render(<LabelInput selectedLabelIds={[]} onLabelsChange={onLabelsChange} />);
    await waitForLabelsLoaded();

    await user.type(screen.getByRole('combobox'), 'ph');
    await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('philosophy')).toBeInTheDocument());

    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      const first = screen.getByText('philosophy').closest('[role="option"]');
      expect(first).toHaveAttribute('aria-selected', 'true');
    });

    await user.keyboard('{Enter}');
    await waitFor(() => expect(onLabelsChange).toHaveBeenCalledWith(['l1']));
  });

  it('should select highlighted suggestion with Tab', async () => {
    const user = userEvent.setup();
    const onLabelsChange = vi.fn();
    render(<LabelInput selectedLabelIds={[]} onLabelsChange={onLabelsChange} />);
    await waitForLabelsLoaded();

    await user.type(screen.getByRole('combobox'), 'ph');
    await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('philosophy')).toBeInTheDocument());

    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      const first = screen.getByText('philosophy').closest('[role="option"]');
      expect(first).toHaveAttribute('aria-selected', 'true');
    });

    await user.keyboard('{Tab}');
    await waitFor(() => expect(onLabelsChange).toHaveBeenCalledWith(['l1']));
  });

  it('should close suggestions with Escape', async () => {
    const user = userEvent.setup();
    render(<LabelInput selectedLabelIds={[]} onLabelsChange={vi.fn()} />);
    await waitForLabelsLoaded();

    await user.type(screen.getByRole('combobox'), 'ph');
    await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument());

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  });

  it('should create a new label with Enter on non-matching text', async () => {
    const user = userEvent.setup();
    const onLabelsChange = vi.fn();
    render(<LabelInput selectedLabelIds={[]} onLabelsChange={onLabelsChange} />);
    await waitForLabelsLoaded();

    await user.type(screen.getByRole('combobox'), 'science');
    await user.keyboard('{Enter}');

    await waitFor(() => expect(onLabelsChange).toHaveBeenCalled());
    const arg = onLabelsChange.mock.calls[onLabelsChange.mock.calls.length - 1][0];
    expect(arg).toHaveLength(1);
  });

  it('should have correct ARIA attributes', async () => {
    const user = userEvent.setup();
    render(<LabelInput selectedLabelIds={[]} onLabelsChange={vi.fn()} />);
    await waitForLabelsLoaded();

    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');

    await user.type(input, 'ph');
    await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'true'));
  });

  it('should set aria-activedescendant when navigating', async () => {
    const user = userEvent.setup();
    render(<LabelInput selectedLabelIds={[]} onLabelsChange={vi.fn()} />);
    await waitForLabelsLoaded();

    const input = screen.getByRole('combobox');
    await user.type(input, 'p');
    await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument());

    expect(input).not.toHaveAttribute('aria-activedescendant');
    await user.keyboard('{ArrowDown}');
    await waitFor(() => expect(input).toHaveAttribute('aria-activedescendant', 'label-option-0'));
  });

  it('should display selected labels as tags', async () => {
    render(<LabelInput selectedLabelIds={['l1', 'l3']} onLabelsChange={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('philosophy')).toBeInTheDocument();
      expect(screen.getByText('poetry')).toBeInTheDocument();
    });
  });

  it('should remove a label when clicking the remove button', async () => {
    const user = userEvent.setup();
    const onLabelsChange = vi.fn();
    render(<LabelInput selectedLabelIds={['l1', 'l3']} onLabelsChange={onLabelsChange} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Remove label philosophy')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Remove label philosophy'));
    expect(onLabelsChange).toHaveBeenCalledWith(['l3']);
  });

  it('should show checkmark on already-selected labels', async () => {
    const user = userEvent.setup();
    render(<LabelInput selectedLabelIds={['l1']} onLabelsChange={vi.fn()} />);
    await waitForLabelsLoaded();

    await user.type(screen.getByRole('combobox'), 'ph');
    await waitFor(() => {
      const options = screen.getAllByRole('option');
      const philosophyOption = options.find(o => o.textContent?.includes('philosophy'));
      expect(philosophyOption).toHaveClass('already-selected');
    });
  });
});
