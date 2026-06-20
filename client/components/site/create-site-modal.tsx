'use client';

import { useState } from 'react';

interface CreateSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: any) => Promise<void>;
}

const colors = ['blue', 'green', 'yellow', 'red', 'purple'];

export default function CreateSiteModal({ isOpen, onClose, onCreate }: CreateSiteModalProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [color, setColor] = useState('blue');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onCreate({ name, url, color });
      onClose();
      // Reset form
      setName('');
      setUrl('');
      setColor('blue');
    } catch (error) {
      console.error('Error creating site:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Yeni Site Ekle</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                  className={`w-8 h-8 rounded-full bg-${c}-500 hover:ring-2 ring-offset-2 ring-${c}-500 transition ${
                    color === c ? 'ring-2 ring-offset-2' : ''
                  }`}
                  style={{
                    backgroundColor: c === 'blue' ? '#3B82F6' :
                                   c === 'green' ? '#10B981' :
                                   c === 'yellow' ? '#F59E0B' :
                                   c === 'red' ? '#EF4444' :
                                   c === 'purple' ? '#8B5CF6' : '#000'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
            >
              {isLoading ? 'Ekleniyor...' : 'Ekle'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
