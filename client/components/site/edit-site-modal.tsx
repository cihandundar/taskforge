'use client';

import { useState, useEffect } from 'react';
import { useSites } from '@/hooks/useSites';
import { Site } from '@/hooks/useSites';

interface EditSiteModalProps {
  isOpen: boolean;
  site: Site;
  onClose: () => void;
  onUpdate: (site: Site) => void;
}

const colors = ['blue', 'green', 'yellow', 'red', 'purple'];

const colorStyles: Record<string, string> = {
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#F59E0B',
  red: '#EF4444',
  purple: '#8B5CF6',
};

export default function EditSiteModal({ isOpen, site, onClose, onUpdate }: EditSiteModalProps) {
  const [name, setName] = useState(site.name);
  const [url, setUrl] = useState(site.url);
  const [color, setColor] = useState(site.color);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { updateSite, deleteSite } = useSites();

  useEffect(() => {
    if (site) {
      setName(site.name);
      setUrl(site.url);
      setColor(site.color);
    }
  }, [site]);

  if (!isOpen) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updated = await updateSite(site.id, { name, url, color });
      onUpdate(updated);
    } catch (error: any) {
      console.error('Update error:', error);
      alert(error.message || 'Site güncellenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`"${name}" sitesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteSite(site.id);
      onClose();
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(error.message || 'Site silinirken hata oluştu');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Siteyi Düzenle</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site Adı *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Örn: GitHub"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black placeholder-gray-400 text-gray-900"
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site URL *
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              placeholder="https://github.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black placeholder-gray-400 text-gray-900"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Renk
            </label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition ${
                    color === c ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : 'hover:ring-2 hover:ring-offset-2 hover:ring-gray-400'
                  }`}
                  style={{ backgroundColor: colorStyles[c] }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading || isDeleting}
              className="flex-1 px-4 py-2 bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
            >
              {isLoading ? 'Güncelleniyor...' : 'Güncelle'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition"
            >
              İptal
            </button>
          </div>

          {/* Delete Section */}
          <div className="pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full px-4 py-2 bg-red-50 hover:bg-red-100 disabled:bg-red-50/50 text-red-600 disabled:text-red-400 rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Siliniyor...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Siteyi Sil
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
