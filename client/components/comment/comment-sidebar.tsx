'use client';

import { XMarkIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';
import { CommentList } from './comment-list';

interface CommentSidebarProps {
  pageId: string;
  isOpen: boolean;
  onClose: () => void;
  isPageAuthor?: boolean;
  workspaceId?: string;
}

export function CommentSidebar({
  pageId,
  isOpen,
  onClose,
  isPageAuthor = false,
  workspaceId,
}: CommentSidebarProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Yorumlar</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <CommentList pageId={pageId} isPageAuthor={isPageAuthor} workspaceId={workspaceId} />
      </div>
    </>
  );
}
