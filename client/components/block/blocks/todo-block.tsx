'use client';

import { Block, TodoContent } from '../types';

interface TodoBlockProps {
  block: Block;
  onUpdate: (id: string, data: { content: any }) => void;
  isFocused?: boolean;
  onFocus?: () => void;
}

export function TodoBlock({
  block,
  onUpdate,
  isFocused,
  onFocus,
}: TodoBlockProps) {
  const content = block.content as TodoContent | null;
  const text = content?.text || '';
  const checked = content?.checked || false;

  const handleToggle = () => {
    onUpdate(block.id, {
      content: {
        ...content,
        checked: !checked,
      },
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(block.id, {
      content: {
        ...content,
        text: e.target.value,
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
    <div className="todo-block relative group flex items-start gap-3">
      <button
        onClick={handleToggle}
        className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          checked
            ? 'bg-blue-600 border-blue-600'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

      <input
        type="text"
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        placeholder="To-do..."
        className={`flex-1 outline-none ${
          checked ? 'text-gray-400 line-through' : 'text-gray-900'
        } placeholder-gray-400`}
        autoFocus={isFocused}
      />
    </div>
  );
}
