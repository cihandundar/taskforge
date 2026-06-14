'use client';

import { useState } from 'react';
import {
  DocumentTextIcon,
  FolderIcon,
  PlusIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { usePages } from '@/hooks/usePages';

interface PageListProps {
  workspaceId?: string;
  onEditPage?: (page: any) => void;
  onGoToPage?: (pageId: string) => void;
}

export default function PageList({
  workspaceId,
  onEditPage,
  onGoToPage,
}: PageListProps) {
  const { pages, isLoading, error, createPage, deletePage } = usePages(workspaceId);
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [pageMenuOpen, setPageMenuOpen] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const toggleExpanded = (pageId: string) => {
    setExpandedPages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pageId)) {
        newSet.delete(pageId);
      } else {
        newSet.add(pageId);
      }
      return newSet;
    });
  };

  const handleCreatePage = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!newPageTitle.trim()) {
      setCreateError('Page title is required');
      return;
    }

    setIsCreating(true);
    setCreateError('');

    try {
      const pageData: any = {
        title: newPageTitle,
        workspaceId: workspaceId || undefined,
        parentId: parentId || undefined,
      };

      const newPage = await createPage(pageData);
      setNewPageTitle('');
      setIsCreateModalOpen(false);

      // Navigate to the new page
      if (onGoToPage) {
        onGoToPage(newPage.id);
      }
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create page');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page?')) {
      return;
    }

    try {
      await deletePage(pageId);
      setPageMenuOpen(null);
    } catch (err: any) {
      console.error('Failed to delete page:', err);
    }
  };

  const renderPage = (page: any, level: number = 0) => {
    const hasChildren = page.children && page.children.length > 0;
    const isExpanded = expandedPages.has(page.id);

    return (
      <div key={page.id} className="relative">
        {/* Page Item */}
        <div
          className={`group flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-800 cursor-pointer transition ${
            level > 0 ? 'ml-4' : ''
          }`}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
        >
          {/* Expand/Collapse Button */}
          <button
            onClick={() => toggleExpanded(page.id)}
            className="p-0.5 rounded hover:bg-gray-700 transition"
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDownIcon className="w-3 h-3 text-gray-400" />
              ) : (
                <ChevronRightIcon className="w-3 h-3 text-gray-400" />
              )
            ) : (
              <span className="w-3 h-3" />
            )}
          </button>

          {/* Page Icon */}
          <span className="text-lg">{page.icon || '📄'}</span>

          {/* Page Title */}
          <span
            onClick={() => onGoToPage && onGoToPage(page.id)}
            className="flex-1 text-sm text-gray-300 truncate"
          >
            {page.title}
          </span>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPageMenuOpen(pageMenuOpen === page.id ? null : page.id);
              }}
              className="p-1 rounded hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition"
            >
              <EllipsisVerticalIcon className="w-4 h-4 text-gray-400" />
            </button>

            {pageMenuOpen === page.id && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setPageMenuOpen(null)}
                />
                <div className="absolute right-0 mt-1 w-32 bg-gray-800 rounded-lg shadow-xl py-1 z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditPage && onEditPage(page);
                      setPageMenuOpen(null);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
                  >
                    <PencilIcon className="w-4 h-4" />
                    <span>Rename</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePage(page.id);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-700"
                  >
                    <TrashIcon className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick Create Subpage */}
        {isExpanded && (
          <div className="ml-6">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCreateModalOpen(page.id);
              }}
              className="flex items-center space-x-2 px-3 py-1 text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded transition"
            >
              <PlusIcon className="w-3 h-3" />
              <span>Add sub-page</span>
            </button>

            {/* Render Children */}
            {hasChildren &&
              page.children.map((child: any) => renderPage(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Build page tree
  const buildPageTree = (pages: any[]) => {
    const pageMap = new Map();
    const rootPages: any[] = [];

    // First pass: create map
    pages.forEach((page) => {
      pageMap.set(page.id, { ...page, children: [] });
    });

    // Second pass: build tree
    pages.forEach((page) => {
      const pageWithChildren = pageMap.get(page.id);
      if (page.parentId && pageMap.has(page.parentId)) {
        pageMap.get(page.parentId).children.push(pageWithChildren);
      } else {
        rootPages.push(pageWithChildren);
      }
    });

    return rootPages;
  };

  const pageTree = buildPageTree(pages);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="text-sm font-medium text-gray-400">Pages</h3>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="p-1 rounded hover:bg-gray-800 transition"
        >
          <PlusIcon className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="px-3 py-2 text-xs text-red-400">{error}</div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-2 px-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Page Tree */}
          {pageTree.length > 0 ? (
            <div className="space-y-0.5">
              {pageTree.map((page) => renderPage(page))}
            </div>
          ) : (
            <div className="px-3 py-4 text-center">
              <FolderIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No pages yet</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-2 text-xs text-blue-400 hover:text-blue-300"
              >
                Create your first page
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Page Modal (inline) */}
      {isCreateModalOpen && (
        <div className="px-3 py-2">
          <form onSubmit={(e) => handleCreatePage(e, typeof isCreateModalOpen === 'string' ? isCreateModalOpen : undefined)}>
            <input
              type="text"
              value={newPageTitle}
              onChange={(e) => setNewPageTitle(e.target.value)}
              placeholder="Page title..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              autoFocus
            />
            {createError && (
              <p className="text-xs text-red-400 mt-1">{createError}</p>
            )}
            <div className="flex space-x-2 mt-2">
              <button
                type="submit"
                disabled={isCreating}
                className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setNewPageTitle('');
                  setCreateError('');
                }}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
