'use client';

import { BlockType } from './types';
import { useState, useEffect, useRef } from 'react';

interface BlockMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

const BLOCK_CATEGORIES = {
  'Temel Bloklar': [
    { type: BlockType.PARAGRAPH, label: 'Metin', icon: '📝' },
    { type: BlockType.HEADING_1, label: 'Başlık 1', icon: 'H1' },
    { type: BlockType.HEADING_2, label: 'Başlık 2', icon: 'H2' },
    { type: BlockType.HEADING_3, label: 'Başlık 3', icon: 'H3' },
  ],
  'Listeler': [
    { type: BlockType.BULLETED_LIST, label: 'Madde İşaretli Liste', icon: '•' },
    { type: BlockType.NUMBERED_LIST, label: 'Numaralı Liste', icon: '1.' },
    { type: BlockType.TO_DO, label: 'Yapılacaklar Listesi', icon: '☑️' },
  ],
  'Gelişmiş': [
    { type: BlockType.QUOTE, label: 'Alıntı', icon: '❝' },
    { type: BlockType.CODE, label: 'Kod', icon: '< >' },
    { type: BlockType.CALLOUT, label: 'Çağrı', icon: '💡' },
    { type: BlockType.DIVIDER, label: 'Ayıraç', icon: '—' },
  ],
};

export function BlockMenu({
  isOpen,
  position,
  onSelect,
  onClose,
}: BlockMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Reset filter when menu opens
  useEffect(() => {
    if (isOpen) {
      setFilter('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Get filtered options
  const allOptions = Object.entries(BLOCK_CATEGORIES).flatMap(
    ([category, options]) =>
      options.map((opt) => ({ ...opt, category }))
  );

  const filteredOptions = filter
    ? allOptions.filter(
        (opt) =>
          opt.label.toLowerCase().includes(filter.toLowerCase()) ||
          opt.type.toLowerCase().includes(filter.toLowerCase())
      )
    : allOptions;

  const handleSelect = (type: BlockType) => {
    onSelect(type);
    onClose();
    setFilter('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[selectedIndex]) {
        handleSelect(filteredOptions[selectedIndex].type);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-72 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-hidden flex flex-col"
      style={{ left: position.x, top: position.y }}
      onKeyDown={handleKeyDown}
    >
      {/* Search Input */}
      <div className="p-2 border-b border-gray-200">
        <input
          type="text"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setSelectedIndex(0);
          }}
          placeholder="Blokları filtrele..."
          className="w-full px-3 py-2 text-sm outline-none border border-gray-300 rounded-md focus:border-gray-900"
          autoFocus
        />
      </div>

      {/* Options */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredOptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            Blok bulunamadı
          </div>
        ) : (
          <>
            {filter ? (
              // Flat list when filtering
              <div className="space-y-1">
                {filteredOptions.map((option, index) => (
                  <button
                    key={option.type}
                    onClick={() => handleSelect(option.type)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-sm transition-colors ${
                      index === selectedIndex
                        ? 'bg-gray-200 text-gray-900'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded text-xs font-mono">
                      {option.icon}
                    </span>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-gray-500 capitalize">
                        {option.type.toLowerCase().replace(/_/g, ' ')}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              // Categorized list
              Object.entries(BLOCK_CATEGORIES).map(([category, options]) => (
                <div key={category} className="mb-4">
                  <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {category}
                  </div>
                  <div className="space-y-1">
                    {options.map((option, index) => {
                      const globalIndex = allOptions.findIndex(
                        (o) => o.type === option.type
                      );
                      return (
                        <button
                          key={option.type}
                          onClick={() => handleSelect(option.type)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-sm transition-colors ${
                            globalIndex === selectedIndex
                              ? 'bg-gray-200 text-gray-900'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded text-xs font-mono">
                            {option.icon}
                          </span>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-gray-500 capitalize">
                              {option.type.toLowerCase().replace(/_/g, ' ')}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Keyboard hint */}
      <div className="px-3 py-2 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
        <span>Gezinmek için ↑↓ kullanın</span>
        <span>Seçmek için Enter</span>
      </div>
    </div>
  );
}
