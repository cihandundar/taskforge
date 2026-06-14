'use client';

import { Block } from '../types';

interface DividerBlockProps {
  block: Block;
  onDelete?: (id: string) => void;
}

export function DividerBlock({ block, onDelete }: DividerBlockProps) {
  return (
    <div className="divider-block relative group py-4">
      <hr className="border-t border-gray-200" />
      {/* Delete button on hover */}
      <button
        onClick={() => onDelete?.(block.id)}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white p-1 rounded shadow-sm"
        title="Delete divider"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
