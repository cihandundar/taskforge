'use client';

import { Block, BlockType } from './types';
import {
  ParagraphBlock,
  HeadingBlock,
  QuoteBlock,
  CodeBlock,
  TodoBlock,
  DividerBlock,
  CalloutBlock,
  BulletedListBlock,
  NumberedListBlock,
} from './blocks';
import { useState, useRef, useCallback } from 'react';

interface Collaborator {
  userId: string;
  userName: string;
  userAvatar?: string;
  socketId: string;
}

interface BlockItemProps {
  block: Block;
  onUpdate: (id: string, data: { content: any }) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onTurnInto?: (id: string, newType: BlockType) => void;
  isFocused?: boolean;
  onFocus?: () => void;
  onTypingStart?: (blockId: string) => void;
  onTypingStop?: (blockId: string) => void;
  typingUsers?: Collaborator[];
  hasConflict?: boolean;
}

export function BlockItem({
  block,
  onUpdate,
  onDelete,
  onDuplicate,
  onTurnInto,
  isFocused,
  onFocus,
  onTypingStart,
  onTypingStop,
  typingUsers = [],
  hasConflict = false,
}: BlockItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const blockRef = useRef<HTMLDivElement>(null);
  const [dragHandleHovered, setDragHandleHovered] = useState(false);

  const handleOpenMenu = useCallback(() => {
    if (blockRef.current) {
      const rect = blockRef.current.getBoundingClientRect();
      setMenuPosition({ x: rect.left, y: rect.bottom + 4 });
    }
    setShowMenu(true);
  }, []);

  const handleMenuSelect = useCallback(
    (type: BlockType) => {
      if (onTurnInto) {
        onTurnInto(block.id, type);
      }
    },
    [block.id, onTurnInto]
  );

  const handleDelete = useCallback(() => {
    if (confirm('Bu bloğu silmek istiyor musunuz?')) {
      onDelete(block.id);
    }
  }, [block.id, onDelete]);

  const handleDuplicate = useCallback(() => {
    onDuplicate(block.id);
  }, [block.id, onDuplicate]);

  const renderBlock = () => {
    switch (block.type) {
      case BlockType.PARAGRAPH:
        return (
          <ParagraphBlock
            block={block}
            onUpdate={onUpdate}
            isFocused={isFocused}
            onFocus={onFocus}
          />
        );

      case BlockType.HEADING_1:
      case BlockType.HEADING_2:
      case BlockType.HEADING_3:
        return (
          <HeadingBlock
            block={block}
            onUpdate={onUpdate}
            isFocused={isFocused}
            onFocus={onFocus}
          />
        );

      case BlockType.QUOTE:
        return (
          <QuoteBlock
            block={block}
            onUpdate={onUpdate}
            isFocused={isFocused}
            onFocus={onFocus}
          />
        );

      case BlockType.CODE:
        return (
          <CodeBlock
            block={block}
            onUpdate={onUpdate}
            isFocused={isFocused}
            onFocus={onFocus}
          />
        );

      case BlockType.TO_DO:
        return (
          <TodoBlock
            block={block}
            onUpdate={onUpdate}
            isFocused={isFocused}
            onFocus={onFocus}
          />
        );

      case BlockType.DIVIDER:
        return <DividerBlock block={block} onDelete={onDelete} />;

      case BlockType.CALLOUT:
        return (
          <CalloutBlock
            block={block}
            onUpdate={onUpdate}
            isFocused={isFocused}
            onFocus={onFocus}
          />
        );

      case BlockType.BULLETED_LIST:
        return (
          <BulletedListBlock
            block={block}
            onUpdate={onUpdate}
            isFocused={isFocused}
            onFocus={onFocus}
          />
        );

      case BlockType.NUMBERED_LIST:
        return (
          <NumberedListBlock
            block={block}
            onUpdate={onUpdate}
            isFocused={isFocused}
            onFocus={onFocus}
          />
        );

      // Placeholder for other block types
      case BlockType.IMAGE:
      case BlockType.IMAGE:
      case BlockType.VIDEO:
      case BlockType.FILE:
      case BlockType.EMBED:
      case BlockType.CALLOUT:
      case BlockType.COLUMN:
      case BlockType.COLUMN_LIST:
        return (
          <div className="p-4 bg-gray-100 rounded-lg text-gray-600">
            <div className="text-sm font-medium mb-1">
              {block.type.replace(/_/g, ' ')}
            </div>
            <div className="text-xs text-gray-500">Coming soon...</div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={blockRef}
      className={`block-item group relative -mx-4 px-4 py-1 ${
        isFocused ? 'bg-gray-100' : 'hover:bg-gray-50'
      } transition-colors`}
    >
      {/* Drag Handle & Actions */}
      <div
        className={`absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1 transition-opacity ${
          dragHandleHovered || showMenu ? 'opacity-100' : 'opacity-0'
        } ${isFocused ? 'opacity-100' : ''}`}
        onMouseEnter={() => setDragHandleHovered(true)}
        onMouseLeave={() => setDragHandleHovered(false)}
      >
        {/* Drag Handle */}
        <button
          className="p-1 hover:bg-gray-200 rounded cursor-grab active:cursor-grabbing text-gray-400"
          title="Taşımak için sürükle (yakında)"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
          </svg>
        </button>

        {/* Add Block Button */}
        <button
          onClick={() => {
            const event = new CustomEvent('createNewBlock', {
              detail: { afterBlockId: block.id },
            });
            window.dispatchEvent(event);
          }}
          className="p-1 hover:bg-gray-200 rounded text-gray-400"
          title="Aşağıya blok ekle"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Actions Menu */}
        <div className="relative">
          <button
            onClick={handleOpenMenu}
            className="p-1 hover:bg-gray-200 rounded text-gray-400"
            title="Diğer seçenekler"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 min-w-[160px]">
              {/* Delete */}
              <button
                onClick={() => {
                  handleDelete();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 text-red-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 011-1h12a1 1 0 011 1v3M4 7h16" />
                </svg>
                Sil
              </button>

              {/* Duplicate */}
              <button
                onClick={() => {
                  handleDuplicate();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Çoğalt
              </button>

              {/* Turn Into */}
              {onTurnInto && (
                <>
                  <div className="border-t border-gray-200 my-1" />
                  <div className="px-3 py-1 text-xs text-gray-500 font-medium">
                    Dönüştür
                  </div>
                  {[
                    BlockType.PARAGRAPH,
                    BlockType.HEADING_1,
                    BlockType.HEADING_2,
                    BlockType.HEADING_3,
                    BlockType.QUOTE,
                    BlockType.CODE,
                    BlockType.TO_DO,
                  ].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        handleMenuSelect(type);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 capitalize"
                    >
                      {type.replace(/_/g, ' ').toLowerCase()}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Typing Indicators */}
      {typingUsers && typingUsers.length > 0 && (
        <div className="absolute right-0 top-0 flex -space-x-2">
          {typingUsers.slice(0, 3).map((user) => (
            <div
              key={user.socketId}
              className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 border-2 border-white flex items-center justify-center text-xs text-white font-medium"
              title={`${user.userName} yazıyor...`}
            >
              {user.userName?.charAt(0).toUpperCase() || '?'}
            </div>
          ))}
        </div>
      )}

      {/* Conflict Indicator */}
      {hasConflict && (
        <div className="absolute right-0 top-0">
          <div
            className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1"
            title="Çakışma tespit edildi: Başka biri bu bloğu düzenledi"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Çakışma
          </div>
        </div>
      )}

      {/* Block Content */}
      <div className="pl-8">{renderBlock()}</div>
    </div>
  );
}
