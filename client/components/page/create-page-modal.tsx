'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface CreatePageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { title: string; icon?: string }) => void;
  workspaceId?: string;
  parentId?: string;
}

const EMOJIS = [
  '📄', '📝', '📋', '📌', '📎', '🗂️', '📁', '💡',
  '🎯', '🚀', '💼', '📊', '🎨', '🔧', '📈', '🏠',
];

export default function CreatePageModal({
  isOpen,
  onClose,
  onCreate,
  workspaceId,
  parentId,
}: CreatePageModalProps) {
  const [title, setTitle] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📄');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Sayfa başlığı gerekli');
      return;
    }

    if (title.length < 2) {
      setError('Sayfa başlığı en az 2 karakter olmalı');
      return;
    }

    setIsLoading(true);

    try {
      await onCreate({ title, icon: selectedIcon });
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Sayfa oluşturulamadı');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setSelectedIcon('📄');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition"
        >
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Yeni Sayfa Oluştur</h2>
            <p className="text-gray-600 mt-1">
              {parentId ? 'Alt sayfa oluştur' : 'Çalışma alanınızda yeni sayfa oluşturun'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Page Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sayfa Başlığı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Başlıksız"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                required
                autoFocus
              />
            </div>

            {/* Icon Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icon
              </label>
              <div className="grid grid-cols-9 gap-2">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedIcon(emoji)}
                    className={`p-2 text-2xl rounded-lg transition ${
                      selectedIcon === emoji
                        ? 'bg-gray-200 ring-2 ring-gray-900'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition disabled:opacity-50"
              >
                {isLoading ? 'Oluşturuluyor...' : 'Sayfa Oluştur'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
