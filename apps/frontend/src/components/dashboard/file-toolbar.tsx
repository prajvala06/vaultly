'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon, GridIcon, ListIcon, SearchIcon } from '@/components/icons';
import {
  FILE_FILTER_OPTIONS,
  FILE_SORT_OPTIONS,
  getFileFilterLabel,
  getFileSortLabel,
  type FileFilter,
  type FileSort,
} from '@/lib/file-list';

type ViewMode = 'list' | 'grid';
type OpenMenu = 'filter' | 'sort' | null;

type FileToolbarProps = {
  title?: string;
  subtitle?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  fileFilter: FileFilter;
  onFileFilterChange: (filter: FileFilter) => void;
  fileSort: FileSort;
  onFileSortChange: (sort: FileSort) => void;
};

export function FileToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  fileFilter,
  onFileFilterChange,
  fileSort,
  onFileSortChange,
}: FileToolbarProps): React.ReactElement {
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const menusRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openMenu) {
      return;
    }
    function handlePointerDown(event: MouseEvent): void {
      if (menusRef.current && !menusRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setOpenMenu(null);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenu]);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <label className="relative w-full max-w-md flex-1">
          <span className="sr-only">Search files</span>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-vaultly-muted-soft" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search files..."
            className="w-full rounded-full border border-vaultly-border bg-white py-2.5 pr-3 pl-9 text-sm text-vaultly-ink outline-none transition-colors placeholder:text-vaultly-muted-soft focus:border-orange-300"
          />
        </label>
        <div ref={menusRef} className="flex items-center justify-end gap-2">
          <ToolbarMenu
            label="Filter"
            valueLabel={getFileFilterLabel(fileFilter)}
            isOpen={openMenu === 'filter'}
            onToggle={() => setOpenMenu((current) => (current === 'filter' ? null : 'filter'))}
          >
            {FILE_FILTER_OPTIONS.map((option) => (
              <ToolbarMenuItem
                key={option.value}
                label={option.label}
                isActive={fileFilter === option.value}
                onSelect={() => {
                  onFileFilterChange(option.value);
                  setOpenMenu(null);
                }}
              />
            ))}
          </ToolbarMenu>
          <ToolbarMenu
            label="Sort by"
            valueLabel={getFileSortLabel(fileSort)}
            isOpen={openMenu === 'sort'}
            onToggle={() => setOpenMenu((current) => (current === 'sort' ? null : 'sort'))}
          >
            {FILE_SORT_OPTIONS.map((option) => (
              <ToolbarMenuItem
                key={option.value}
                label={option.label}
                isActive={fileSort === option.value}
                onSelect={() => {
                  onFileSortChange(option.value);
                  setOpenMenu(null);
                }}
              />
            ))}
          </ToolbarMenu>
          <div className="inline-flex rounded-full border border-vaultly-border bg-white p-1">
            <button
              type="button"
              aria-label="List view"
              onClick={() => onViewModeChange('list')}
              className={
                viewMode === 'list'
                  ? 'rounded-full bg-vaultly-accent p-1.5 text-white'
                  : 'rounded-full p-1.5 text-vaultly-muted transition-colors hover:text-vaultly-ink'
              }
            >
              <ListIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Grid view"
              onClick={() => onViewModeChange('grid')}
              className={
                viewMode === 'grid'
                  ? 'rounded-full bg-vaultly-accent p-1.5 text-white'
                  : 'rounded-full p-1.5 text-vaultly-muted transition-colors hover:text-vaultly-ink'
              }
            >
              <GridIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type ToolbarMenuProps = {
  label: string;
  valueLabel: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

function ToolbarMenu({
  label,
  valueLabel,
  isOpen,
  onToggle,
  children,
}: ToolbarMenuProps): React.ReactElement {
  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 rounded-full border border-vaultly-border bg-white px-3.5 py-2 text-sm text-vaultly-ink-soft transition-colors hover:bg-vaultly-accent-soft"
      >
        {label}
        <span className="text-vaultly-muted">{valueLabel}</span>
        <ChevronDownIcon className="h-4 w-4 text-vaultly-muted" />
      </button>
      {isOpen ? (
        <div
          role="listbox"
          className="absolute top-[calc(100%+8px)] right-0 z-30 min-w-44 overflow-hidden rounded-2xl border border-gray-200 bg-white py-1 shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

type ToolbarMenuItemProps = {
  label: string;
  isActive: boolean;
  onSelect: () => void;
};

function ToolbarMenuItem({
  label,
  isActive,
  onSelect,
}: ToolbarMenuItemProps): React.ReactElement {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isActive}
      onClick={onSelect}
      className={
        isActive
          ? 'flex w-full px-3 py-2 text-left text-sm font-semibold text-vaultly-ink bg-vaultly-accent-soft'
          : 'flex w-full px-3 py-2 text-left text-sm text-vaultly-ink-soft transition-colors hover:bg-gray-50'
      }
    >
      {label}
    </button>
  );
}
