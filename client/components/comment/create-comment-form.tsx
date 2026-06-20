'use client';

import { useState } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useComments } from '@/hooks/useComments';
import { MentionInput } from '@/components/mention';
import { useMentions } from '@/hooks/useMentions';

interface CreateCommentFormProps {
  pageId: string;
  autoFocus?: boolean;
  compact?: boolean;
  workspaceId?: string;
}

export function CreateCommentForm({
  pageId,
  autoFocus = false,
  compact = false,
  workspaceId = '',
}: CreateCommentFormProps) {
  const { createComment, isLoading } = useComments();
  const { searchUsers } = useMentions();
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isLoading) return;

    const success = await createComment({ content: content.trim(), pageId });
    if (success) {
      setContent('');
      setIsFocused(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Hızlı yorum... (⌘+Enter ile gönder)"
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!content.trim() || isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <PaperAirplaneIcon className="w-4 h-4" />
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {workspaceId ? (
        <MentionInput
          value={content}
          onChange={setContent}
          workspaceId={workspaceId}
          searchUsers={searchUsers}
          placeholder="Yorum yazın... (@kullanıcı ile etiketleyin)"
          rows={content.split('\n').length > 5 ? content.split('\n').length : 2}
        />
      ) : (
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              if (!content) setIsFocused(false);
            }}
            placeholder="Yorum yazın..."
            className={`w-full px-3 py-2 pr-10 border rounded-lg resize-none transition-all ${
              isFocused
                ? 'border-blue-500 ring-2 ring-blue-100'
                : 'border-gray-300'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            rows={content.split('\n').length > 5 ? content.split('\n').length : 2}
            disabled={isLoading}
            autoFocus={autoFocus}
          />
          {content && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {content.length} / 10.000
            </div>
          )}
        </div>
      )}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          ⌘ + Enter ile gönder
        </p>
        <button
          type="submit"
          disabled={!content.trim() || isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Gönderiliyor...
            </>
          ) : (
            <>
              <PaperAirplaneIcon className="w-4 h-4" />
              Gönder
            </>
          )}
        </button>
      </div>
    </form>
  );
}
