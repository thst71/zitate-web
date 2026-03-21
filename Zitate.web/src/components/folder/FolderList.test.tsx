import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FolderList } from './FolderList';
import type { SmartFolder, Entry } from '../../models';

describe('FolderList', () => {
  const mockFolders: SmartFolder[] = [
    {
      id: '1',
      name: 'Work Folder',
      criteria: { labels: { values: ['label-1'], operator: 'OR' } },
      order: 0,
      createdAt: new Date('2024-01-01').getTime(),
    },
    {
      id: '2',
      name: 'Personal Folder',
      criteria: { authorId: 'author-1' },
      order: 1,
      createdAt: new Date('2024-01-02').getTime(),
    },
  ];

  const mockEntries: Entry[] = [
    {
      id: 'entry-1',
      text: 'Work entry',
      authorId: 'author-1',
      labelIds: ['label-1'],
      imageIds: [],
      createdAt: new Date('2024-01-01').getTime(),
      updatedAt: new Date('2024-01-01').getTime(),
    },
    {
      id: 'entry-2',
      text: 'Personal entry',
      authorId: 'author-1',
      labelIds: [],
      imageIds: [],
      createdAt: new Date('2024-01-02').getTime(),
      updatedAt: new Date('2024-01-02').getTime(),
    },
  ];

  const mockGetFolderCount = (entries: Entry[], folder: SmartFolder): number => {
    if (folder.id === '1') return 1;
    if (folder.id === '2') return 2;
    return 0;
  };

  it('should render section title', () => {
    const onFolderClick = vi.fn();
    const onDeleteFolder = vi.fn();

    render(
      <FolderList
        folders={mockFolders}
        entries={mockEntries}
        getFolderCount={mockGetFolderCount}
        onFolderClick={onFolderClick}
        onDeleteFolder={onDeleteFolder}
      />
    );

    expect(screen.getByText('Smart Folders')).toBeInTheDocument();
  });

  it('should render all folders', () => {
    const onFolderClick = vi.fn();
    const onDeleteFolder = vi.fn();

    render(
      <FolderList
        folders={mockFolders}
        entries={mockEntries}
        getFolderCount={mockGetFolderCount}
        onFolderClick={onFolderClick}
        onDeleteFolder={onDeleteFolder}
      />
    );

    expect(screen.getByText('Work Folder')).toBeInTheDocument();
    expect(screen.getByText('Personal Folder')).toBeInTheDocument();
  });

  it('should display folder entry counts', () => {
    const onFolderClick = vi.fn();
    const onDeleteFolder = vi.fn();

    render(
      <FolderList
        folders={mockFolders}
        entries={mockEntries}
        getFolderCount={mockGetFolderCount}
        onFolderClick={onFolderClick}
        onDeleteFolder={onDeleteFolder}
      />
    );

    expect(screen.getByText('1 entry')).toBeInTheDocument();
    expect(screen.getByText('2 entries')).toBeInTheDocument();
  });

  it('should call onFolderClick when folder is clicked', () => {
    const onFolderClick = vi.fn();
    const onDeleteFolder = vi.fn();

    render(
      <FolderList
        folders={mockFolders}
        entries={mockEntries}
        getFolderCount={mockGetFolderCount}
        onFolderClick={onFolderClick}
        onDeleteFolder={onDeleteFolder}
      />
    );

    const workFolder = screen.getByText('Work Folder').closest('.folder-card');
    fireEvent.click(workFolder!);

    expect(onFolderClick).toHaveBeenCalledWith(mockFolders[0]);
  });

  it('should call onDeleteFolder when delete button is clicked', () => {
    const onFolderClick = vi.fn();
    const onDeleteFolder = vi.fn();

    // Mock confirm to return true
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <FolderList
        folders={mockFolders}
        entries={mockEntries}
        getFolderCount={mockGetFolderCount}
        onFolderClick={onFolderClick}
        onDeleteFolder={onDeleteFolder}
      />
    );

    const deleteButtons = screen.getAllByRole('button', { name: /delete folder/i });
    fireEvent.click(deleteButtons[0]);

    expect(onDeleteFolder).toHaveBeenCalledWith('1');

    vi.restoreAllMocks();
  });

  it('should render empty state when no folders', () => {
    const onFolderClick = vi.fn();
    const onDeleteFolder = vi.fn();

    const { container } = render(
      <FolderList
        folders={[]}
        entries={mockEntries}
        getFolderCount={mockGetFolderCount}
        onFolderClick={onFolderClick}
        onDeleteFolder={onDeleteFolder}
      />
    );

    // Should not render the section when there are no folders
    expect(container.querySelector('.folder-list-section')).not.toBeInTheDocument();
  });

  it('should render folders in grid layout', () => {
    const onFolderClick = vi.fn();
    const onDeleteFolder = vi.fn();

    const { container } = render(
      <FolderList
        folders={mockFolders}
        entries={mockEntries}
        getFolderCount={mockGetFolderCount}
        onFolderClick={onFolderClick}
        onDeleteFolder={onDeleteFolder}
      />
    );

    const grid = container.querySelector('.folder-list');
    expect(grid).toBeInTheDocument();
  });

  it('should handle single folder', () => {
    const onFolderClick = vi.fn();
    const onDeleteFolder = vi.fn();

    render(
      <FolderList
        folders={[mockFolders[0]]}
        entries={mockEntries}
        getFolderCount={mockGetFolderCount}
        onFolderClick={onFolderClick}
        onDeleteFolder={onDeleteFolder}
      />
    );

    expect(screen.getByText('Work Folder')).toBeInTheDocument();
    expect(screen.queryByText('Personal Folder')).not.toBeInTheDocument();
  });

  it('should pass correct props to FolderCard components', () => {
    const onFolderClick = vi.fn();
    const onDeleteFolder = vi.fn();

    const { container } = render(
      <FolderList
        folders={mockFolders}
        entries={mockEntries}
        getFolderCount={mockGetFolderCount}
        onFolderClick={onFolderClick}
        onDeleteFolder={onDeleteFolder}
      />
    );

    const folderCards = container.querySelectorAll('.folder-card');
    expect(folderCards).toHaveLength(2);
  });
});
