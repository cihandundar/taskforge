'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { socketClient } from '@/lib/socket-client';
import { Block } from '@/components/block/types';

export interface Collaborator {
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  socketId: string;
  joinedAt: Date;
  typingBlockId?: string;
  lastTypingUpdate?: Date;
}

export interface CollaborationState {
  isConnected: boolean;
  collaborators: Collaborator[];
  typingUsers: Map<string, Collaborator>; // blockId -> collaborator
  conflicts: Set<string>; // blockIds with conflicts
}

interface UseCollaborationOptions {
  pageId?: string;
  onRemoteBlockCreate?: (block: Block) => void;
  onRemoteBlockUpdate?: (block: Block) => void;
  onRemoteBlockDelete?: (blockId: string) => void;
  onRemoteBlocksReorder?: (data: any) => void;
}

export function useCollaboration({
  pageId,
  onRemoteBlockCreate,
  onRemoteBlockUpdate,
  onRemoteBlockDelete,
  onRemoteBlocksReorder,
}: UseCollaborationOptions) {
  const [state, setState] = useState<CollaborationState>({
    isConnected: false,
    collaborators: [],
    typingUsers: new Map(),
    conflicts: new Set(),
  });

  const isLocalUpdate = useRef(false);
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Handle user joined
  const handleUserJoined = useCallback((data: any) => {
    setState((prev) => ({
      ...prev,
      collaborators: [...prev.collaborators, { ...data, joinedAt: new Date() }],
    }));
  }, []);

  // Handle user left
  const handleUserLeft = useCallback((data: any) => {
    setState((prev) => ({
      ...prev,
      collaborators: prev.collaborators.filter((c) => c.userId !== data.userId),
      typingUsers: new Map(
        Array.from(prev.typingUsers.entries()).filter(([_, c]) => c.userId !== data.userId),
      ),
    }));
  }, []);

  // Handle room users update
  const handleRoomUsers = useCallback((users: any[]) => {
    setState((prev) => ({
      ...prev,
      collaborators: users.map((u) => ({
        ...u,
        joinedAt: new Date(u.joinedAt || Date.now()),
      })),
    }));
  }, []);

  // Handle remote block created
  const handleBlockCreated = useCallback((data: Block) => {
    if (!isLocalUpdate.current && onRemoteBlockCreate) {
      onRemoteBlockCreate(data);
    }
    isLocalUpdate.current = false;
  }, [onRemoteBlockCreate]);

  // Handle remote block updated
  const handleBlockUpdated = useCallback((data: Block) => {
    if (!isLocalUpdate.current && onRemoteBlockUpdate) {
      onRemoteBlockUpdate(data);
    }
    isLocalUpdate.current = false;
  }, [onRemoteBlockUpdate]);

  // Handle remote block deleted
  const handleBlockDeleted = useCallback((data: { id: string }) => {
    if (!isLocalUpdate.current && onRemoteBlockDelete) {
      onRemoteBlockDelete(data.id);
    }
    isLocalUpdate.current = false;
  }, [onRemoteBlockDelete]);

  // Handle blocks reordered
  const handleBlocksReordered = useCallback((data: any) => {
    if (!isLocalUpdate.current && onRemoteBlocksReorder) {
      onRemoteBlocksReorder(data);
    }
    isLocalUpdate.current = false;
  }, [onRemoteBlocksReorder]);

  // Handle user typing
  const handleUserTyping = useCallback((data: any) => {
    const { userId, userName, userAvatar, blockId, isTyping } = data;

    setState((prev) => {
      const newTypingUsers = new Map(prev.typingUsers);

      if (isTyping) {
        newTypingUsers.set(blockId, { userId, userName, userAvatar } as Collaborator);

        // Clear existing timeout for this user/block
        const existingTimeout = typingTimeoutRef.current.get(`${userId}-${blockId}`);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Set new timeout to remove typing indicator after 3 seconds
        const timeout = setTimeout(() => {
          setState((prev) => {
            const newTypingUsers = new Map(prev.typingUsers);
            newTypingUsers.delete(blockId);
            return { ...prev, typingUsers: newTypingUsers };
          });
        }, 3000);

        typingTimeoutRef.current.set(`${userId}-${blockId}`, timeout);
      } else {
        newTypingUsers.delete(blockId);
      }

      return { ...prev, typingUsers: newTypingUsers };
    });
  }, []);

  // Handle conflict detected
  const handleConflictDetected = useCallback((data: { blockId: string; message: string }) => {
    setState((prev) => ({
      ...prev,
      conflicts: new Set([...prev.conflicts, data.blockId]),
    }));

    // Auto-clear conflict after 5 seconds
    setTimeout(() => {
      setState((prev) => {
        const newConflicts = new Set(prev.conflicts);
        newConflicts.delete(data.blockId);
        return { ...prev, conflicts: newConflicts };
      });
    }, 5000);
  }, []);

  // Handle connection state
  const handleConnect = useCallback(() => {
    setState((prev) => ({ ...prev, isConnected: true }));
  }, []);

  const handleDisconnect = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isConnected: false,
      collaborators: [],
      typingUsers: new Map(),
    }));
  }, []);

  // Connect to socket when pageId changes
  useEffect(() => {
    if (!pageId) return;

    socketClient.connect(pageId, {
      onUserJoined: handleUserJoined,
      onUserLeft: handleUserLeft,
      onRoomUsers: handleRoomUsers,
      onBlockCreated: handleBlockCreated,
      onBlockUpdated: handleBlockUpdated,
      onBlockDeleted: handleBlockDeleted,
      onBlocksReordered: handleBlocksReordered,
      onUserTyping: handleUserTyping,
      onConflictDetected: handleConflictDetected,
      onDisconnect: handleDisconnect,
      onReconnect: handleConnect,
      onError: (error) => console.error('[useCollaboration] Socket error:', error),
    });

    setState((prev) => ({ ...prev, isConnected: true }));

    return () => {
      socketClient.disconnect();
      // Clear all typing timeouts
      typingTimeoutRef.current.forEach((timeout) => clearTimeout(timeout));
      typingTimeoutRef.current.clear();
    };
  }, [pageId]);

  // Emit create block
  const emitCreateBlock = useCallback((block: Block) => {
    isLocalUpdate.current = true;
    socketClient.emitCreateBlock({
      ...block,
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Emit update block
  const emitUpdateBlock = useCallback((block: Block) => {
    isLocalUpdate.current = true;
    socketClient.emitUpdateBlock({
      id: block.id,
      pageId: block.pageId,
      content: block.content,
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Emit delete block
  const emitDeleteBlock = useCallback((blockId: string, pageId: string) => {
    isLocalUpdate.current = true;
    socketClient.emitDeleteBlock({ id: blockId, pageId });
  }, []);

  // Emit typing start
  const emitTypingStart = useCallback((blockId: string) => {
    if (!pageId) return;
    socketClient.emitTypingStart(pageId, blockId);
  }, [pageId]);

  // Emit typing stop
  const emitTypingStop = useCallback((blockId: string) => {
    if (!pageId) return;
    socketClient.emitTypingStop(pageId, blockId);
  }, [pageId]);

  // Get typing users for a specific block
  const getTypingUsersForBlock = useCallback(
    (blockId: string): Collaborator[] => {
      const users: Collaborator[] = [];
      state.typingUsers.forEach((user, bid) => {
        if (bid === blockId) {
          users.push(user);
        }
      });
      return users;
    },
    [state.typingUsers],
  );

  // Check if a block has conflicts
  const hasConflict = useCallback(
    (blockId: string): boolean => {
      return state.conflicts.has(blockId);
    },
    [state.conflicts],
  );

  return {
    isConnected: state.isConnected,
    collaborators: state.collaborators,
    getTypingUsersForBlock,
    hasConflict,
    emitCreateBlock,
    emitUpdateBlock,
    emitDeleteBlock,
    emitTypingStart,
    emitTypingStop,
  };
}
