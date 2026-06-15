'use client';

import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { LargeCalendar } from '@/components/calendar/large-calendar';
import { useState } from 'react';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

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
      <Sidebar />

      {/* Header */}
      <Header />

      {/* Main Content - Full Calendar */}
      <main className="flex-1 pt-16 pl-64 overflow-hidden">
        <LargeCalendar />
      </main>
    </div>
  );
}
