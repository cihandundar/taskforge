'use client';

import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import WorkspaceList from '@/components/workspace/workspace-list';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="pt-16 pl-64">
        <div className="p-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.name || 'User'}!
            </h1>
            <p className="text-gray-600">
              Here's what's happening with your workspaces today.
            </p>
          </div>

          {/* Workspace List */}
          <WorkspaceList />
        </div>
      </main>
    </div>
  );
}
