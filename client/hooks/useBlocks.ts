'use client';

import { useState, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  Block,
  CreateBlockData,
  UpdateBlockData,
  BlockType,
} from '@/components/block/types';

export function useBlocks(pageId?: string) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isRemoteUpdate = useRef(false);

  const fetchBlocks = useCallback(async (targetPageId?: string) => {
    const pid = targetPageId || pageId;
    if (!pid) {
      setBlocks([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.client.get(`/blocks?pageId=${pid}`);
      const blocksData = response.data.data;
      setBlocks(blocksData || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch blocks');
      setBlocks([]);
    } finally {
      setIsLoading(false);
    }
  }, [pageId]);

  const createBlock = useCallback(async (data: CreateBlockData): Promise<Block> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.client.post('/blocks', data);
      const newBlock = response.data.data;

      // Mark as local update to avoid WebSocket feedback loop
      if (!isRemoteUpdate.current) {
        // This will be called from local action, emit to WebSocket
        // (This will be handled by the collaboration hook)
      }

      // Optimistic update - add to list
      setBlocks((prev) => {
        if (data.parentId) {
          // Add as child - for now just add to top level
          // TODO: Implement nested block handling
          return [...prev, newBlock];
        }
        return [...prev, newBlock];
      });

      return newBlock;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to create block';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle remote block creation (from WebSocket)
  const handleRemoteBlockCreate = useCallback((block: Block) => {
    isRemoteUpdate.current = true;
    setBlocks((prev) => {
      // Check if block already exists
      if (prev.some((b) => b.id === block.id)) {
        return prev;
      }
      return [...prev, block];
    });
    // Reset flag after a short delay
    setTimeout(() => {
      isRemoteUpdate.current = false;
    }, 100);
  }, []);

  const updateBlock = useCallback(async (
    id: string,
    data: UpdateBlockData
  ): Promise<Block> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.client.put(`/blocks/${id}`, data);
      const updatedBlock = response.data.data;

      // Mark as local update to avoid WebSocket feedback loop
      if (!isRemoteUpdate.current) {
        // This will be called from local action, emit to WebSocket
        // (This will be handled by the collaboration hook)
      }

      // Update in list
      setBlocks((prev) =>
        prev.map((b) => (b.id === id ? updatedBlock : b))
      );

      return updatedBlock;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to update block';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle remote block update (from WebSocket)
  const handleRemoteBlockUpdate = useCallback((block: Block) => {
    isRemoteUpdate.current = true;
    setBlocks((prev) =>
      prev.map((b) => (b.id === block.id ? block : b))
    );
    // Reset flag after a short delay
    setTimeout(() => {
      isRemoteUpdate.current = false;
    }, 100);
  }, []);

  const deleteBlock = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await apiClient.client.delete(`/blocks/${id}`);

      // Mark as local update to avoid WebSocket feedback loop
      if (!isRemoteUpdate.current) {
        // This will be called from local action, emit to WebSocket
        // (This will be handled by the collaboration hook)
      }

      // Remove from list
      setBlocks((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to delete block';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle remote block delete (from WebSocket)
  const handleRemoteBlockDelete = useCallback((blockId: string) => {
    isRemoteUpdate.current = true;
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    // Reset flag after a short delay
    setTimeout(() => {
      isRemoteUpdate.current = false;
    }, 100);
  }, []);

  const duplicateBlock = useCallback(async (id: string): Promise<Block> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.client.post(`/blocks/${id}/duplicate`);
      const duplicatedBlock = response.data.data;

      // Add to list
      setBlocks((prev) => [...prev, duplicatedBlock]);

      return duplicatedBlock;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to duplicate block';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reorderBlocks = useCallback(async (
    blockOrders: Array<{ id: string; position: number; parentId?: string | null }>
  ): Promise<Block[]> => {
    if (!pageId) {
      throw new Error('Page ID is required for reordering blocks');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.client.post(`/blocks/reorder`, {
        pageId,
        blockOrders,
      });
      const reorderedBlocks = response.data.data;

      setBlocks(reorderedBlocks || []);
      return reorderedBlocks;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to reorder blocks';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [pageId]);

  const getBlockChildren = useCallback(async (blockId: string): Promise<Block[]> => {
    try {
      const response = await apiClient.client.get(`/blocks/${blockId}/children`);
      return response.data.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch block children';
      throw new Error(errorMsg);
    }
  }, []);

  // Helper: Create a default paragraph block
  const createParagraph = useCallback(
    async (parentId?: string): Promise<Block> => {
      if (!pageId) {
        throw new Error('Page ID is required for creating blocks');
      }
      return createBlock({
        type: BlockType.PARAGRAPH,
        content: { text: '' },
        pageId,
        parentId,
      });
    },
    [pageId, createBlock]
  );

  // Helper: Create a specific block type
  const createTypedBlock = useCallback(
    async (
      type: BlockType,
      content?: Record<string, any>,
      parentId?: string
    ): Promise<Block> => {
      if (!pageId) {
        throw new Error('Page ID is required for creating blocks');
      }
      return createBlock({
        type,
        content: content || {},
        pageId,
        parentId,
      });
    },
    [pageId, createBlock]
  );

  return {
    blocks,
    isLoading,
    error,
    fetchBlocks,
    createBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    reorderBlocks,
    getBlockChildren,
    createParagraph,
    createTypedBlock,
    // Remote update handlers for WebSocket integration
    handleRemoteBlockCreate,
    handleRemoteBlockUpdate,
    handleRemoteBlockDelete,
  };
}
