'use client';

import { Block, ListContent } from '../types';

interface NumberedListBlockProps {
  block: Block;
  onUpdate: (id: string, data: { content: any }) => void;
  isFocused?: boolean;
  onFocus?: () => void;
}

export function NumberedListBlock({
  block,
  onUpdate,
  isFocused,
  onFocus,
}: NumberedListBlockProps) {
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

  return (
    <div className="numbered-list-block relative group">
      <div className="space-y-1">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="text-gray-500 min-w-[20px] mt-0.5 select-none text-sm">
              {index + 1}.
            </span>
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
      </div>
    </div>
  );
}
