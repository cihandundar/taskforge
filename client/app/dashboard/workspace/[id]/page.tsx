'use client';

import { useWorkspaces } from '@/hooks/useWorkspaces';
import { usePages } from '@/hooks/usePages';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import PageList from '@/components/page/page-list';
import CreatePageModal from '@/components/page/create-page-modal';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function WorkspaceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { workspaces } = useWorkspaces();
  const { createPage } = usePages(params.id);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const currentWorkspace = workspaces.find((w) => w.id === params.id);

  const handleCreatePage = async (data: { title: string; icon?: string }) => {
    await createPage({
      title: data.title,
      icon: data.icon,
      workspaceId: params.id,
    });
  };

  const handleGoToPage = (pageId: string) => {
    router.push(`/dashboard/workspace/${params.id}/page/${pageId}`);
  };

  if (!currentWorkspace && !workspaces.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar workspaceId={params.id} />

      {/* Header */}
      <Header
        workspaceId={params.id}
        workspaceName={currentWorkspace?.name}
      />

      {/* Main Content */}
      <main className="pt-16 pl-64 flex">
        {/* Left Panel - Page List */}
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          <PageList
            workspaceId={params.id}
            onGoToPage={handleGoToPage}
          />
        </div>

        {/* Right Panel - Page Content */}
        <div className="flex-1 p-8">
          {/* Empty State */}
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a page</h3>
              <p className="text-gray-600 mb-4">
                Choose a page from the sidebar or create a new one
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition"
              >
                <span className="text-lg">+</span>
                <span>Create Page</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Create Page Modal */}
      <CreatePageModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreatePage}
        workspaceId={params.id}
      />
    </div>
  );
}
