'use client';

import { useWorkspaces } from '@/hooks/useWorkspaces';
import { usePages } from '@/hooks/usePages';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import PageList from '@/components/page/page-list';
import { BlockEditor } from '@/components/block';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PageSettingsModal } from '@/components/page/page-settings-modal';

export default function PageDetailPage({
  params,
}: {
  params: { id: string; page: string };
}) {
  const router = useRouter();
  const { workspaces } = useWorkspaces();
  const { pages, updatePage, deletePage } = usePages(params.id);
  const [currentPage, setCurrentPage] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const page = pages.find((p) => p.id === params.page);
    if (page) {
      setCurrentPage(page);
      setEditTitle(page.title);
    }
  }, [params.page, pages]);

  useEffect(() => {
    // Auto-save keyboard shortcut
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (isEditing && editTitle.trim()) {
          handleSaveTitle();
        }
      }
      if (e.key === 'Escape' && isEditing) {
        setIsEditing(false);
        setEditTitle(currentPage?.title || '');
        setHasUnsavedChanges(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, editTitle, currentPage]);

  const currentWorkspace = workspaces.find((w) => w.id === params.id);

  const handleStartEdit = () => {
    setIsEditing(true);
    setHasUnsavedChanges(false);
    setTimeout(() => titleInputRef.current?.focus(), 100);
  };

  const handleSaveTitle = async () => {
    if (!currentPage || !editTitle.trim()) return;

    setIsSaving(true);
    setHasUnsavedChanges(false);

    try {
      await updatePage(currentPage.id, { title: editTitle });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update page:', err);
      // Revert to original on error
      setEditTitle(currentPage.title);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTitleChange = (value: string) => {
    setEditTitle(value);
    setHasUnsavedChanges(value !== currentPage?.title);
  };

  const handleUpdatePage = async (data: any) => {
    try {
      await updatePage(params.page, data);
      setCurrentPage((prev: any) => ({ ...prev, ...data }));
    } catch (err) {
      console.error('Failed to update page:', err);
    }
  };

  const handleDeletePage = async () => {
    if (!currentPage) return;

    if (confirm(`Delete "${currentPage.title}"?`)) {
      try {
        await deletePage(currentPage.id);
        router.push(`/dashboard/workspace/${params.id}`);
      } catch (err) {
        console.error('Failed to delete page:', err);
      }
    }
  };

  const handleGoToPage = (pageId: string) => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Do you want to leave?')) {
        return;
      }
    }
    router.push(`/dashboard/workspace/${params.id}/page/${pageId}`);
  };

  const handleSettingsSave = async (data: { icon?: string; cover?: string }) => {
    try {
      await updatePage(params.page, data);
      setCurrentPage((prev: any) => ({ ...prev, ...data }));
    } catch (err) {
      console.error('Failed to update page settings:', err);
    }
  };

  if (!currentPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Loading page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar */}
      <Sidebar workspaceId={params.id} />

      {/* Header */}
      <Header
        workspaceId={params.id}
        workspaceName={currentWorkspace?.name}
      />

      {/* Main Content */}
      <main className="pt-16 pl-64 flex h-screen">
        {/* Left Panel - Page List */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <PageList
              workspaceId={params.id}
              onGoToPage={handleGoToPage}
            />
          </div>
        </div>

        {/* Right Panel - Page Content */}
        <div className="flex-1 flex flex-col">
          {/* Page Header */}
          <div className="border-b border-gray-200 p-8">
            {isEditing ? (
              <div className="flex items-center space-x-4">
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="flex-1 text-2xl font-bold text-gray-900 border-b-2 border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none py-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveTitle();
                    } else if (e.key === 'Escape') {
                      setIsEditing(false);
                      setEditTitle(currentPage.title);
                      setHasUnsavedChanges(false);
                    }
                  }}
                />
                <button
                  onClick={handleSaveTitle}
                  disabled={isSaving || !hasUnsavedChanges}
                  className="px-4 py-2 bg-black hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-lg transition"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditTitle(currentPage.title);
                    setHasUnsavedChanges(false);
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Cover Image */}
                  {currentPage.cover && (
                    <div
                      className="w-12 h-12 rounded-lg"
                      style={{ background: currentPage.cover }}
                    />
                  )}
                  <span className="text-2xl font-bold text-gray-900">
                    {currentPage.icon} {currentPage.title}
                  </span>
                  {/* Save Indicator */}
                  {hasUnsavedChanges && (
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                      Unsaved changes (Press Cmd+S to save)
                    </span>
                  )}
                  <button
                    onClick={handleStartEdit}
                    className="p-2 rounded-lg hover:bg-gray-100 transition"
                    title="Edit title (Cmd+Click)"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3a2.5 2.5 0 01-2.5-2.5V14.5a2.5 2.5 0 012.5-2.5h1.072m5.536-5.536a2.5 2.5 0 013.536 3.536L14.5 14.5a2.5 2.5 0 00-2.5 2.5v1.5" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Settings Button */}
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition"
                    title="Page settings"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  {/* Delete Button */}
                  <button
                    onClick={handleDeletePage}
                    className="p-2 rounded-lg hover:bg-red-50 transition"
                    title="Delete page"
                  >
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 011-1h12a1 1 0 011 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Last edited {new Date(currentPage.lastEditedAt).toLocaleString()}
            </p>
          </div>

          {/* Page Content Area */}
          <div className="flex-1 overflow-y-auto">
            <BlockEditor pageId={params.page} />
          </div>
        </div>
      </main>

      {/* Page Settings Modal */}
      <PageSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdate={handleSettingsSave}
        currentIcon={currentPage.icon}
        currentCover={currentPage.cover}
      />
    </div>
  );
}
