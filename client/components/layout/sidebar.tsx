'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import {
  HomeIcon,
  Cog6ToothIcon,
  UsersIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import PageList from '@/components/page/page-list';
import CreatePageModal from '@/components/page/create-page-modal';
import { usePages } from '@/hooks/usePages';

interface SidebarProps {
  workspaceId?: string;
}

export default function Sidebar({ workspaceId }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { workspaces } = useWorkspaces();
  const { createPage } = usePages(workspaceId);
  const [isWorkspacesOpen, setIsWorkspacesOpen] = useState(true);
  const [isCreatePageModalOpen, setIsCreatePageModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-800">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">T</span>
          </div>
          <span className="text-xl font-bold">TaskForge</span>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-gray-800">
        <button
          onClick={() => setIsCreatePageModalOpen(true)}
          disabled={!workspaceId}
          className="w-full flex items-center space-x-2 px-3 py-2 bg-black hover:bg-gray-800 disabled:bg-gray-700 disabled:text-gray-400 rounded-lg transition"
        >
          <PlusIcon className="w-5 h-5" />
          <span>{workspaceId ? 'Yeni Sayfa' : 'Çalışma alanı seçin'}</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Home */}
        <Link
          href="/dashboard"
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
            pathname === '/dashboard'
              ? 'bg-gray-800 text-white'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <HomeIcon className="w-5 h-5" />
          <span>Ana Sayfa</span>
        </Link>

        {/* Workspaces Section */}
        <div>
          <button
            onClick={() => setIsWorkspacesOpen(!isWorkspacesOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition"
          >
            <div className="flex items-center space-x-2">
              <UsersIcon className="w-5 h-5" />
              <span>Çalışma Alanları</span>
            </div>
            {isWorkspacesOpen ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
          </button>

          {isWorkspacesOpen && (
            <div className="ml-6 mt-2 space-y-1">
              <div className="text-sm text-gray-400 px-3 py-1">Çalışma Alanlarınız</div>
              {workspaces.length > 0 ? (
                workspaces.map((workspace) => (
                  <Link
                    key={workspace.id}
                    href={`/dashboard/workspace/${workspace.id}`}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                      pathname === `/dashboard/workspace/${workspace.id}`
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-sm">{workspace.icon || 'W'}</span>
                    </div>
                    <span className="text-sm truncate">{workspace.name}</span>
                  </Link>
                ))
              ) : (
                <div className="text-xs text-gray-500 px-3 py-2 italic">
                  Henüz çalışma alanı yok
                </div>
              )}
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 px-3 py-2 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition text-sm"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Çalışma Alanı Oluştur</span>
              </Link>
            </div>
          )}
        </div>

        {/* Pages Section */}
        {workspaceId && (
          <div>
            <div className="px-3 py-2">
              <PageList workspaceId={workspaceId} />
            </div>
          </div>
        )}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.name || 'Kullanıcı'}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <Link
            href="/settings"
            className="flex items-center space-x-2 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition text-sm"
          >
            <Cog6ToothIcon className="w-4 h-4" />
            <span>Ayarlar</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition text-sm text-left"
          >
            <span>Çıkış Yap</span>
          </button>
        </div>
      </div>

      {/* Create Page Modal */}
      {workspaceId && (
        <CreatePageModal
          isOpen={isCreatePageModalOpen}
          onClose={() => setIsCreatePageModalOpen(false)}
          onCreate={async (data) => {
            await createPage({ ...data, workspaceId });
          }}
          workspaceId={workspaceId}
        />
      )}
    </div>
  );
}
