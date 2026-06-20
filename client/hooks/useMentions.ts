'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Mention, MentionWithDetails, MentionUser } from '@/types/mention';

interface UseMentionsResult {
  mentions: MentionWithDetails[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  searchUsers: (workspaceId: string, query: string) => Promise<MentionUser[]>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshMentions: () => Promise<void>;
}

export function useMentions(): UseMentionsResult {
  const [mentions, setMentions] = useState<MentionWithDetails[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMentions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.getMentions();
      setMentions(response.data || []);
      setUnreadCount(response.data.filter((m: MentionWithDetails) => !m.read).length);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch mentions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchUsers = useCallback(async (workspaceId: string, query: string): Promise<MentionUser[]> => {
    if (!query || query.length < 2) return [];

    try {
      const response = await apiClient.searchUsers(query);
      return response.data || [];
    } catch (err) {
      console.error('Failed to search users:', err);
      return [];
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await apiClient.markMentionAsRead(id);
      setMentions((prev) =>
        prev.map((m) => (m.id === id ? { ...m, read: true } : m))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Failed to mark mention as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiClient.markAllMentionsAsRead();
      setMentions((prev) => prev.map((m) => ({ ...m, read: true })));
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Failed to mark all mentions as read:', err);
    }
  }, []);

  // Auto-refresh mentions every 30 seconds
  useEffect(() => {
    refreshMentions();
    const interval = setInterval(refreshMentions, 30000);
    return () => clearInterval(interval);
  }, [refreshMentions]);

  return {
    mentions,
    unreadCount,
    isLoading,
    error,
    searchUsers,
    markAsRead,
    markAllAsRead,
    refreshMentions,
  };
}
