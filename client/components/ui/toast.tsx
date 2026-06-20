'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

const toastConfig: Record<ToastType, { bgColor: string; textColor: string; icon: any }> = {
  success: {
    bgColor: 'bg-green-500',
    textColor: 'text-white',
    icon: CheckCircleIcon,
  },
  error: {
    bgColor: 'bg-red-500',
    textColor: 'text-white',
    icon: XCircleIcon,
  },
  warning: {
    bgColor: 'bg-yellow-500',
    textColor: 'text-white',
    icon: ExclamationTriangleIcon,
  },
  info: {
    bgColor: 'bg-blue-500',
    textColor: 'text-white',
    icon: InformationCircleIcon,
  },
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = useCallback((toast: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const newToast = { ...toast, id } as ToastProps;
    const duration = toast.duration || 3000;

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <>
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0,
            transform: translateX(100%);
          }
          to {
            opacity: 1,
            transform: translateX(0);
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
        .animate-fade-out {
          animation: fadeOut 0.3s ease-in forwards;
        }
      `}</style>

      <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toasts.map((toast) => {
          const Icon = toastConfig[toast.type].icon;
          const config = toastConfig[toast.type];

          return (
            <div
              key={toast.id}
              className={`
                min-w-[300px] max-w-md p-4 rounded-lg shadow-lg
                flex items-start gap-3
                animate-slide-in
                ${config.bgColor} ${config.textColor}
              `}
            >
              <div className="flex-shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{toast.title}</p>
                {toast.message && (
                  <p className="text-sm opacity-90 mt-1">{toast.message}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 ml-4 hover:opacity-70 transition"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
