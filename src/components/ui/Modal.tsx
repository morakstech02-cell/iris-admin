'use client';

import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  dismissOnBackdrop?: boolean;
}

const SIZES: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  open,
  onClose,
  children,
  size = 'md',
  dismissOnBackdrop = true,
}: ModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-ink-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={dismissOnBackdrop ? onClose : undefined}
    >
      <div
        className={`bg-white rounded-2xl shadow-pop ring-1 ring-slate-200 w-full ${SIZES[size]} fade-in my-8`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}