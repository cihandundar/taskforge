'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/button';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; icon?: string; description?: string }) => void;
}

const EMOJIS = [
  '🏢', '🚀', '💡', '🎯', '📊', '🎨', '🔧', '💼',
  '📈', '🗂️', '📁', '🏗️', '⚡', '🌟', '💎', '🔮',
];

export default function CreateWorkspaceModal({
  isOpen,
  onClose,
  onCreate,
}: CreateWorkspaceModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🏢');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Çalışma alanı adı gerekli');
      return;
    }

    if (name.length < 3) {
      setError('Çalışma alanı adı en az 3 karakter olmalı');
      return;
    }

    setIsLoading(true);

    try {
      await onCreate({ name, icon: selectedIcon, description });
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Çalışma alanı oluşturulamadı');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setSelectedIcon('🏢');
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
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
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
            <h2 className="text-2xl font-bold text-gray-900">Çalışma Alanı Oluştur</h2>
            <p className="text-gray-600 mt-1">
              Projelerinizi düzenlemek için yeni bir çalışma alanı oluşturun
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Workspace Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Çalışma Alanı Adı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Harika Çalışma Alanım"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                required
              />
            </div>

            {/* Icon Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icon
              </label>
              <div className="grid grid-cols-8 gap-2">
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

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Açıklama <span className="text-gray-400">(isteğe bağlı)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Bu çalışma alanı ne için?"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                onClick={handleClose}
                variant="secondary"
                className="flex-1"
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Oluşturuluyor...' : 'Çalışma Alanı Oluştur'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
