'use client';

import { Block, CodeContent } from '../types';
import { useState } from 'react';

interface CodeBlockProps {
  block: Block;
  onUpdate: (id: string, data: { content: any }) => void;
  isFocused?: boolean;
  onFocus?: () => void;
}

const LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'cpp',
  'csharp',
  'go',
  'rust',
  'php',
  'ruby',
  'swift',
  'kotlin',
  'sql',
  'html',
  'css',
  'json',
  'xml',
  'yaml',
  'markdown',
  'bash',
  'none',
];

export function CodeBlock({
  block,
  onUpdate,
  isFocused,
  onFocus,
}: CodeBlockProps) {
  const content = block.content as CodeContent | null;
  const code = content?.code || '';
  const language = content?.language || 'javascript';

  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(block.id, {
      content: {
        ...content,
        code: e.target.value,
      },
    });
  };

  const handleLanguageChange = (lang: string) => {
    onUpdate(block.id, {
      content: {
        ...content,
        language: lang,
      },
    });
    setShowLanguageMenu(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow tab indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue =
        code.substring(0, start) + '  ' + code.substring(end);
      onUpdate(block.id, {
        content: {
          ...content,
          code: newValue,
        },
      });
      // Set cursor position after indent
      setTimeout(() => {
        e.currentTarget.selectionStart = e.currentTarget.selectionEnd =
          start + 2;
      }, 0);
    }

    // Enter creates new line instead of new block for code
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      // Trigger new block creation on Shift+Enter
      const event = new CustomEvent('createNewBlock', {
        detail: { afterBlockId: block.id },
      });
      window.dispatchEvent(event);
    }

    // Escape to exit code block
    if (e.key === 'Escape') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="code-block relative group bg-gray-900 rounded-lg p-4">
      {/* Language Selector */}
      <div className="relative mb-2">
        <button
          onClick={() => setShowLanguageMenu(!showLanguageMenu)}
          className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1"
        >
          <span>{language}</span>
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {showLanguageMenu && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 capitalize"
              >
                {lang}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Code Editor */}
      <textarea
        value={code}
        onChange={handleCodeChange}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        placeholder="// Write your code here..."
        className="w-full min-h-[120px] resize-y outline-none bg-transparent text-gray-100 placeholder-gray-500 font-mono text-sm leading-relaxed"
        autoFocus={isFocused}
        spellCheck={false}
      />

      <div className="text-xs text-gray-500 mt-2">
        Press <kbd className="bg-gray-800 px-1 rounded">Shift+Enter</kbd> to
        add a new block
      </div>
    </div>
  );
}
