'use client';

import { Collaborator } from '@/hooks/useCollaboration';

interface TypingIndicatorProps {
  users: Collaborator[];
  blockId: string;
}

export function TypingIndicator({ users, blockId }: TypingIndicatorProps) {
  // Filter users who are typing on this specific block
  const typingOnThisBlock = users.filter((u) => u.typingBlockId === blockId);

  if (typingOnThisBlock.length === 0) {
    return null;
  }

  const names = typingOnThisBlock.map((u) => u.userName).join(', ');
  const message =
    typingOnThisBlock.length === 1
      ? `${names} yazıyor...`
      : `${names} yazıyor...`;

  return (
    <div className="inline-flex items-center gap-2 px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full ml-2 animate-pulse">
      <span>{message}</span>
    </div>
  );
}
