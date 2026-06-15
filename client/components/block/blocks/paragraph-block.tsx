'use client';

import { Block, ParagraphContent } from '../types';

interface ParagraphBlockProps {
  block: Block;
  onUpdate: (id: string, data: { content: any }) => void;
  isFocused?: boolean;
  onFocus?: () => void;
}

export function ParagraphBlock({
  block,
  onUpdate,
  isFocused,
  onFocus,
}: ParagraphBlockProps) {
  const content = block.content as ParagraphContent | null;
  const text = content?.text || '';

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(block.id, { content: { text: e.target.value } });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Trigger new block creation via parent
      const event = new CustomEvent('createNewBlock', {
        detail: { afterBlockId: block.id },
      });
      window.dispatchEvent(event);
    }

    if (e.key === 'Backspace' && text === '' && !e.shiftKey) {
      e.preventDefault();
      // Trigger block deletion via parent
      const event = new CustomEvent('deleteEmptyBlock', {
        detail: { blockId: block.id },
      });
      window.dispatchEvent(event);
    }

    // Open slash menu
    if (e.key === '/' && text === '') {
      e.preventDefault();
      const event = new CustomEvent('openSlashMenu', {
        detail: { blockId: block.id },
      });
      window.dispatchEvent(event);
    }
  };

  return (
    <div className="paragraph-block relative group">
      <textarea
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        placeholder="Komutlar için '/' yazın..."
        className="w-full min-h-[24px] resize-none outline-none text-gray-900 placeholder-gray-400 leading-relaxed"
        rows={1}
        autoFocus={isFocused}
      />
    </div>
  );
}
