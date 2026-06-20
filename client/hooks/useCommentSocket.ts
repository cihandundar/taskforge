'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

interface CommentEventPayload {
  id: string;
  content?: string;
  resolved?: boolean;
  authorId?: string;
  author?: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface UseCommentSocketOptions {
  pageId: string;
  onCommentCreated?: (comment: CommentEventPayload) => void;
  onCommentUpdated?: (comment: CommentEventPayload) => void;
  onCommentDeleted?: (commentId: string) => void;
  onCommentResolved?: (comment: CommentEventPayload) => void;
  onCommentUnresolved?: (comment: CommentEventPayload) => void;
}

export function useCommentSocket(options: UseCommentSocketOptions) {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const handleCommentCreatedRef = useRef(options.onCommentCreated);
  const handleCommentUpdatedRef = useRef(options.onCommentUpdated);
  const handleCommentDeletedRef = useRef(options.onCommentDeleted);
  const handleCommentResolvedRef = useRef(options.onCommentResolved);
  const handleCommentUnresolvedRef = useRef(options.onCommentUnresolved);
  const { pageId } = options;

  // Update refs when callbacks change
  useEffect(() => {
    handleCommentCreatedRef.current = options.onCommentCreated;
    handleCommentUpdatedRef.current = options.onCommentUpdated;
    handleCommentDeletedRef.current = options.onCommentDeleted;
    handleCommentResolvedRef.current = options.onCommentResolved;
    handleCommentUnresolvedRef.current = options.onCommentUnresolved;
  }, [options.onCommentCreated, options.onCommentUpdated, options.onCommentDeleted, options.onCommentResolved, options.onCommentUnresolved]);

  useEffect(() => {
    if (!user || !pageId) return;

    // Get access token from storage
    const getToken = () => {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem('access_token');
    };

    const token = getToken();
    if (!token) return;

    // Initialize socket connection
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    const socket = io(`${wsUrl}/ws`, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Join page room
    socket.emit('page:join', { pageId });

    // Setup event listeners
    socket.on('comment:created', (data: CommentEventPayload) => {
      console.log('Comment created:', data);
      handleCommentCreatedRef.current?.(data);
    });

    socket.on('comment:updated', (data: CommentEventPayload) => {
      console.log('Comment updated:', data);
      handleCommentUpdatedRef.current?.(data);
    });

    socket.on('comment:deleted', (data: { id: string }) => {
      console.log('Comment deleted:', data);
      handleCommentDeletedRef.current?.(data.id);
    });

    socket.on('comment:resolved', (data: CommentEventPayload) => {
      console.log('Comment resolved:', data);
      handleCommentResolvedRef.current?.(data);
    });

    socket.on('comment:unresolved', (data: CommentEventPayload) => {
      console.log('Comment unresolved:', data);
      handleCommentUnresolvedRef.current?.(data);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (socket.connected) {
        socket.emit('page:leave', { pageId });
      }
      socket.disconnect();
    };
  }, [user?.id, pageId]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected ?? false,
  };
}
