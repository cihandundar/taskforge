'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DocumentTextIcon, FolderIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PageItemProps {
  page: {
    id: string;
    title: string;
    icon?: string;
    cover?: string;
    isPublic: boolean;
    workspaceId?: string;
    parentId?: string;
    lastEditedAt: string;
    children?: any[];
  };
  level?: number;
  onEdit?: (page: any) => void;
  onDelete?: (pageId: string) => void;
  onNavigate?: (pageId: string) => void;
}

export default function PageItem({
  page,
  level = 0,
  onEdit,
  onDelete,
  onNavigate,
}: PageItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const hasChildren = page.children && page.children.length > 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleClick = () => {
    onNavigate && onNavigate(page.id);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit && onEdit(page);
    setIsMenuOpen(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${page.title}"?`)) {
      onDelete && onDelete(page.id);
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="relative">
      {/* Page Item */}
      <div
        className={`group flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-800 cursor-pointer transition ${
          level > 0 ? 'ml-4' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={handleClick}
      >
        {/* Expand/Collapse */}
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="p-0.5 rounded hover:bg-gray-700 transition"
          >
            {isExpanded ? (
              <ChevronRightIcon className="w-3 h-3 text-gray-400 rotate-90" />
            ) : (
              <ChevronRightIcon className="w-3 h-3 text-gray-400" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

        {/* Icon */}
        <span className="text-lg">{page.icon || '📄'}</span>

        {/* Title */}
        <span className="flex-1 text-sm text-gray-300 truncate">{page.title}</span>

        {/* Actions */}
        <div className="relative">
          <button
            onClick={handleMenuClick}
            className="p-1 rounded hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition"
          >
            <EllipsisVerticalIcon className="w-4 h-4 text-gray-400" />
          </button>

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 mt-1 w-32 bg-gray-800 rounded-lg shadow-xl py-1 z-20">
                <button
                  onClick={handleEdit}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
                >
                  <PencilIcon className="w-4 h-4" />
                  <span>Rename</span>
                </button>
                <button
                  onClick={handleDelete}
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

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-2">
          {page.children?.map((child: any) => (
            <PageItem
              key={child.id}
              page={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
