'use client';

import { Block, CalloutContent } from '../types';

interface CalloutBlockProps {
  block: Block;
  onUpdate: (id: string, data: { content: any }) => void;
  isFocused?: boolean;
  onFocus?: () => void;
}

export function CalloutBlock({
  block,
  onUpdate,
  isFocused,
  onFocus,
}: CalloutBlockProps) {
  const content = block.content as CalloutContent | null;
  const text = content?.text || '';
  const emoji = content?.emoji || '💡';

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(block.id, { content: { ...content, text: e.target.value } });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const event = new CustomEvent('createNewBlock', {
        detail: { afterBlockId: block.id },
      });
      window.dispatchEvent(event);
    }

    if (e.key === 'Backspace' && text === '' && !e.shiftKey) {
      e.preventDefault();
      const event = new CustomEvent('deleteEmptyBlock', {
        detail: { blockId: block.id },
      });
      window.dispatchEvent(event);
    }
  };

  return (
    <div className="callout-block relative group">
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <span className="text-2xl flex-shrink-0">{emoji}</span>
        <textarea
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          placeholder="Bir şeyler yazın..."
          className="flex-1 min-h-[24px] resize-none outline-none bg-transparent text-gray-900 placeholder-gray-500 leading-relaxed"
          rows={1}
          autoFocus={isFocused}
        />
      </div>
    </div>
  );
}
