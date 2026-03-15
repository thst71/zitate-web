import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FolderCard } from './FolderCard';
import type { SmartFolder } from '../../models';

describe('FolderCard', () => {
  const mockFolder: SmartFolder = {
    id: '1',
    name: 'Work Folder',
    criteria: { labels: { values: ['label-1'], operator: 'OR' } },
    order: 0,
    createdAt: new Date('2024-01-01').getTime(),
  };

  it('should render folder name', () => {
    const onClick = vi.fn();
    const onDelete = vi.fn();

    render(<FolderCard folder={mockFolder} count={5} onClick={onClick} onDelete={onDelete} />);

    expect(screen.getByText('Work Folder')).toBeInTheDocument();
  });

  it('should render entry count', () => {
    const onClick = vi.fn();
    const onDelete = vi.fn();

    render(<FolderCard folder={mockFolder} count={5} onClick={onClick} onDelete={onDelete} />);

    expect(screen.getByText('5 entries')).toBeInTheDocument();
  });

  it('should render singular entry when count is 1', () => {
    const onClick = vi.fn();
    const onDelete = vi.fn();

    render(<FolderCard folder={mockFolder} count={1} onClick={onClick} onDelete={onDelete} />);

    expect(screen.getByText('1 entry')).toBeInTheDocument();
  });

  it('should render 0 entries when count is 0', () => {
    const onClick = vi.fn();
    const onDelete = vi.fn();

    render(<FolderCard folder={mockFolder} count={0} onClick={onClick} onDelete={onDelete} />);

    expect(screen.getByText('0 entries')).toBeInTheDocument();
  });

  it('should call onClick when card is clicked', () => {
    const onClick = vi.fn();
    const onDelete = vi.fn();

    const { container } = render(
      <FolderCard folder={mockFolder} count={5} onClick={onClick} onDelete={onDelete} />
    );

    const card = container.querySelector('.folder-card');
    fireEvent.click(card!);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should call onDelete when delete button is clicked', () => {
    const onClick = vi.fn();
    const onDelete = vi.fn();

    // Mock confirm to return true
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<FolderCard folder={mockFolder} count={5} onClick={onClick} onDelete={onDelete} />);

    const deleteButton = screen.getByRole('button', { name: /delete folder/i });
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(mockFolder.id);
    expect(onClick).not.toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it('should stop propagation when delete button is clicked', () => {
    const onClick = vi.fn();
    const onDelete = vi.fn();

    // Mock confirm to return true
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<FolderCard folder={mockFolder} count={5} onClick={onClick} onDelete={onDelete} />);

    const deleteButton = screen.getByRole('button', { name: /delete folder/i });
    fireEvent.click(deleteButton);

    // onClick should not be called because we stopped propagation
    expect(onClick).not.toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it('should render folder icon', () => {
    const onClick = vi.fn();
    const onDelete = vi.fn();

    const { container } = render(
      <FolderCard folder={mockFolder} count={5} onClick={onClick} onDelete={onDelete} />
    );

    const icon = container.querySelector('.folder-card-icon svg');
    expect(icon).toBeInTheDocument();
  });

  it('should have folder card class', () => {
    const onClick = vi.fn();
    const onDelete = vi.fn();

    const { container } = render(
      <FolderCard folder={mockFolder} count={5} onClick={onClick} onDelete={onDelete} />
    );

    const card = container.querySelector('.folder-card');
    expect(card).toBeInTheDocument();
  });

  it('should display folder with very long name', () => {
    const longNameFolder: SmartFolder = {
      ...mockFolder,
      name: 'This is a very long folder name that might need to wrap or be truncated',
    };

    const onClick = vi.fn();
    const onDelete = vi.fn();

    render(<FolderCard folder={longNameFolder} count={5} onClick={onClick} onDelete={onDelete} />);

    expect(
      screen.getByText('This is a very long folder name that might need to wrap or be truncated')
    ).toBeInTheDocument();
  });

  it('should handle large entry counts', () => {
    const onClick = vi.fn();
    const onDelete = vi.fn();

    render(<FolderCard folder={mockFolder} count={9999} onClick={onClick} onDelete={onDelete} />);

    expect(screen.getByText('9999 entries')).toBeInTheDocument();
  });
});
