'use client';

import { useState, useEffect } from 'react';
import {
  BellIcon,
  AtSymbolIcon,
  XMarkIcon,
  CheckIcon,
  UserIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useMentions } from '@/hooks/useMentions';
import { useCommentSocket } from '@/hooks/useCommentSocket';
import type { MentionNotification, MentionWithDetails } from '@/types/mention';
import { useRouter } from 'next/navigation';

export function MentionNotifications() {
  const router = useRouter();
  const { mentions, unreadCount, markAsRead, markAllAsRead } = useMentions();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<MentionNotification[]>([]);

  // Listen for mention events via WebSocket
  const handleMentionCreated = (data: MentionNotification) => {
    setNotifications((prev) => [data, ...prev]);
    // Show toast notification
    showNotificationToast(data);
  };

  useCommentSocket({
    pageId: '', // Global mentions
    onCommentCreated: () => {}, // Not needed for mentions
  });

  const showNotificationToast = (mention: MentionNotification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${mention.mentionedBy.name || 'Bir kullanıcı'} seni etiketledi`, {
        body: mention.comment.content.substring(0, 100),
        icon: '/icon-192.png',
      });
    }
  };

  const handleMentionClick = (mention: MentionWithDetails) => {
    // Navigate to the page
    router.push(`/dashboard/workspace/${mention.comment.page.workspaceId}/page/${mention.comment.page.id}`);
    // Mark as read
    markAsRead(mention.id);
    setIsOpen(false);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    setNotifications([]);
  };

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-50 max-h-[500px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <AtSymbolIcon className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Etiketlemeler</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Mark All as Read */}
            {unreadCount > 0 && (
              <div className="px-4 py-2 border-b bg-gray-50">
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Tümünü okundu olarak işaretle
                </button>
              </div>
            )}

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {mentions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AtSymbolIcon className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600">
                    Henüz etiketlenme yok
                  </p>
                </div>
              ) : (
                mentions.map((mention) => (
                  <div
                    key={mention.id}
                    onClick={() => handleMentionClick(mention)}
                    className={`px-4 py-3 border-b cursor-pointer transition-colors ${
                      !mention.read ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium flex-shrink-0">
                        {mention.mentionedUser.name?.[0] ||
                          mention.mentionedUser.email[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {mention.mentionedUser.name || 'Kullanıcı'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(mention.createdAt).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {mention.comment.author.name || 'Bir kullanıcı'} seni bir yorumda etiketledi
                        </p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <DocumentTextIcon className="w-3 h-3" />
                          {mention.comment.page.title}
                        </p>
                      </div>
                      {!mention.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
