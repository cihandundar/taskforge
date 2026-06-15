'use client';

import { Collaborator } from '@/hooks/useCollaboration';

interface UserCursorProps {
  collaborator: Collaborator;
  position?: { x: number; y: number };
}

export function UserCursor({ collaborator, position }: UserCursorProps) {
  if (!position) {
    return null;
  }

  const colors = [
    'from-gray-400 to-gray-600',
    'from-gray-500 to-gray-700',
    'from-gray-300 to-gray-500',
    'from-gray-600 to-gray-800',
    'from-gray-400 to-gray-700',
    'from-gray-500 to-gray-800',
  ];

  // Generate consistent color based on user ID
  const colorIndex =
    collaborator.userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    colors.length;
  const colorClass = colors[colorIndex];

  return (
    <div
      className="fixed pointer-events-none z-50 transition-all duration-100 ease-out"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* Cursor */}
      <svg
        className={`w-4 h-4 transform -rotate-12 bg-gradient-to-br ${colorClass} text-white`}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19177L11.7841 12.3673H5.65376Z" />
      </svg>

      {/* Name label */}
      <div
        className={`absolute left-4 top-4 px-2 py-0.5 bg-gradient-to-r ${colorClass} text-white text-xs rounded-md whitespace-nowrap shadow-sm`}
      >
        {collaborator.userName}
      </div>
    </div>
  );
}
