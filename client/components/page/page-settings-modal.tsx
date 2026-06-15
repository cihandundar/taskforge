'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface PageSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (data: { icon?: string; cover?: string }) => void;
  currentIcon?: string;
  currentCover?: string;
}

const EMOJIS = [
  '📄', '📝', '📋', '📌', '📎', '🗂️', '📁', '💡',
  '🎯', '🚀', '💼', '📊', '🎨', '🔧', '📈', '🏠',
  '📖', '✨', '🔥', '⭐', '💎', '🌟', '📚', '🎓',
  '💻', '🎮', '🎬', '📸', '🎵', '🏆', '🎁', '🌈',
];

const COVERS = [
  '',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
];

export function PageSettingsModal({
  isOpen,
  onClose,
  onUpdate,
  currentIcon,
  currentCover,
}: PageSettingsModalProps) {
  const [selectedIcon, setSelectedIcon] = useState(currentIcon || '📄');
  const [selectedCover, setSelectedCover] = useState(currentCover || '');

  const handleSave = () => {
    onUpdate({ icon: selectedIcon, cover: selectedCover });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition z-10"
        >
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Sayfa Ayarları</h2>
            <p className="text-gray-600 mt-1">Sayfa görünümünüzü özelleştirin</p>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Sayfa İkonu</label>
              <div className="grid grid-cols-8 gap-2">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedIcon(emoji)}
                    className={`p-3 text-2xl rounded-lg transition ${
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Kapak Resmi</label>
              <div className="grid grid-cols-2 gap-2">
                {COVERS.map((cover, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedCover(cover)}
                    className={`h-16 rounded-lg transition relative overflow-hidden ${
                      selectedCover === cover
                        ? 'ring-2 ring-gray-900 ring-offset-2'
                        : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-2'
                    }`}
                    style={cover ? { background: cover } : {}}
                  >
                    {!cover && <span className="text-gray-400 text-sm">Kapak Yok</span>}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">Önizleme</p>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{selectedIcon}</span>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex space-x-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition"
            >
              Değişiklikleri Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
