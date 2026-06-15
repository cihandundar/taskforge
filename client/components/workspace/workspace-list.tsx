'use client';

import { useState } from 'react';
import WorkspaceCard from './workspace-card';
import CreateWorkspaceModal from './create-workspace-modal';
import { useWorkspaces } from '@/hooks/useWorkspaces';

export default function WorkspaceList() {
  const {
    workspaces,
    isLoading,
    error,
    createWorkspace,
    deleteWorkspace,
    fetchWorkspaces,
  } = useWorkspaces();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [workspaceToEdit, setWorkspaceToEdit] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleCreateWorkspace = async (data: any) => {
    await createWorkspace(data);
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (!confirm('Bu çalışma alanını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    try {
      await deleteWorkspace(workspaceId);
    } catch (err) {
      console.error('Failed to delete workspace:', err);
    }
  };

  const handleEditWorkspace = (workspace: any) => {
    setWorkspaceToEdit(workspace);
    setIsEditing(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Çalışma Alanlarınız</h2>
          <p className="text-gray-600 mt-1">
            Çalışma alanlarınızı yönetin ve ekibinizle işbirliği yapın
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition"
        >
          <span className="text-xl">+</span>
          <span>Yeni Çalışma Alanı</span>
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchWorkspaces}
            className="mt-2 text-sm text-red-700 underline"
          >
            Tekrar dene
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && workspaces.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Workspaces Grid */}
          {workspaces.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workspaces.map((workspace) => (
                <WorkspaceCard
                  key={workspace.id}
                  workspace={workspace}
                  onEdit={handleEditWorkspace}
                  onDelete={handleDeleteWorkspace}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz çalışma alanı yok</h3>
              <p className="text-gray-600 mb-6">
                Çalışmanızı düzenlemek için ilk çalışma alanınızı oluşturun
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-black hover:bg-gray-800 text-white rounded-lg transition"
              >
                <span className="text-xl">+</span>
                <span>Çalışma Alanı Oluştur</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateWorkspace}
      />
    </div>
  );
}
