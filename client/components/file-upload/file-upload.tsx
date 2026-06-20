'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  PhotoIcon,
  CodeBracketIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadProgress?: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface FileUploadProps {
  onFilesSelected?: (files: FileAttachment[]) => void;
  onFileRemove?: (fileId: string) => void;
  acceptedTypes?: string;
  maxSize?: number; // in bytes
  maxFiles?: number;
  existingFiles?: FileAttachment[];
  disabled?: boolean;
}

// File type icons
const FILE_TYPE_ICONS: Record<string, any> = {
  'image/': PhotoIcon,
  'text/': DocumentIcon,
  'application/json': CodeBracketIcon,
  'application/javascript': CodeBracketIcon,
  'application/xml': CodeBracketIcon,
  'text/xml': CodeBracketIcon,
  'default': DocumentIcon,
};

const getFileIcon = (type: string) => {
  const iconKey = Object.keys(FILE_TYPE_ICONS).find(key => type.startsWith(key)) || 'default';
  return FILE_TYPE_ICONS[iconKey];
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export function FileUpload({
  onFilesSelected,
  onFileRemove,
  acceptedTypes = '*/*',
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
  existingFiles = [],
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileAttachment[]>(existingFiles);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `Dosya boyutu çok büyük (${formatFileSize(file.size)} > ${formatFileSize(maxSize)})`,
      };
    }

    // Check file type
    if (acceptedTypes !== '*/*') {
      const acceptedTypesArray = acceptedTypes.split(',').map(t => t.trim());
      const isAccepted = acceptedTypesArray.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('*', ''));
        }
        return file.type === type;
      });

      if (!isAccepted) {
        return {
          valid: false,
          error: 'Dosya türü desteklenmiyor',
        };
      }
    }

    return { valid: true };
  };

  const processFiles = useCallback((fileList: FileList) => {
    const newFiles: FileAttachment[] = [];
    const errors: string[] = [];

    Array.from(fileList).forEach((file) => {
      // Check max files limit
      if (files.length + newFiles.length >= maxFiles) {
        errors.push(`Maksimum ${maxFiles} dosya yükleyebilirsiniz`);
        return;
      }

      const validation = validateFile(file);
      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.error}`);
        return;
      }

      newFiles.push({
        id: Math.random().toString(36).substring(7),
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending',
      });
    });

    if (newFiles.length > 0) {
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      onFilesSelected?.(newFiles);
    }

    if (errors.length > 0) {
      console.error('Dosya yükleme hataları:', errors);
    }
  }, [files, maxFiles, maxSize, acceptedTypes, onFilesSelected]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    onFileRemove?.(fileId);
  };

  const simulateUpload = (fileAttachment: FileAttachment) => {
    setFiles(prev => prev.map(f =>
      f.id === fileAttachment.id
        ? { ...f, status: 'uploading' as const, uploadProgress: 0 }
        : f
    ));

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setFiles(prev => prev.map(f =>
        f.id === fileAttachment.id
          ? { ...f, uploadProgress: progress }
          : f
      ));

      if (progress >= 100) {
        clearInterval(interval);
        setFiles(prev => prev.map(f =>
          f.id === fileAttachment.id
            ? { ...f, status: 'success' as const, uploadProgress: 100 }
            : f
        ));
      }
    }, 200);
  };

  // Simulate upload for new files on component mount
  useEffect(() => {
    files.forEach(file => {
      if (file.status === 'pending') {
        simulateUpload(file);
      }
    });
  }, []);

  return (
    <div className="file-upload">
      {/* Drop Zone */}
      {!disabled && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors duration-200
            ${isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onClick={() => fileInputRef.current?.click()}
        >
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Dosyaları buraya sürükleyin veya{' '}
            <span className="text-blue-600 hover:text-blue-700">tıklayın</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Maksimum {formatFileSize(maxSize)}, {maxFiles} dosya
          </p>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file) => {
            const FileIcon = getFileIcon(file.type);

            return (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                {/* File Icon */}
                <FileIcon className="w-8 h-8 text-gray-400 flex-shrink-0" />

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>

                  {/* Upload Progress */}
                  {file.status === 'uploading' && file.uploadProgress !== undefined && (
                    <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${file.uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Status Icons */}
                {file.status === 'success' && (
                  <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                )}
                {file.status === 'error' && (
                  <div className="text-xs text-red-500 flex-shrink-0">
                    {file.error || 'Hata'}
                  </div>
                )}

                {/* Remove Button */}
                {!disabled && (
                  <button
                    onClick={() => handleRemoveFile(file.id)}
                    className="flex-shrink-0 p-1 hover:bg-gray-200 rounded-full transition"
                  >
                    <XMarkIcon className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
