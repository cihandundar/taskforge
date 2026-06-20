'use client';

import { useEffect, useState } from 'react';
import {
  ChatBubbleLeftEllipsisIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { useComments } from '@/hooks/useComments';
import { useCommentSocket } from '@/hooks/useCommentSocket';
import { CommentItem } from './comment-item';
import { CreateCommentForm } from './create-comment-form';
import type { Comment as CommentType } from '@/types/comment';

interface CommentListProps {
  pageId: string;
  isPageAuthor?: boolean;
  workspaceId?: string;
}

export function CommentList({ pageId, isPageAuthor = false, workspaceId }: CommentListProps) {
  const [realtimeComments, setRealtimeComments] = useState<CommentType[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const {
    comments,
    isLoading,
    error,
    fetchComments,
  } = useComments();

  useEffect(() => {
    if (pageId) {
      fetchComments(pageId);
    }
  }, [pageId, fetchComments]);

  // Merge regular comments with realtime updates
  const allComments = [...comments, ...realtimeComments].reduce((acc, comment) => {
    const existingIndex = acc.findIndex(c => c.id === comment.id);
    if (existingIndex >= 0) {
      // Update existing comment
      acc[existingIndex] = comment;
    } else {
      // Add new comment
      acc.push(comment);
    }
    return acc;
  }, [] as CommentType[]);

  // Sort by created date
  allComments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const unresolvedCount = allComments.filter((c) => !c.resolved).length;
  const resolvedCount = allComments.filter((c) => c.resolved).length;

  // Show notification helper
  const showNotificationToast = (message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // WebSocket event handlers
  const handleCommentCreated = (data: any) => {
    setRealtimeComments((prev) => {
      const filtered = prev.filter((c) => c.id !== data.id);
      return [...filtered, data as CommentType];
    });
    showNotificationToast('💬 Yeni yorum eklendi!');
  };

  const handleCommentUpdated = (data: any) => {
    setRealtimeComments((prev) =>
      prev.map((c) => (c.id === data.id ? { ...c, ...data } as CommentType : c))
    );
  };

  const handleCommentDeleted = (commentId: string) => {
    setRealtimeComments((prev) => prev.filter((c) => c.id !== commentId));
    showNotificationToast('🗑️ Yorum silindi');
  };

  const handleCommentResolved = (data: any) => {
    setRealtimeComments((prev) =>
      prev.map((c) => (c.id === data.id ? { ...c, resolved: true } as CommentType : c))
    );
    showNotificationToast('✅ Yorum çözüldü!');
  };

  const handleCommentUnresolved = (data: any) => {
    setRealtimeComments((prev) =>
      prev.map((c) => (c.id === data.id ? { ...c, resolved: false } as CommentType : c))
    );
  };

  // Setup WebSocket connection
  useCommentSocket({
    pageId,
    onCommentCreated: handleCommentCreated,
    onCommentUpdated: handleCommentUpdated,
    onCommentDeleted: handleCommentDeleted,
    onCommentResolved: handleCommentResolved,
    onCommentUnresolved: handleCommentUnresolved,
  });

  if (isLoading && allComments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Yorumlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error && comments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ExclamationCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-gray-600">{error}</p>
          <button
            onClick={() => fetchComments(pageId)}
            className="mt-3 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <ChatBubbleLeftEllipsisIcon className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-sm text-gray-600 mb-4">
          Henüz yorum yok. İlk yorumu sen yap!
        </p>
        <CreateCommentForm pageId={pageId} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold text-gray-900">Yorumlar</h3>
        <div className="flex items-center gap-3 text-sm">
          {unresolvedCount > 0 && (
            <span className="flex items-center gap-1 text-orange-600">
              <ExclamationCircleIcon className="w-4 h-4" />
              {unresolvedCount}
            </span>
          )}
          {resolvedCount > 0 && (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircleIcon className="w-4 h-4" />
              {resolvedCount}
            </span>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {allComments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            isPageAuthor={isPageAuthor}
          />
        ))}
      </div>

      {/* Create Form */}
      <div className="border-t p-4">
        <CreateCommentForm pageId={pageId} workspaceId={workspaceId} />
      </div>

      {/* Real-time Notification */}
      {showNotification && (
        <div
          className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-10"
          style={{
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          {notificationMessage}
        </div>
      )}
    </div>
  );
}
