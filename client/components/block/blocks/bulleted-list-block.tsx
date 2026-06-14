'use client';

import { Block, ListContent } from '../types';
import { useState } from 'react';

interface BulletedListBlockProps {
  block: Block;
  onUpdate: (id: string, data: { content: any }) => void;
  isFocused?: boolean;
  onFocus?: () => void;
}

export function BulletedListBlock({
  block,
  onUpdate,
  isFocused,
  onFocus,
}: BulletedListBlockProps) {
  const content = block.content as ListContent | null;
  const items = content?.items || [''];

  const handleChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    onUpdate(block.id, { content: { items: newItems } });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const newItems = [...items];
      newItems.splice(index + 1, 0, '');
      onUpdate(block.id, { content: { items: newItems } });
    }

    if (e.key === 'Backspace' && items[index] === '' && items.length > 1) {
      e.preventDefault();
      const newItems = [...items];
      newItems.splice(index, 1);
      onUpdate(block.id, { content: { items: newItems } });
    }

    // Create new block after list
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      const event = new CustomEvent('createNewBlock', {
        detail: { afterBlockId: block.id },
      });
      window.dispatchEvent(event);
    }
  };

  const addItem = () => {
    onUpdate(block.id, { content: { items: [...items, ''] } });
  };

  return (
    <div className="bulleted-list-block relative group">
      <div className="space-y-1">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="text-gray-400 mt-0.5 select-none">•</span>
            <input
              type="text"
              value={item}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onFocus={onFocus}
              placeholder="List item"
              className="flex-1 min-h-[24px] outline-none text-gray-900 placeholder-gray-400"
              autoFocus={isFocused && index === 0}
            />
          </div>
        ))}
        {items.length === 0 && (
          <button
            onClick={addItem}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            + Add item
          </button>
        )}
      </div>
    </div>
  );
}
