'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useBlocks } from '@/hooks/useBlocks';
import { useCollaboration } from '@/hooks/useCollaboration';
import { Block, BlockType } from './types';
import { BlockItem } from './block-item';
import { BlockMenu } from './block-menu';

interface BlockEditorProps {
  pageId: string;
}

export function BlockEditor({ pageId }: BlockEditorProps) {
  const {
    blocks,
    isLoading: blocksLoading,
    error: blocksError,
    fetchBlocks,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    createParagraph,
    createTypedBlock,
    handleRemoteBlockCreate,
    handleRemoteBlockUpdate,
    handleRemoteBlockDelete,
  } = useBlocks(pageId);

  // WebSocket collaboration hook
  const {
    isConnected,
    collaborators,
    getTypingUsersForBlock,
    hasConflict,
    emitTypingStart,
    emitTypingStop,
  } = useCollaboration({
    pageId,
    onRemoteBlockCreate: handleRemoteBlockCreate,
    onRemoteBlockUpdate: handleRemoteBlockUpdate,
    onRemoteBlockDelete: handleRemoteBlockDelete,
  });

  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0 });
  const [slashMenuBlockId, setSlashMenuBlockId] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch blocks on mount
  useEffect(() => {
    if (pageId && !isInitialized) {
      fetchBlocks(pageId);
      setIsInitialized(true);
    }
  }, [pageId, fetchBlocks, isInitialized]);

  // Handle custom events for block operations
  useEffect(() => {
    const handleCreateNewBlock = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { afterBlockId } = customEvent.detail;
      createParagraph().then((block) => {
        setFocusedBlockId(block.id);
      });
    };

    const handleDeleteEmptyBlock = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { blockId } = customEvent.detail;
      const blockIndex = blocks.findIndex((b) => b.id === blockId);
      if (blockIndex > 0) {
        // Focus previous block
        setFocusedBlockId(blocks[blockIndex - 1].id);
      }
      deleteBlock(blockId);
    };

    const handleOpenSlashMenu = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { blockId } = customEvent.detail;
      const blockEl = document.querySelector(`[data-block-id="${blockId}"]`);
      if (blockEl) {
        const rect = blockEl.getBoundingClientRect();
        setSlashMenuPosition({ x: rect.left, y: rect.bottom + 4 });
        setSlashMenuBlockId(blockId);
        setSlashMenuOpen(true);
      }
    };

    window.addEventListener('createNewBlock', handleCreateNewBlock);
    window.addEventListener('deleteEmptyBlock', handleDeleteEmptyBlock);
    window.addEventListener('openSlashMenu', handleOpenSlashMenu);

    return () => {
      window.removeEventListener('createNewBlock', handleCreateNewBlock);
      window.removeEventListener('deleteEmptyBlock', handleDeleteEmptyBlock);
      window.removeEventListener('openSlashMenu', handleOpenSlashMenu);
    };
  }, [blocks, deleteBlock, createParagraph]);

  // Handle slash menu selection
  const handleSlashMenuSelect = useCallback(
    async (type: BlockType) => {
      if (!slashMenuBlockId) return;

      // For dividers, create new block after current
      if (type === BlockType.DIVIDER) {
        await createTypedBlock(type);
        setFocusedBlockId(null);
        return;
      }

      // Turn current empty block into selected type
      const block = blocks.find((b) => b.id === slashMenuBlockId);
      if (block && (!block.content || (block.content as any).text === '')) {
        await updateBlock(slashMenuBlockId, { type });
        setFocusedBlockId(slashMenuBlockId);
      }
    },
    [slashMenuBlockId, blocks, updateBlock, createTypedBlock]
  );

  // Handle block focus
  const handleBlockFocus = useCallback((blockId: string) => {
    setFocusedBlockId(blockId);
  }, []);

  // Handle block update
  const handleBlockUpdate = useCallback(
    async (id: string, data: { content: any }) => {
      try {
        await updateBlock(id, data);
        // Emit typing stop after successful update
        emitTypingStop(id);
      } catch (err) {
        console.error('Failed to update block:', err);
      }
    },
    [updateBlock, emitTypingStop]
  );

  // Handle typing start
  const handleTypingStart = useCallback(
    (blockId: string) => {
      emitTypingStart(blockId);
    },
    [emitTypingStart]
  );

  // Handle typing stop
  const handleTypingStop = useCallback(
    (blockId: string) => {
      emitTypingStop(blockId);
    },
    [emitTypingStop]
  );

  // Handle block delete
  const handleBlockDelete = useCallback(
    async (id: string) => {
      try {
        await deleteBlock(id);
        const blockIndex = blocks.findIndex((b) => b.id === id);
        if (blockIndex > 0) {
          setFocusedBlockId(blocks[blockIndex - 1].id);
        } else if (blocks.length > 1) {
          setFocusedBlockId(blocks[1].id);
        } else {
          setFocusedBlockId(null);
        }
      } catch (err) {
        console.error('Failed to delete block:', err);
      }
    },
    [deleteBlock, blocks]
  );

  // Handle block duplicate
  const handleBlockDuplicate = useCallback(
    async (id: string) => {
      try {
        const duplicated = await duplicateBlock(id);
        setFocusedBlockId(duplicated.id);
      } catch (err) {
        console.error('Failed to duplicate block:', err);
      }
    },
    [duplicateBlock]
  );

  // Handle turn into
  const handleTurnInto = useCallback(
    async (id: string, newType: BlockType) => {
      try {
        await updateBlock(id, { type: newType });
        setFocusedBlockId(id);
      } catch (err) {
        console.error('Failed to turn block:', err);
      }
    },
    [updateBlock]
  );

  // Handle click on empty editor
  const handleEditorClick = useCallback(() => {
    if (blocks.length === 0) {
      createParagraph().then((block) => {
        setFocusedBlockId(block.id);
      });
    }
  }, [blocks.length, createParagraph]);

  // Loading state
  if (blocksLoading && !isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Bloklar yükleniyor...</div>
      </div>
    );
  }

  // Error state
  if (blocksError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{blocksError}</div>
      </div>
    );
  }

  // Empty state
  if (blocks.length === 0) {
    return (
      <div
        ref={editorRef}
        className="h-full flex items-center justify-center cursor-text"
        onClick={handleEditorClick}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11 5zm0 0H9"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Yazmaya başla
          </h3>
          <p className="text-gray-600">
            Herhangi bir yere tıklayın veya komutlar için <kbd className="bg-gray-100 px-1 rounded">/</kbd> tuşuna basın
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={editorRef} className="block-editor max-w-3xl mx-auto">
      {/* Connection Status Indicator */}
      {isConnected && collaborators.length > 0 && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-700">
              {collaborators.length} {collaborators.length === 1 ? 'işbirlikçi' : 'işbirlikçi'} çevrimiçi
            </span>
          </div>
          <div className="flex -space-x-2">
            {collaborators.slice(0, 5).map((c) => (
              <div
                key={c.socketId}
                className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 border-2 border-white flex items-center justify-center text-xs text-white font-medium"
                title={c.userName}
              >
                {c.userName?.charAt(0).toUpperCase() || '?'}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blocks */}
      <div className="space-y-1">
        {blocks.map((block, index) => (
          <div key={block.id} data-block-id={block.id}>
            <BlockItem
              block={block}
              onUpdate={handleBlockUpdate}
              onDelete={handleBlockDelete}
              onDuplicate={handleBlockDuplicate}
              onTurnInto={handleTurnInto}
              isFocused={focusedBlockId === block.id}
              onFocus={() => handleBlockFocus(block.id)}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
              typingUsers={getTypingUsersForBlock(block.id)}
              hasConflict={hasConflict(block.id)}
            />
          </div>
        ))}
      </div>

      {/* Slash Menu */}
      <BlockMenu
        isOpen={slashMenuOpen}
        position={slashMenuPosition}
        onSelect={handleSlashMenuSelect}
        onClose={() => {
          setSlashMenuOpen(false);
          setSlashMenuBlockId(null);
        }}
      />

      {/* Add Block Button at bottom */}
      {blocks.length > 0 && (
        <button
          onClick={() =>
            createParagraph().then((block) => {
              setFocusedBlockId(block.id);
            })
          }
          className="mt-4 w-full flex items-center justify-center gap-2 py-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors group"
        >
          <svg
            className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            Blok ekle
          </span>
        </button>
      )}
    </div>
  );
}
