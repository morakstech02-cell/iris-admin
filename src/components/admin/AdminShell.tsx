'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { AdminShellMobileNav } from './AdminShellMobileNav';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { createClient } from '@/lib/supabase/client';
import type { AdminSession } from '@/lib/types';

interface AdminShellProps {
  session: AdminSession;
  children: ReactNode;
}

const TAB_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  students: 'Students Management',
  teachers: 'Teachers Management',
  classes: 'Class Subjects',
  terms: 'Term Calendar',
  questions: 'Question Bank',
  exams: 'Exams & Publishing',
  'live-cbt': 'Live CBT Monitor',
  submissions: 'Submissions Monitor',
  reports: 'Class Broadsheets',
  audit: 'Audit Log',
  settings: 'Settings & Access',
  subscription: 'Subscription & Billing',
};

export function AdminShell({ session, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [syncState, setSyncState] = useState<'connecting' | 'connected' | 'disconnected'>(
    'connecting'
  );
  const [liveBadge, setLiveBadge] = useState(0);
  const [subBadge, setSubBadge] = useState(false);
  const [currentHash, setCurrentHash] = useState('dashboard');
  const supabase = createClient();

  // Track hash changes
  useEffect(() => {
    const updateHash = () => {
      const hash = window.location.hash.replace('#', '') || 'dashboard';
      setCurrentHash(hash);
    };
    updateHash();
    window.addEventListener('hashchange', updateHash);
    return () => window.removeEventListener('hashchange', updateHash);
  }, []);

  // Realtime live badge
  useEffect(() => {
    let mounted = true;

    const fetchCounts = async () => {
      const { count: liveCount } = await supabase
        .from('exam_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress');
      if (mounted) setLiveBadge(liveCount || 0);
    };

    fetchCounts();

    const channel = supabase
      .channel('admin-shell')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exam_attempts' },
        () => fetchCounts()
      )
      .subscribe((status) => {
        if (!mounted) return;
        setSyncState(
          status === 'SUBSCRIBED'
            ? 'connected'
            : status === 'CLOSED'
            ? 'disconnected'
            : 'connecting'
        );
      });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const pageTitle = TAB_TITLES[currentHash] || 'Dashboard';

  return (
    <div className="min-h-screen lg:flex bg-slate-100">
      <Sidebar
        session={session}
        liveBadge={liveBadge}
        subBadge={subBadge}
        syncState={syncState}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <Header
          session={session}
          pageTitle={pageTitle}
          onToggleMobileNav={() => setMobileOpen((o) => !o)}
        />

        <AdminShellMobileNav
          open={mobileOpen}
          currentHash={currentHash}
          onClose={() => setMobileOpen(false)}
        />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] w-full mx-auto">
          {children}
        </main>

        <footer className="px-6 lg:px-8 py-4 text-center text-[11px] text-ink-500 border-t border-slate-200 bg-white/50">
          Ibadu Rahman International School · Admin Console v9.0 ·{' '}
          {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}