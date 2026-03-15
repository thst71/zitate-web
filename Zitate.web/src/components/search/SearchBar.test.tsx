import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('should render search input', () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText('Search quotes, authors, labels...');
    expect(input).toBeInTheDocument();
  });

  it('should render with custom placeholder', () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} placeholder="Custom placeholder" />);

    const input = screen.getByPlaceholderText('Custom placeholder');
    expect(input).toBeInTheDocument();
  });

  it('should call onSearch with debounced value', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText('Search quotes, authors, labels...');

    fireEvent.change(input, { target: { value: 'test query' } });

    // Should not call immediately
    expect(onSearch).not.toHaveBeenCalled();

    // Should call after debounce delay (300ms)
    await waitFor(
      () => {
        expect(onSearch).toHaveBeenCalledWith('test query');
      },
      { timeout: 500 }
    );
  });

  it('should show clear button when input has value', () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText('Search quotes, authors, labels...');

    fireEvent.change(input, { target: { value: 'test' } });

    const clearButton = screen.getByRole('button', { name: /clear search/i });
    expect(clearButton).toBeInTheDocument();
  });

  it('should not show clear button when input is empty', () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const clearButton = screen.queryByRole('button', { name: /clear search/i });
    expect(clearButton).not.toBeInTheDocument();
  });

  it('should clear input when clear button is clicked', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText('Search quotes, authors, labels...') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'test' } });
    expect(input.value).toBe('test');

    const clearButton = screen.getByRole('button', { name: /clear search/i });
    fireEvent.click(clearButton);

    expect(input.value).toBe('');

    // Should call onSearch with empty string after debounce
    await waitFor(
      () => {
        expect(onSearch).toHaveBeenCalledWith('');
      },
      { timeout: 500 }
    );
  });

  it('should update input value when user types', () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText('Search quotes, authors, labels...') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'first' } });
    expect(input.value).toBe('first');

    fireEvent.change(input, { target: { value: 'first search' } });
    expect(input.value).toBe('first search');
  });

  it('should debounce rapid changes', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText('Search quotes, authors, labels...');

    // Rapidly type
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.change(input, { target: { value: 'ab' } });
    fireEvent.change(input, { target: { value: 'abc' } });

    // Should not call during rapid changes
    expect(onSearch).not.toHaveBeenCalled();

    // Should only call once with final value after debounce
    await waitFor(
      () => {
        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith('abc');
      },
      { timeout: 500 }
    );
  });

  it('should display search icon', () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const searchIcon = screen.getByTestId('search-icon');
    expect(searchIcon).toBeInTheDocument();
  });

  it('should have correct ARIA attributes', () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText('Search quotes, authors, labels...');
    expect(input).toHaveAttribute('type', 'search');
    expect(input).toHaveAttribute('aria-label', 'Search');
  });

  it('should call onSearch with empty string when input is cleared', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText('Search quotes, authors, labels...');

    // Type something first
    fireEvent.change(input, { target: { value: 'test' } });

    await waitFor(
      () => {
        expect(onSearch).toHaveBeenCalledWith('test');
      },
      { timeout: 500 }
    );

    vi.clearAllMocks();

    // Clear input
    fireEvent.change(input, { target: { value: '' } });

    await waitFor(
      () => {
        expect(onSearch).toHaveBeenCalledWith('');
      },
      { timeout: 500 }
    );
  });
});
