'use client';

import { useSites } from '@/hooks/useSites';
import { useState } from 'react';
import CreateSiteModal from './create-site-modal';
import EditSiteModal from './edit-site-modal';

interface SiteListProps {
  onSiteSelect?: (siteId: string) => void;
  selectedSiteId?: string;
}

const colorDots: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
};

export default function SiteList({ onSiteSelect, selectedSiteId }: SiteListProps) {
  const { sites, isLoading, createSite, deleteSite } = useSites();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<any | null>(null);
  const [deletingSite, setDeletingSite] = useState<any | null>(null);

  if (isLoading) {
    return <div className="animate-pulse space-y-1 px-3">
      {[1, 2].map((i) => (
        <div key={i} className="h-7 bg-gray-700 rounded" />
      ))}
    </div>;
  }

  const handleDelete = async (site: any) => {
    if (confirm(`"${site.name}" sitesini silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteSite(site.id);
        setDeletingSite(null);
      } catch (error) {
        console.error('Delete error:', error);
        alert('Site silinirken hata oluştu');
      }
    }
  };

  return (
    <>
      <div className="space-y-1 px-3">
        {/* Sites List */}
        {sites.map((site) => (
          <div
            key={site.id}
            className={`flex items-center gap-2 py-1.5 text-sm transition group rounded ${
              selectedSiteId === site.id
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <button
              onClick={() => onSiteSelect?.(site.id)}
              className="flex items-center gap-2 flex-1 min-w-0 text-left"
            >
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colorDots[site.color] || 'bg-gray-500'}`} />
              <span className="truncate">{site.name}</span>
            </button>

            {/* Actions - Show on hover */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 hover:bg-gray-700 rounded"
                title="Siteyi aç"
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <button
                onClick={() => setEditingSite(site)}
                className="p-1 hover:bg-gray-700 rounded"
                title="Düzenle"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={() => handleDelete(site)}
                className="p-1 hover:bg-red-900/50 rounded text-red-400"
                title="Sil"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {/* Add Site Link */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 py-1.5 text-sm text-gray-500 hover:text-white transition w-full"
        >
          <span className="text-xs">+</span>
          <span>Ekle</span>
        </button>
      </div>

      {/* Create Site Modal */}
      <CreateSiteModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={async (data) => {
          await createSite(data);
        }}
      />

      {/* Edit Site Modal */}
      {editingSite && (
        <EditSiteModal
          isOpen={!!editingSite}
          site={editingSite}
          onClose={() => setEditingSite(null)}
          onUpdate={async (data) => {
            // Will be handled by modal
            setEditingSite(null);
          }}
        />
      )}
    </>
  );
}
