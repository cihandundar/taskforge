'use client';

import { useState } from 'react';
import {
  ChatBubbleLeftEllipsisIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { useComments } from '@/hooks/useComments';
import type { Comment as CommentType } from '@/types/comment';

interface CommentItemProps {
  comment: CommentType;
  isPageAuthor?: boolean;
}

export function CommentItem({ comment, isPageAuthor = false }: CommentItemProps) {
  const { user } = useAuth();
  const { updateComment, deleteComment, resolveComment, unresolveComment } = useComments();

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthor = user?.id === comment.authorId;
  const canResolve = isPageAuthor;

  const handleSaveEdit = async () => {
    if (editContent.trim() === '') return;
    await updateComment(comment.id, { content: editContent });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm('Bu yorumu silmek istediğinize emin misiniz?')) return;
    setIsDeleting(true);
    await deleteComment(comment.id);
  };

  const handleToggleResolve = async () => {
    if (comment.resolved) {
      await unresolveComment(comment.id);
    } else {
      await resolveComment(comment.id);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Az önce';
      if (diffMins < 60) return `${diffMins} dakika önce`;
      if (diffHours < 24) return `${diffHours} saat önce`;
      if (diffDays < 7) return `${diffDays} gün önce`;
      return date.toLocaleDateString('tr-TR');
    } catch {
      return 'Recently';
    }
  };

  if (isDeleting) return null;

  return (
    <div
      className={`group flex gap-3 p-3 rounded-lg transition-colors ${
        comment.resolved
          ? 'bg-gray-50 opacity-75'
          : 'bg-white hover:bg-gray-50'
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
          {comment.author.name?.[0] || comment.author.email[0].toUpperCase()}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-gray-900">
            {comment.author.name || comment.author.email}
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(comment.createdAt)}
          </span>
          {comment.resolved && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
              <CheckIcon className="w-3 h-3" />
              Çözüldü
            </span>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={!editContent.trim()}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Kaydet
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                İptal
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex flex-col gap-1">
          {isAuthor && !comment.resolved && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Düzenle"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
          )}
          {isAuthor && (
            <button
              onClick={handleDelete}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Sil"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
          {canResolve && (
            <button
              onClick={handleToggleResolve}
              className={`p-1.5 rounded transition-colors ${
                comment.resolved
                  ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50'
                  : 'text-green-600 hover:text-green-700 hover:bg-green-50'
              }`}
              title={comment.resolved ? 'Çözülmedi olarak işaretle' : 'Çözüldü olarak işaretle'}
            >
              {comment.resolved ? (
                <XMarkIcon className="w-4 h-4" />
              ) : (
                <CheckIcon className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
