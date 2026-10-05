'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'success' | 'error' | 'info' | 'warn';

interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
}

const ToastCtx = createContext<(msg: string, tone?: Tone) => void>(() => {});

export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, tone: Tone = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, []);

  const toneStyles: Record<Tone, string> = {
    success: 'border-emerald-500',
    error: 'border-red-500',
    info: 'border-primary-500',
    warn: 'border-amber-500',
  };

  const iconBg: Record<Tone, string> = {
    success: 'text-emerald-400',
    error: 'text-red-400',
    info: 'text-primary-400',
    warn: 'text-amber-400',
  };

  const iconChar: Record<Tone, string> = {
    success: '✓',
    error: '!',
    info: 'i',
    warn: '!',
  };

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] space-y-3 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-pop border-l-4 bg-ink-900 text-white fade-in text-xs font-medium max-w-sm',
              toneStyles[t.tone]
            )}
          >
            <span
              className={cn(
                'w-4 h-4 shrink-0 mt-0.5 rounded-full bg-white/10 flex items-center justify-center font-bold text-[10px]',
                iconBg[t.tone]
              )}
            >
              {iconChar[t.tone]}
            </span>
            <div className="flex-1">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}