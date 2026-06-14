'use client';

import { Block, HeadingContent, BlockType } from '../types';

interface HeadingBlockProps {
  block: Block;
  onUpdate: (id: string, data: { content: any }) => void;
  isFocused?: boolean;
  onFocus?: () => void;
}

export function HeadingBlock({
  block,
  onUpdate,
  isFocused,
  onFocus,
}: HeadingBlockProps) {
  const content = block.content as HeadingContent | null;
  const text = content?.text || '';

  // Determine heading level
  let level = 1;
  if (block.type === BlockType.HEADING_2) level = 2;
  if (block.type === BlockType.HEADING_3) level = 3;

  const headingClasses = {
    1: 'text-3xl font-bold',
    2: 'text-2xl font-semibold',
    3: 'text-xl font-medium',
  };

  const placeholder = {
    1: 'Heading 1',
    2: 'Heading 2',
    3: 'Heading 3',
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(block.id, { content: { text: e.target.value } });
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
    <div className="heading-block relative group">
      <textarea
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        placeholder={placeholder[level]}
        className={`w-full min-h-[24px] resize-none outline-none text-gray-900 placeholder-gray-400 ${headingClasses[level]}`}
        rows={1}
        autoFocus={isFocused}
      />
    </div>
  );
}
