'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { Icon } from '@/components/admin/Icon';
import { createClient } from '@/lib/supabase/client';
import { timeAgo } from '@/lib/utils';
import type { AuditLog } from '@/lib/types';

interface DashboardStats {
  students: number;
  teachers: number;
  questions: number;
  pendingBroadsheets: number;
}

export default function AdminPage() {
  const [currentTab, setCurrentTab] = useState('dashboard');

  // Track hash changes
  useEffect(() => {
    const updateHash = () => {
      const hash = window.location.hash.replace('#', '') || 'dashboard';
      setCurrentTab(hash);
    };
    updateHash();
    window.addEventListener('hashchange', updateHash);
    return () => window.removeEventListener('hashchange', updateHash);
  }, []);

  return (
    <div className="iris-watermark">
      {currentTab === 'dashboard' && <DashboardTab />}
      {currentTab === 'students' && <PlaceholderTab name="Students" />}
      {currentTab === 'teachers' && <PlaceholderTab name="Teachers" />}
      {currentTab === 'classes' && <PlaceholderTab name="Class Subjects" />}
      {currentTab === 'terms' && <PlaceholderTab name="Term Calendar" />}
      {currentTab === 'questions' && <PlaceholderTab name="Question Bank" />}
      {currentTab === 'exams' && <PlaceholderTab name="Exams" />}
      {currentTab === 'live-cbt' && <PlaceholderTab name="Live CBT Monitor" />}
      {currentTab === 'submissions' && <PlaceholderTab name="Submissions" />}
      {currentTab === 'reports' && <PlaceholderTab name="Broadsheets" />}
      {currentTab === 'audit' && <PlaceholderTab name="Audit Log" />}
      {currentTab === 'settings' && <PlaceholderTab name="Settings & Access" />}
      {currentTab === 'subscription' && <PlaceholderTab name="Subscription" />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD TAB
   ═══════════════════════════════════════════════════════════════ */
function DashboardTab() {
  const [stats, setStats] = useState<DashboardStats>({
    students: 0,
    teachers: 0,
    questions: 0,
    pendingBroadsheets: 0,
  });
  const [activity, setActivity] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const [
        { count: studentCount },
        { count: teacherCount },
        { count: questionCount },
        { data: bsRows },
        { data: logs },
      ] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('teachers').select('*', { count: 'exact', head: true }),
        supabase.from('questions').select('*', { count: 'exact', head: true }),
        supabase.from('broadsheets').select('id').eq('status', 'pending'),
        supabase
          .from('audit_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(8),
      ]);

      setStats({
        students: studentCount || 0,
        teachers: teacherCount || 0,
        questions: questionCount || 0,
        pendingBroadsheets: bsRows?.length || 0,
      });
      setActivity((logs as AuditLog[]) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Students"
          value={loading ? '…' : stats.students}
          accent="primary"
          icon={<Icon name="users" />}
        />
        <StatCard
          label="Teachers"
          value={loading ? '…' : stats.teachers}
          accent="emerald"
          icon={<Icon name="teacher" />}
        />
        <StatCard
          label="Questions"
          value={loading ? '…' : stats.questions}
          accent="purple"
          icon={<Icon name="help" />}
        />
        <StatCard
          label="Pending BS"
          value={loading ? '…' : stats.pendingBroadsheets}
          accent="amber"
          icon={<Icon name="grid" />}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card ring-1 ring-slate-200/70 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="font-semibold text-ink-900">Recent Activity</h2>
            <p className="text-xs text-ink-500 mt-0.5">Latest administrative actions.</p>
          </div>
          <ul className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto scroll-thin">
            {loading && (
              <li className="px-6 py-10 text-center text-xs text-ink-500 italic">
                Loading…
              </li>
            )}
            {!loading && activity.length === 0 && (
              <li className="px-6 py-10 text-center text-xs text-ink-500 italic">
                No activity yet.
              </li>
            )}
            {activity.map((a) => (
              <li key={a.id} className="px-6 py-3 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-primary-50 ring-1 ring-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="history" className="w-3.5 h-3.5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-ink-900 truncate">{a.action}</p>
                  <p className="text-[10px] text-ink-500">
                    {timeAgo(a.created_at)} · {a.actor_name || 'SYSTEM'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-2xl shadow-card ring-1 ring-slate-200/70 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="font-semibold text-ink-900">Class Distribution</h2>
            <p className="text-xs text-ink-500 mt-0.5">Roster send status.</p>
          </div>
          <div className="p-5">
            <p className="text-xs text-ink-500 italic text-center py-6">
              Coming soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PLACEHOLDER TAB — for tabs we build later
   ═══════════════════════════════════════════════════════════════ */
function PlaceholderTab({ name }: { name: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-card ring-1 ring-slate-200/70 p-12 text-center">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-50 ring-1 ring-primary-100 flex items-center justify-center">
        <Icon name="help" className="w-8 h-8 text-primary-600" />
      </div>
      <h2 className="mt-4 font-semibold text-ink-900 text-lg">{name}</h2>
      <p className="text-sm text-ink-500 mt-1">
        Coming in the next build phase.
      </p>
    </div>
  );
}