'use client';

import { Collaborator } from '@/hooks/useCollaboration';

interface PresenceBarProps {
  collaborators: Collaborator[];
  maxVisible?: number;
}

export function PresenceBar({ collaborators, maxVisible = 5 }: PresenceBarProps) {
  if (collaborators.length === 0) {
    return null;
  }

  const visibleCollaborators = collaborators.slice(0, maxVisible);
  const remainingCount = Math.max(0, collaborators.length - maxVisible);

  return (
    <div className="flex items-center gap-2">
      {/* Online indicator */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="font-medium">{collaborators.length}</span>
        <span className="text-green-600">
          {collaborators.length === 1 ? 'izleyici' : 'izleyici'}
        </span>
      </div>

      {/* Collaborator avatars */}
      <div className="flex -space-x-2">
        {visibleCollaborators.map((collaborator) => (
          <div
            key={collaborator.socketId}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 border-2 border-white flex items-center justify-center text-sm text-white font-medium shadow-sm"
            title={collaborator.userName}
          >
            {collaborator.userName?.charAt(0).toUpperCase() || '?'}
          </div>
        ))}

        {/* Remaining count indicator */}
        {remainingCount > 0 && (
          <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-sm text-gray-600 font-medium shadow-sm">
            +{remainingCount}
          </div>
        )}
      </div>

      {/* Collaborator names tooltip */}
      {collaborators.length > 0 && (
        <div className="text-xs text-gray-500">
          {collaborators.map((c) => c.userName).join(', ')}
        </div>
      )}
    </div>
  );
}
