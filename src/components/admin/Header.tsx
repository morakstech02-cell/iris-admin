'use client';

import { Icon } from './Icon';
import { initials } from '@/lib/utils';
import type { AdminSession } from '@/lib/types';

interface HeaderProps {
  session: AdminSession | null;
  pageTitle: string;
  onToggleMobileNav: () => void;
}

export function Header({ session, pageTitle, onToggleMobileNav }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-slate-200">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleMobileNav}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100"
          >
            <Icon name="menu" className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
              Academic Session · 2025/2026
            </p>
            <h1 className="text-sm sm:text-base font-semibold text-ink-900 truncate">
              {pageTitle}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 ring-1 ring-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-emerald-800">
              Live · Supabase
            </span>
          </div>
          <div className="hidden md:flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="text-right leading-tight">
              <p className="text-xs font-semibold text-ink-900">
                {session?.name || '—'}
              </p>
              <p className="text-[10px] text-ink-500">
                {session?.role === 'master'
                  ? 'Full System Access'
                  : `Admin · ${session?.role || ''}`}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary-600 ring-2 ring-primary-500/20 text-white flex items-center justify-center text-xs font-bold">
              {initials(session?.name)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}