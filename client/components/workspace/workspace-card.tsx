'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface WorkspaceCardProps {
  workspace: {
    id: string;
    name: string;
    icon?: string;
    description?: string;
    role: string;
    _count?: {
      members: number;
      pages: number;
    };
  };
  onEdit?: (workspace: any) => void;
  onDelete?: (workspaceId: string) => void;
}

export default function WorkspaceCard({
  workspace,
  onEdit,
  onDelete,
}: WorkspaceCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const canEdit = workspace.role === 'OWNER' || workspace.role === 'ADMIN';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition group">
      {/* Card Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-xl">{workspace.icon || '🏢'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {workspace.name}
              </h3>
              {workspace.description && (
                <p className="text-sm text-gray-500 truncate mt-0.5">
                  {workspace.description}
                </p>
              )}
            </div>
          </div>

          {/* Menu Button */}
          {canEdit && (
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition opacity-0 group-hover:opacity-100"
              >
                <EllipsisVerticalIcon className="w-5 h-5 text-gray-500" />
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <button
                      onClick={() => {
                        onEdit?.(workspace);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <PencilIcon className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        onDelete?.(workspace.id);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <TrashIcon className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Body */}
      <Link href={`/dashboard/workspace/${workspace.id}`}>
        <div className="p-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <UsersIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {workspace._count?.members || 0} members
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <DocumentTextIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {workspace._count?.pages || 0} pages
              </span>
            </div>
          </div>

          {/* Role Badge */}
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                workspace.role === 'OWNER'
                  ? 'bg-purple-100 text-purple-800'
                  : workspace.role === 'ADMIN'
                  ? 'bg-blue-100 text-blue-800'
                  : workspace.role === 'MEMBER'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {workspace.role.toLowerCase()}
            </span>

            <span className="text-xs text-gray-500">Joined {new Date(workspace.joinedAt || Date.now()).toLocaleDateString()}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
