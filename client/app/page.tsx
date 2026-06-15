'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">TaskForge</h1>
            <div className="flex items-center gap-3">
              <a
                href="/auth/login"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Giriş
              </a>
              <a
                href="/auth/register"
                className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-md"
              >
                Başla
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-3xl mx-auto px-6 py-24">
        <div className="text-center">
          <h1 className="text-4xl font-semibold text-gray-900 mb-4">
            Birlikte çalışmanın daha iyi yolu
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
            Takımınla oluştur, organize et ve işbirliği yap. Basit blok editörü ile içeriklerini kolayca yönet.
          </p>
          <div className="flex justify-center gap-3">
            <a
              href="/auth/register"
              className="px-5 py-2.5 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-md"
            >
              Hemen Başla
            </a>
            <a
              href="/auth/login"
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Giriş Yap
            </a>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Blok Editör</h3>
            <p className="text-sm text-gray-600">Bloklarla oluştur</p>
          </div>

          <div className="text-center">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Gerçek Zamanlı</h3>
            <p className="text-sm text-gray-600">Birlikte çalış</p>
          </div>

          <div className="text-center">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Çalışma Alanları</h3>
            <p className="text-sm text-gray-600">Organize kal</p>
          </div>
        </div>
      </main>
    </div>
  );
}
