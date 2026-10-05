'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ADMIN_TABS } from '@/lib/config';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Icon } from './Icon';
import type { AdminSession } from '@/lib/types';

interface SidebarProps {
  session: AdminSession | null;
  liveBadge?: number;
  subBadge?: boolean;
  syncState?: 'connecting' | 'connected' | 'disconnected';
}

export function Sidebar({
  session,
  liveBadge = 0,
  subBadge = false,
  syncState = 'connecting',
}: SidebarProps) {
  const router = useRouter();
  const supabase = createClient();
  const [currentHash, setCurrentHash] = useState('dashboard');

  // Track hash changes so active state updates live
  useEffect(() => {
    const updateHash = () => {
      const hash = window.location.hash.replace('#', '') || 'dashboard';
      setCurrentHash(hash);
    };
    updateHash();
    window.addEventListener('hashchange', updateHash);
    return () => window.removeEventListener('hashchange', updateHash);
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const syncColors: Record<string, string> = {
    connecting: 'bg-amber-400',
    connected: 'bg-emerald-400',
    disconnected: 'bg-red-400',
  };

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-secondary text-white border-r border-black/20">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1.5 shrink-0">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfjJJYVXvfa6ht32dukVuAAxlQhVGtlozh8SeyZyOcRaNsap1YrcDEAuuC&s=10"
            alt="IRIS"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-500">
            IRIS
          </p>
          <p className="text-xs font-semibold truncate">Admin Console</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 text-sm overflow-y-auto scroll-thin">
        {ADMIN_TABS.map((group) => (
          <div key={group.group}>
            <p className="px-3 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">
              {group.group}
            </p>
            {group.items.map((item) => {
              const tabKey = item.href.split('#')[1] || 'dashboard';
              const active = currentHash === tabKey;

              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition',
                    active
                      ? 'bg-white/10 text-white font-semibold shadow-inner'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon name={item.icon} className="w-4 h-4" />
                  {item.label}
                  {'badge' in item && item.badge === 'live' && liveBadge > 0 && (
                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white">
                      {liveBadge}
                    </span>
                  )}
                  {'badge' in item && item.badge === 'sub' && subBadge && (
                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white">
                      !
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <div className="flex items-center gap-2 px-3 py-2 text-[10px] text-white/50">
          <span className={cn('w-1.5 h-1.5 rounded-full', syncColors[syncState])} />
          <span>
            IRIS-CBT ·{' '}
            {syncState === 'connected'
              ? 'Live'
              : syncState === 'disconnected'
              ? 'Offline'
              : 'Connecting…'}
          </span>
          <span className="ml-auto">v9.0</span>
        </div>
        <div className="px-3 py-1 text-[10px] text-white/40 truncate">
          {session?.name || '—'}
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-300/80 hover:bg-red-500/10 hover:text-red-200 transition text-sm"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}