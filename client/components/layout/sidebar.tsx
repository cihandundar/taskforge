'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  HomeIcon,
  Cog6ToothIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import SiteList from '@/components/site/site-list';

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  selectedSiteId?: string;
  onSiteSelect?: (siteId: string) => void;
}

export default function Sidebar({ isOpen = true, onToggle, selectedSiteId, onSiteSelect }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  return (
    <>
      <div
        className={`
          fixed left-0 top-0 h-full bg-gray-900 text-white flex flex-col transition-all duration-300 z-40
          ${isOpen ? 'w-64' : 'w-0 overflow-hidden'}
        `}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">T</span>
            </div>
            <span className="text-xl font-bold">TaskForge</span>
          </Link>
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-1 hover:bg-gray-800 rounded-lg transition"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
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
            <span>Takvim</span>
          </Link>

          {/* Sites Section */}
          <div className="space-y-1">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sitelerim
            </div>
            <SiteList selectedSiteId={selectedSiteId} onSiteSelect={onSiteSelect} />
          </div>
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
      </div>

      {/* Overlay when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}
