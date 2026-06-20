'use client';

import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { LargeCalendar } from '@/components/calendar/large-calendar';
import { useState } from 'react';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        selectedSiteId={selectedSiteId}
        onSiteSelect={setSelectedSiteId}
      />

      {/* Header */}
      <Header />

      {/* Sidebar Toggle Button (Desktop) */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed left-64 top-20 z-50 hidden lg:flex items-center justify-center w-8 h-8 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition"
        style={{ left: isSidebarOpen ? '260px' : '0' }}
      >
        <svg className={`w-4 h-4 text-gray-600 transition-transform ${isSidebarOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Main Content - Full Calendar */}
      <main
        className="flex-1 pt-16 overflow-hidden transition-all duration-300"
        style={{ paddingLeft: isSidebarOpen ? '256px' : '0' }}
      >
        <LargeCalendar selectedSiteId={selectedSiteId} />
      </main>
    </div>
  );
}
