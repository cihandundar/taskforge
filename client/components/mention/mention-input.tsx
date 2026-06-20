'use client';

import { useState, useRef, useEffect } from 'react';
import { AtSymbolIcon } from '@heroicons/react/24/outline';
import type { MentionUser } from '@/types/mention';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  workspaceId: string;
  searchUsers: (workspaceId: string, query: string) => Promise<MentionUser[]>;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}

export function MentionInput({
  value,
  onChange,
  workspaceId,
  searchUsers,
  placeholder = 'Yorum yazın... (@kullanıcı ile etiketleyin)',
  rows = 3,
  disabled = false,
}: MentionInputProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Get current cursor position and text before cursor
  const getTextBeforeCursor = () => {
    const textarea = textareaRef.current;
    if (!textarea) return { text: '', position: 0 };

    const position = textarea.selectionStart;
    const textBefore = value.substring(0, position);
    return { text: textBefore, position };
  };

  // Check if cursor is in a mention
  const getCurrentMention = () => {
    const { text, position } = getTextBeforeCursor();
    const lastAtIndex = text.lastIndexOf('@');

    if (lastAtIndex === -1) return null;

    // Check if there's a space after @ (mention ended)
    const textAfterAt = text.substring(lastAtIndex + 1);
    if (textAfterAt.includes(' ')) return null;

    return {
      start: lastAtIndex,
      query: textAfterAt,
    };
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Check if we're in a mention
    const mention = getCurrentMention();

    if (mention) {
      setMentionStart(mention.start);
      setSearchQuery(mention.query);
      setShowSuggestions(true);

      // Search users
      if (mention.query.length >= 2) {
        setIsSearching(true);
        searchUsers(workspaceId, mention.query).then((users) => {
          setSuggestions(users);
          setIsSearching(false);
          setSelectedIndex(0);
        });
      } else {
        setSuggestions([]);
      }
    } else {
      setShowSuggestions(false);
      setMentionStart(null);
      setSearchQuery('');
    }
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          insertMention(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        break;
      case 'Tab':
        if (showSuggestions && suggestions[selectedIndex]) {
          e.preventDefault();
          insertMention(suggestions[selectedIndex]);
        }
        break;
    }
  };

  // Insert mention
  const insertMention = (user: MentionUser) => {
    if (mentionStart === null) return;

    const before = value.substring(0, mentionStart);
    const after = value.substring(getTextBeforeCursor().position);

    // Insert @userId
    const newValue = `${before}@${user.id} ${after}`;
    onChange(newValue);

    // Reset state
    setShowSuggestions(false);
    setMentionStart(null);
    setSearchQuery('');
    setSuggestions([]);

    // Focus textarea after update
    setTimeout(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        const newPosition = before.length + user.id.length + 2; // +2 for "@ "
        textarea.focus();
        textarea.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        !textareaRef.current?.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={`w-full px-3 py-2 pr-10 border rounded-lg resize-none transition-all ${
          showSuggestions
            ? 'border-blue-500 ring-2 ring-blue-100'
            : 'border-gray-300'
        } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
      />

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {isSearching ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              Aranıyor...
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((user, index) => (
              <div
                key={user.id}
                onClick={() => insertMention(user)}
                className={`px-4 py-2 cursor-pointer transition-colors ${
                  index === selectedIndex
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                    {user.name?.[0] || user.email[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-sm">
                      {user.name || user.email.split('@')[0]}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.email}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : searchQuery.length >= 2 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              Sonuç bulunamadı
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500">
              En az 2 karakter girin...
            </div>
          )}
        </div>
      )}

      {/* @ Icon Indicator */}
      <div className="absolute right-3 top-3 text-gray-400 pointer-events-none">
        <AtSymbolIcon className="w-5 h-5" />
      </div>
    </div>
  );
}
