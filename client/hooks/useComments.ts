'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Comment, CreateCommentInput, UpdateCommentInput } from '@/types/comment';

interface UseCommentsResult {
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
  fetchComments: (pageId: string) => Promise<void>;
  createComment: (input: CreateCommentInput) => Promise<Comment | null>;
  updateComment: (id: string, input: UpdateCommentInput) => Promise<Comment | null>;
  deleteComment: (id: string) => Promise<boolean>;
  resolveComment: (id: string) => Promise<Comment | null>;
  unresolveComment: (id: string) => Promise<Comment | null>;
  fetchUnresolved: () => Promise<Comment[]>;
}

export function useComments(): UseCommentsResult {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async (pageId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.getComments(pageId);
      setComments(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch comments');
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createComment = useCallback(async (input: CreateCommentInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.createComment(input);
      const newComment = response.data;
      setComments((prev) => [...prev, newComment]);
      return newComment;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create comment');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateComment = useCallback(async (id: string, input: UpdateCommentInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.updateComment(id, input);
      const updatedComment = response.data;
      setComments((prev) =>
        prev.map((c) => (c.id === id ? updatedComment : c))
      );
      return updatedComment;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update comment');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteComment = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.deleteComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete comment');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resolveComment = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.resolveComment(id);
      const resolvedComment = response.data;
      setComments((prev) =>
        prev.map((c) => (c.id === id ? resolvedComment : c))
      );
      return resolvedComment;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resolve comment');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unresolveComment = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.unresolveComment(id);
      const unresolvedComment = response.data;
      setComments((prev) =>
        prev.map((c) => (c.id === id ? unresolvedComment : c))
      );
      return unresolvedComment;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to unresolve comment');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUnresolved = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.getUnresolvedComments();
      return response.data || [];
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch unresolved comments');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    comments,
    isLoading,
    error,
    fetchComments,
    createComment,
    updateComment,
    deleteComment,
    resolveComment,
    unresolveComment,
    fetchUnresolved,
  };
}
