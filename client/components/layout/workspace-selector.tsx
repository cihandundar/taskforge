'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  ChevronDownIcon,
  PlusIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

interface Workspace {
  id: string;
  name: string;
  icon?: string;
  role: string;
}

interface WorkspaceSelectorProps {
  workspaces: Workspace[];
  currentWorkspaceId?: string;
  onWorkspaceChange: (workspaceId: string) => void;
  onCreateWorkspace: () => void;
  onWorkspaceSettings?: (workspaceId: string) => void;
}

export default function WorkspaceSelector({
  workspaces,
  currentWorkspaceId,
  onWorkspaceChange,
  onCreateWorkspace,
  onWorkspaceSettings,
}: WorkspaceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId);

  return (
    <div className="relative">
      {/* Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
      >
        {/* Workspace Icon */}
        <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
          {currentWorkspace?.icon ? (
            <span>{currentWorkspace.icon}</span>
          ) : (
            <span className="text-gray-900 text-sm">W</span>
          )}
        </div>

        {/* Workspace Name */}
        <span className="text-sm font-medium text-gray-700">
          {currentWorkspace?.name || 'Select Workspace'}
        </span>

        {/* Chevron */}
        <ChevronDownIcon
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
            <div className="p-2">
              {/* User's Personal Section */}
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">
                Your Workspaces
              </div>

              {/* Workspace List */}
              {workspaces.length > 0 ? (
                <div className="space-y-1">
                  {workspaces.map((workspace) => (
                    <div
                      key={workspace.id}
                      className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                      onClick={() => {
                        onWorkspaceChange(workspace.id);
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                          {workspace.icon ? (
                            <span className="text-sm">{workspace.icon}</span>
                          ) : (
                            <span className="text-gray-900 text-xs">
                              {workspace.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-700">
                          {workspace.name}
                        </span>
                      </div>

                      {/* Settings Icon (on hover) */}
                      {onWorkspaceSettings && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onWorkspaceSettings(workspace.id);
                            setIsOpen(false);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 transition"
                        >
                          <Cog6ToothIcon className="w-4 h-4 text-gray-500" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  No workspaces yet
                </div>
              )}

              {/* Create Workspace Button */}
              <button
                onClick={() => {
                  onCreateWorkspace();
                  setIsOpen(false);
                }}
                className="w-full mt-2 flex items-center space-x-2 px-3 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition text-sm font-medium"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Create Workspace</span>
              </button>
            </div>

            {/* Footer */}
            <div className="px-3 py-2 border-t border-gray-200 text-xs text-gray-500">
              {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
