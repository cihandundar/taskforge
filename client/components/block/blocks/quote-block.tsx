'use client';

import { Block, QuoteContent } from '../types';

interface QuoteBlockProps {
  block: Block;
  onUpdate: (id: string, data: { content: any }) => void;
  isFocused?: boolean;
  onFocus?: () => void;
}

export function QuoteBlock({
  block,
  onUpdate,
  isFocused,
  onFocus,
}: QuoteBlockProps) {
  const content = block.content as QuoteContent | null;
  const text = content?.text || '';
  const author = content?.author || '';

  const handleChange = (field: 'text' | 'author') => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    onUpdate(block.id, {
      content: {
        ...content,
        [field]: e.target.value,
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Trigger new block creation
      const event = new CustomEvent('createNewBlock', {
        detail: { afterBlockId: block.id },
      });
      window.dispatchEvent(event);
    }

    if (e.key === 'Backspace' && text === '' && !e.shiftKey) {
      e.preventDefault();
      // Trigger block deletion
      const event = new CustomEvent('deleteEmptyBlock', {
        detail: { blockId: block.id },
      });
      window.dispatchEvent(event);
    }
  };

  return (
    <div className="quote-block relative group border-l-4 border-gray-300 pl-4 py-2">
      <textarea
        value={text}
        onChange={handleChange('text')}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        placeholder="Quote..."
        className="w-full min-h-[24px] resize-none outline-none text-gray-900 placeholder-gray-400 italic text-lg"
        rows={1}
        autoFocus={isFocused}
      />
      <input
        type="text"
        value={author}
        onChange={handleChange('author')}
        placeholder="— Author"
        className="w-full outline-none text-gray-600 placeholder-gray-400 text-sm mt-2"
      />
    </div>
  );
}
