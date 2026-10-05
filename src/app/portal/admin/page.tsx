'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

/* ═══════════════════════════════════════════════════════════════
   SUPABASE
   ═══════════════════════════════════════════════════════════════ */
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
const SESSION_KEY = 'iris.admin.session';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const LOCK_POLL_MS = 60 * 1000;
const LIVE_REFRESH_MS = 30 * 1000;

const JSS_CLASSES = ['JSS1', 'JSS2', 'JSS3'];
const SS_CLASSES = ['SS1', 'SS2', 'SS3'];
const ALL_CLASSES = [...JSS_CLASSES, ...SS_CLASSES];
const STREAMS = ['Science', 'Arts', 'Commercial'];

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

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  class_review: 'Class Review',
  class_approved: 'Class Approved',
  class_rejected: 'Rejected by Class',
  admin_approved: 'Approved',
  admin_rejected: 'Rejected by Admin',
};

const STATUS_TONES: Record<string, string> = {
  draft: 'bg-slate-100 text-ink-600 ring-slate-200',
  submitted: 'bg-blue-50 text-blue-700 ring-blue-200',
  class_review: 'bg-amber-50 text-amber-700 ring-amber-200',
  class_approved: 'bg-purple-50 text-purple-700 ring-purple-200',
  class_rejected: 'bg-red-50 text-red-700 ring-red-200',
  admin_approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  admin_rejected: 'bg-red-50 text-red-700 ring-red-200',
};

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */
type AdminSession = { id: string; email: string; adminId: string; name: string; role: string; lastActive: number };
type Student = { id: string; adm: string; fullname: string; dob: string | null; gender: string | null; class: string; stream: string | null; cbt_password: string; created_at: string };
type Teacher = { id: string; staff_id: string; fullname: string; email: string; role_type: 'class' | 'subject' | 'both'; assigned_class: string | null; assigned_stream: string | null; status: 'active' | 'suspended'; created_at: string };
type TeacherSubject = { id: string; teacher_id: string; class: string; stream: string | null; subject: string };
type ClassSubject = { id: string; class: string; stream: string | null; subject: string; obj_max: number; theory_max: number; ca_max: number; display_order: number };
type TermSetting = { id: string; session: string; term: string; start_date: string | null; end_date: string | null; next_term_begins: string | null; days_school_opened: number; is_current: boolean };
type Question = { id: string; subject: string; class: string; type: string; prompt: string; options: string[]; correct_index: number; marks: number };
type Exam = { id: string; title: string; subject: string; class: string; duration: number; status: string; created_at: string };
type Roster = { id: string; class: string; stream: string | null; teacher_name: string; student_count: number; sent_by: string; sent_at: string; ack: boolean };
type Broadsheet = { id: string; class: string; stream: string | null; term: string; session: string; student_count: number; status: string; submitted_by: string | null; submitted_at: string | null; approved_by: string | null; approved_at: string | null; rejection_note?: string | null };
type ScoreSubmission = { id: string; class: string; stream: string | null; subject: string; term: string; teacher_name: string; status: string; submitted_at: string | null };
type LiveAttempt = { id: number; student_id: string; student_name: string | null; student_adm: string | null; exam_title: string | null; subject: string | null; class: string; stream: string | null; status: string; current_question: number; total_questions: number; score: number; max_score: number; flags: number; started_at: string; last_activity_at: string; submitted_at: string | null };
type AuditItem = { id?: number; action: string; detail?: string; actor_name?: string; actor_id?: string; created_at: string };
type SubAdmin = { id: string; admin_id: string; name: string; password: string; role: string; status: string; created_at: string };
type BulkStudentRow = { idx: number; fullname: string; dob: string; gender: string; cls: string; stream: string | null; adm: string; errors: string[] };
type BulkQuestionRow = { idx: number; subject: string; cls: string; type: string; question: string; a: string; b: string; c: string; d: string; correct: string; marks: number; errors: string[] };
type SubscriptionData = { school: any; payments: any[]; bankAccounts: any[]; settings: Record<string, string> };

/* ═══════════════════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════════════════ */
function escapeHtml(s: any): string {
  return String(s ?? '').replace(/[&<>"']/g, (c: string) => (({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }) as any)[c]);
}
function initialsOf(name?: string | null): string {
  return ((name || '').replace(/[^A-Za-z\s]/g, '').trim().split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()) || '--';
}
function formatNaira(n: any): string { return '₦' + Number(n || 0).toLocaleString('en-NG'); }
function formatDate(d?: string | null): string { if (!d) return '—'; return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
function timeAgo(ts?: string | null): string {
  if (!ts) return '—';
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function parseCSVLine(line: string): string[] {
  const out: string[] = []; let cur = ''; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === ',' && !inQ) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map((x) => x.trim());
}
function generateCBTPassword(surname?: string): string {
  const base = (surname || 'User').replace(/[^A-Za-z]/g, '').slice(0, 8) || 'User';
  const cap = base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
  const buf = new Uint8Array(4); crypto.getRandomValues(buf);
  let suffix = ''; for (let i = 0; i < 4; i++) suffix += String(buf[i] % 10);
  return `${cap}${suffix}`;
}
function generateTeacherPassword(fullname: string): string {
  const clean = fullname.replace(/^(Dr|Mr|Mrs|Ms|Miss)\.?\s+/i, '');
  const surname = clean.split(/[\s,]+/)[0] || 'Staff';
  const cap = surname.charAt(0).toUpperCase() + surname.slice(1).toLowerCase();
  const buf = new Uint8Array(4); crypto.getRandomValues(buf);
  let suffix = ''; for (let i = 0; i < 4; i++) suffix += String(buf[i] % 10);
  return `${cap}${suffix}`;
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS (Toast, Confirm, Log)
   ═══════════════════════════════════════════════════════════════ */
type ToastTone = 'success' | 'error' | 'info' | 'warn';
function showToast(msg: string, tone: ToastTone = 'success') {
  const tones: Record<ToastTone, string> = { success: 'border-emerald-500', error: 'border-red-500', info: 'border-primary-500', warn: 'border-amber-500' };
  let container = document.getElementById('iris-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'iris-toast-container';
    container.className = 'fixed bottom-6 right-6 z-[200] space-y-3 pointer-events-none';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = `pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-pop border-l-4 bg-ink-900 text-white ${tones[tone]} fade-in text-xs font-medium max-w-sm`;
  el.innerHTML = `<span class="w-4 h-4 shrink-0 mt-0.5 rounded-full bg-white/10 flex items-center justify-center font-bold text-[10px]">${tone === 'success' ? '✓' : '!'}</span><div class="flex-1">${msg}</div>`;
  container.appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .3s, transform .3s'; el.style.opacity = '0'; el.style.transform = 'translateY(6px)'; setTimeout(() => el.remove(), 300); }, 3400);
}
function openConfirm(title: string, message: string, onConfirm: () => void) {
  const existing = document.getElementById('iris-confirm-modal'); if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = 'iris-confirm-modal';
  overlay.className = 'fixed inset-0 z-[110] bg-ink-900/70 backdrop-blur-sm flex items-center justify-center p-4';
  overlay.innerHTML = `
    <div class="bg-white rounded-2xl shadow-pop ring-1 ring-slate-200 max-w-sm w-full p-6 fade-in">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-full bg-red-50 ring-1 ring-red-200 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 0 0-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"/></svg>
        </div>
        <div class="flex-1">
          <h3 class="font-semibold text-ink-900">${escapeHtml(title)}</h3>
          <p class="text-xs text-ink-500 mt-1">${escapeHtml(message)}</p>
        </div>
      </div>
      <div class="mt-5 flex justify-end gap-2">
        <button id="iris-confirm-cancel" class="px-4 py-2 rounded-xl text-xs font-semibold text-ink-700 hover:bg-slate-100 transition">Cancel</button>
        <button id="iris-confirm-ok" class="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm transition">Confirm</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#iris-confirm-cancel')?.addEventListener('click', () => overlay.remove());
  overlay.querySelector('#iris-confirm-ok')?.addEventListener('click', () => { overlay.remove(); onConfirm(); });
}
async function logAction(action: string, detail: string = '') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: profile } = await supabase.rpc('get_my_admin_profile');
  const actor = profile?.[0];
  await supabase.from('audit_log').insert({ action, detail, actor_id: actor?.admin_id || 'SYSTEM', actor_name: actor?.name || 'Unknown', actor_type: 'admin' });
}

/* ═══════════════════════════════════════════════════════════════
   ICON
   ═══════════════════════════════════════════════════════════════ */
function Icon({ name, className = 'w-4 h-4' }: { name: string; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    dashboard: (<><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></>),
    users: (<path d="M17 20h5v-2a4 4 0 0 0-3-3.87M9 20H4v-2a4 4 0 0 1 3-3.87M16 3.13a4 4 0 0 1 0 7.75M12 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />),
    teacher: (<><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14v7" /><path d="M5 11v5c0 1 3 3 7 3s7-2 7-3v-5" /></>),
    list: <path d="M4 6h16M4 10h16M4 14h16M4 18h16" />,
    calendar: (<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>),
    help: (<><circle cx="12" cy="12" r="9" /><path d="M9.1 9a3 3 0 1 1 5.83 1c0 2-3 2-3 4" /><path d="M12 17h.01" /></>),
    clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
    radio: (<><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" fill="currentColor" /></>),
    wave: <path d="M3 12h4l3 9 4-18 3 9h4" />,
    grid: (<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></>),
    history: <path d="M12 8v4l3 3M3.05 11a9 9 0 1 1 .5 4M3 4v5h5" />,
    cog: (<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>),
    card: (<><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>),
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    lock: (<><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>),
  };
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">{paths[name] || paths.dashboard}</svg>;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function AdminPage() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [syncState, setSyncState] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [liveBadge, setLiveBadge] = useState(0);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [showPortalLocked, setShowPortalLocked] = useState(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>([]);
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [termSettings, setTermSettings] = useState<TermSetting[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [auditLog, setAuditLog] = useState<AuditItem[]>([]);
  const [rosterBatches, setRosterBatches] = useState<Roster[]>([]);
  const [broadsheetApprovals, setBroadsheetApprovals] = useState<Broadsheet[]>([]);
  const [scoreSubmissions, setScoreSubmissions] = useState<ScoreSubmission[]>([]);
  const [liveAttempts, setLiveAttempts] = useState<LiveAttempt[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionData>({ school: null, payments: [], bankAccounts: [], settings: {} });

  const lockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mainRealtimeRef = useRef<any>(null);

  /* ── BOOT ── */
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.user) { if (mounted) setAuthChecked(true); return; }
      const { data: profile } = await supabase.rpc('get_my_admin_profile');
      if (!profile?.[0]) { await supabase.auth.signOut(); if (mounted) setAuthChecked(true); return; }
      if (mounted) {
        setSession({ id: authSession.user.id, email: authSession.user.email!, adminId: profile[0].admin_id, name: profile[0].name, role: profile[0].role, lastActive: Date.now() });
        setAuthChecked(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  /* ── LOCK POLLING ── */
  useEffect(() => {
    if (!session) return;
    const check = async () => {
      try {
        const { data: globalData } = await supabase.from('platform_settings').select('key, value').in('key', ['global_lock', 'global_lock_message']);
        const gmap: Record<string, string> = {};
        (globalData || []).forEach((r: any) => (gmap[r.key] = r.value));
        if (gmap.global_lock === 'true') { setMaintenanceMessage(gmap.global_lock_message || 'Scheduled maintenance.'); setShowMaintenance(true); } else setShowMaintenance(false);
        const { data: schoolData } = await supabase.from('schools').select('portal_locked').eq('slug', 'iris').maybeSingle();
        setShowPortalLocked(!!schoolData?.portal_locked);
      } catch (e) { console.warn('[IRIS] lock check:', e); }
    };
    check();
    lockTimerRef.current = setInterval(check, LOCK_POLL_MS);
    return () => { if (lockTimerRef.current) clearInterval(lockTimerRef.current); };
  }, [session]);

  /* ── DATA LOAD ── */
  useEffect(() => {
    if (!session) return;
    (async () => {
      const [studentsRes, teachersRes, teacherSubjectsRes, subAdminsRes, classSubjectsRes, termSettingsRes, questionsRes, examsRes, auditRes, rostersRes, broadsheetsRes, submissionsRes] = await Promise.all([
        supabase.from('students').select('*').order('created_at', { ascending: false }),
        supabase.from('teachers').select('*').order('created_at', { ascending: false }),
        supabase.from('teacher_subjects').select('*'),
        supabase.from('sub_admins').select('*').order('created_at', { ascending: false }),
        supabase.from('class_subjects').select('*').order('display_order'),
        supabase.from('term_settings').select('*').order('term'),
        supabase.from('questions').select('*').order('created_at', { ascending: false }),
        supabase.from('exams').select('*').order('created_at', { ascending: false }),
        supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('rosters').select('*').order('sent_at', { ascending: false }),
        supabase.from('broadsheets').select('*').order('class'),
        supabase.from('score_submissions').select('*').order('created_at', { ascending: false }),
      ]);
      setStudents((studentsRes.data as Student[]) || []);
      setTeachers((teachersRes.data as Teacher[]) || []);
      setTeacherSubjects((teacherSubjectsRes.data as TeacherSubject[]) || []);
      setSubAdmins((subAdminsRes.data as SubAdmin[]) || []);
      setClassSubjects((classSubjectsRes.data as ClassSubject[]) || []);
      setTermSettings((termSettingsRes.data as TermSetting[]) || []);
      setQuestions((questionsRes.data as Question[]) || []);
      setExams((examsRes.data as Exam[]) || []);
      setAuditLog((auditRes.data as AuditItem[]) || []);
      setRosterBatches((rostersRes.data as Roster[]) || []);
      setBroadsheetApprovals((broadsheetsRes.data as Broadsheet[]) || []);
      setScoreSubmissions((submissionsRes.data as ScoreSubmission[]) || []);
      setSyncState('connected');
    })();

    // Subscription
    (async () => {
      try {
        const { data: schoolRow } = await supabase.from('schools').select('*').eq('slug', 'iris').maybeSingle();
        let payments: any[] = [];
        if (schoolRow?.id) {
          const { data: p } = await supabase.from('subscription_payments').select('*').eq('school_id', schoolRow.id).order('submitted_at', { ascending: false });
          payments = p || [];
        }
        const { data: bank } = await supabase.from('payment_accounts').select('*').eq('is_active', true).order('display_order');
        const { data: settingsData } = await supabase.from('platform_settings').select('*');
        const settings: Record<string, string> = {};
        (settingsData || []).forEach((s: any) => (settings[s.key] = s.value));
        setSubscription({ school: schoolRow || null, payments, bankAccounts: bank || [], settings });
      } catch (e) { console.warn('[IRIS] subscription load:', e); }
    })();

    // Realtime
    if (mainRealtimeRef.current) supabase.removeChannel(mainRealtimeRef.current);
    mainRealtimeRef.current = supabase.channel('iris-admin-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_attempts' }, () => {
        supabase.from('exam_attempts').select('*', { count: 'exact', head: true }).eq('status', 'in_progress').then(({ count }) => setLiveBadge(count || 0));
        supabase.from('exam_attempts').select('*').order('last_activity_at', { ascending: false }).limit(200).then((r) => setLiveAttempts((r.data as LiveAttempt[]) || []));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'broadsheets' }, () => supabase.from('broadsheets').select('*').order('class').then((r) => setBroadsheetApprovals((r.data as Broadsheet[]) || [])))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'score_submissions' }, () => supabase.from('score_submissions').select('*').order('created_at', { ascending: false }).then((r) => setScoreSubmissions((r.data as ScoreSubmission[]) || [])))
      .subscribe((status) => setSyncState(status === 'SUBSCRIBED' ? 'connected' : status === 'CLOSED' ? 'disconnected' : 'connecting'));

    return () => { if (mainRealtimeRef.current) supabase.removeChannel(mainRealtimeRef.current); };
  }, [session]);

  /* ── LOGIN ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim().toLowerCase();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const btn = form.querySelector('button[type=submit]') as HTMLButtonElement;
    if (btn) { btn.disabled = true; btn.textContent = 'Authenticating…'; }
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      const { data: profile, error: profileError } = await supabase.rpc('get_my_admin_profile');
      if (profileError) throw profileError;
      if (!profile?.[0]) { await supabase.auth.signOut(); throw new Error('Your account is not an active admin.'); }
      setSession({ id: authData.user.id, email: authData.user.email!, adminId: profile[0].admin_id, name: profile[0].name, role: profile[0].role, lastActive: Date.now() });
    } catch (err: any) {
      alert(err.message || 'Login failed.');
      if (btn) { btn.disabled = false; btn.textContent = 'Authenticate & Enter'; }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    router.refresh();
  };

  /* ── STATES ── */
  if (!authChecked) return <div className="min-h-screen flex items-center justify-center bg-slate-100"><p className="text-sm text-ink-500">Loading IRIS Admin…</p></div>;

  if (showMaintenance) return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#0A0A1A] p-4 text-center">
      <div className="max-w-lg"><h1 className="font-serif text-2xl text-white">Scheduled Maintenance</h1><p className="text-sm text-slate-300 mt-2">{maintenanceMessage}</p></div>
    </div>
  );

  if (showPortalLocked) return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#0F0518] p-4 text-center">
      <div className="max-w-lg"><h1 className="font-serif text-2xl text-white">Portal Temporarily Locked</h1><p className="text-sm text-slate-300 mt-2">Contact morakstech02@gmail.com or 09152625084.</p></div>
    </div>
  );

  if (!session) return (
    <div className="admin-login-bg fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-[420px] fade-in py-4">
        <div className="text-center mb-5">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-white ring-1 ring-white/20 shadow-pop flex items-center justify-center p-2.5">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfjJJYVXvfa6ht32dukVuAAxlQhVGtlozh8SeyZyOcRaNsap1YrcDEAuuC&s=10" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="mt-4 font-serif text-lg text-white">Ibadu Rahman International School</h1>
          <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-accent-500 font-semibold">Administrative Gateway</p>
        </div>
        <div className="bg-white rounded-2xl shadow-pop ring-1 ring-slate-200 overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-slate-100">
            <h2 className="font-semibold text-ink-900 text-base">Sign In</h2>
            <p className="text-xs text-ink-500 mt-0.5">Use your admin email & password.</p>
          </div>
          <form onSubmit={handleLogin} className="px-6 py-5 space-y-3.5">
            <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Email</label>
              <input name="email" type="email" required placeholder="admin@iris.edu.ng" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500/20 outline-none" /></div>
            <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Password</label>
              <input name="password" type="password" required placeholder="••••••••" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500/20 outline-none" /></div>
            <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl text-sm shadow-sm disabled:opacity-60">Authenticate &amp; Enter</button>
          </form>
        </div>
      </div>
    </div>
  );

  /* ── SHELL ── */
  return (
    <div className="min-h-screen lg:flex bg-slate-100">
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-secondary text-white border-r border-black/20">
        <div className="px-5 py-5 flex items-center gap-3 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1.5 shrink-0">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfjJJYVXvfa6ht32dukVuAAxlQhVGtlozh8SeyZyOcRaNsap1YrcDEAuuC&s=10" className="w-full h-full object-contain" alt="IRIS" />
          </div>
          <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-500">IRIS</p><p className="text-xs font-semibold truncate">Admin Console</p></div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 text-sm overflow-y-auto scroll-thin">
          <SidebarNav currentTab={currentTab} setCurrentTab={setCurrentTab} liveBadge={liveBadge} />
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1">
          <div className="flex items-center gap-2 px-3 py-2 text-[10px] text-white/50">
            <span className={`w-1.5 h-1.5 rounded-full ${syncState === 'connected' ? 'bg-emerald-400' : syncState === 'disconnected' ? 'bg-red-400' : 'bg-amber-400 animate-pulse'}`} />
            <span>IRIS-CBT · {syncState === 'connected' ? 'Live' : syncState === 'disconnected' ? 'Offline' : 'Connecting…'}</span>
            <span className="ml-auto">v9.0</span>
          </div>
          <div className="px-3 py-1 text-[10px] text-white/40 truncate">{session.name}</div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-300/80 hover:bg-red-500/10 hover:text-red-200 transition text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-slate-200">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => setMobileNavOpen((o) => !o)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100"><Icon name="menu" className="w-5 h-5" /></button>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Academic Session · 2025/2026</p>
                <h1 className="text-sm sm:text-base font-semibold text-ink-900 truncate">{TAB_TITLES[currentTab] || 'Dashboard'}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="text-right leading-tight">
                  <p className="text-xs font-semibold text-ink-900">{session.name}</p>
                  <p className="text-[10px] text-ink-500">{session.role === 'master' ? 'Full System Access' : `Sub-Admin · ${session.role}`}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-primary-600 ring-2 ring-primary-500/20 text-white flex items-center justify-center text-xs font-bold">{initialsOf(session.name)}</div>
              </div>
            </div>
          </div>
          {mobileNavOpen && (
            <div className="lg:hidden border-t border-slate-200 bg-white px-3 py-2 overflow-x-auto scroll-thin">
              <div className="flex gap-1.5 min-w-max"><MobileNav currentTab={currentTab} setCurrentTab={setCurrentTab} /></div>
            </div>
          )}
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] w-full mx-auto">
          {currentTab === 'dashboard' && <DashboardTab students={students} teachers={teachers} questions={questions} broadsheetApprovals={broadsheetApprovals} auditLog={auditLog} rosterBatches={rosterBatches} setCurrentTab={setCurrentTab} />}
          {currentTab === 'students' && <StudentsTab students={students} setStudents={setStudents} teachers={teachers} rosterBatches={rosterBatches} setRosterBatches={setRosterBatches} session={session} />}
          {currentTab === 'teachers' && <TeachersTab teachers={teachers} setTeachers={setTeachers} teacherSubjects={teacherSubjects} setTeacherSubjects={setTeacherSubjects} classSubjects={classSubjects} session={session} />}
          {currentTab === 'classes' && <ClassesTab classSubjects={classSubjects} setClassSubjects={setClassSubjects} />}
          {currentTab === 'terms' && <TermsTab termSettings={termSettings} setTermSettings={setTermSettings} />}
          {currentTab === 'questions' && <QuestionsTab questions={questions} setQuestions={setQuestions} session={session} />}
          {currentTab === 'exams' && <ExamsTab exams={exams} setExams={setExams} session={session} />}
          {currentTab === 'live-cbt' && <LiveCbtTab students={students} session={session} />}
          {currentTab === 'submissions' && <SubmissionsTab submissions={scoreSubmissions} setSubmissions={setScoreSubmissions} session={session} />}
          {currentTab === 'reports' && <BroadsheetsTab broadsheets={broadsheetApprovals} setBroadsheets={setBroadsheetApprovals} students={students} classSubjects={classSubjects} session={session} />}
          {currentTab === 'audit' && <AuditTab auditLog={auditLog} setAuditLog={setAuditLog} />}
          {currentTab === 'settings' && <SettingsTab subAdmins={subAdmins} setSubAdmins={setSubAdmins} session={session} />}
          {currentTab === 'subscription' && <SubscriptionTab subscription={subscription} setSubscription={setSubscription} session={session} />}
        </main>

        <footer className="px-6 lg:px-8 py-4 text-center text-[11px] text-ink-500 border-t border-slate-200 bg-white/50">
          Ibadu Rahman International School · Admin Console v9.0 · {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR NAV
   ═══════════════════════════════════════════════════════════════ */
function SidebarNav({ currentTab, setCurrentTab, liveBadge }: { currentTab: string; setCurrentTab: (t: string) => void; liveBadge: number }) {
  const groups = [
    { group: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard', icon: 'dashboard' }] },
    { group: 'People', items: [{ id: 'students', label: 'Students', icon: 'users' }, { id: 'teachers', label: 'Teachers', icon: 'teacher' }] },
    { group: 'Academics', items: [
      { id: 'classes', label: 'Class Subjects', icon: 'list' },
      { id: 'terms', label: 'Term Calendar', icon: 'calendar' },
      { id: 'questions', label: 'Question Bank', icon: 'help' },
      { id: 'exams', label: 'Exams', icon: 'clock' },
    ] },
    { group: 'Live & Review', items: [
      { id: 'live-cbt', label: 'Live CBT Monitor', icon: 'radio', badge: 'live' },
      { id: 'submissions', label: 'Submissions', icon: 'wave' },
      { id: 'reports', label: 'Broadsheets', icon: 'grid' },
    ] },
    { group: 'System', items: [
      { id: 'audit', label: 'Audit Log', icon: 'history' },
      { id: 'settings', label: 'Settings & Access', icon: 'cog' },
      { id: 'subscription', label: 'Subscription', icon: 'card' },
    ] },
  ];
  return (
    <>
      {groups.map((g) => (
        <div key={g.group}>
          <p className="px-3 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">{g.group}</p>
          {g.items.map((item) => {
            const active = currentTab === item.id;
            return (
              <button key={item.id} onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${active ? 'bg-white/10 text-white font-semibold shadow-inner' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                <Icon name={item.icon} className="w-4 h-4" />
                {item.label}
                {item.badge === 'live' && liveBadge > 0 && (<span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white">{liveBadge}</span>)}
              </button>
            );
          })}
        </div>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MOBILE NAV
   ═══════════════════════════════════════════════════════════════ */
function MobileNav({ currentTab, setCurrentTab }: { currentTab: string; setCurrentTab: (t: string) => void }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard' }, { id: 'students', label: 'Students' }, { id: 'teachers', label: 'Teachers' },
    { id: 'classes', label: 'Classes' }, { id: 'terms', label: 'Terms' }, { id: 'questions', label: 'Questions' },
    { id: 'exams', label: 'Exams' }, { id: 'live-cbt', label: 'Live CBT' }, { id: 'submissions', label: 'Submissions' },
    { id: 'reports', label: 'Broadsheets' }, { id: 'audit', label: 'Audit' }, { id: 'settings', label: 'Settings' },
    { id: 'subscription', label: 'Subscription' },
  ];
  return (
    <>
      {items.map((item) => (
        <button key={item.id} onClick={() => setCurrentTab(item.id)}
          className={`whitespace-nowrap px-3 py-2 rounded-lg text-xs font-medium transition ${currentTab === item.id ? 'bg-primary-600 text-white' : 'text-ink-700 hover:bg-slate-100'}`}>
          {item.label}
        </button>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════════════════ */
function DashboardTab({ students, teachers, questions, broadsheetApprovals, auditLog, rosterBatches, setCurrentTab }: {
  students: Student[]; teachers: Teacher[]; questions: Question[]; broadsheetApprovals: Broadsheet[];
  auditLog: AuditItem[]; rosterBatches: Roster[]; setCurrentTab: (t: string) => void;
}) {
  const groups = (() => {
    const map = new Map<string, { cls: string; stream: string | null; count: number }>();
    students.forEach((s) => { const key = `${s.class}||${s.stream || ''}`; if (!map.has(key)) map.set(key, { cls: s.class, stream: s.stream, count: 0 }); map.get(key)!.count++; });
    return [...map.values()].sort((a, b) => `${a.cls}${a.stream || ''}`.localeCompare(`${b.cls}${b.stream || ''}`));
  })();
  return (
    <div className="iris-watermark space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Students', value: students.length, icon: 'users' },
          { label: 'Teachers', value: teachers.length, icon: 'teacher' },
          { label: 'Questions', value: questions.length, icon: 'help' },
          { label: 'Pending BS', value: broadsheetApprovals.filter((b) => b.status === 'pending').length, icon: 'grid' },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-2xl p-5 shadow-card ring-1 ring-slate-200/70">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">{c.label}</p>
              <Icon name={c.icon} className="w-4 h-4 text-primary-600" />
            </div>
            <p className="text-2xl font-bold text-ink-900 mt-1">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card ring-1 ring-slate-200/70 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div><h2 className="font-semibold text-ink-900">Recent Activity</h2><p className="text-xs text-ink-500 mt-0.5">Latest administrative actions.</p></div>
            <button onClick={() => setCurrentTab('audit')} className="text-xs font-semibold text-primary-600 hover:text-primary-700">View all →</button>
          </div>
          <ul className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto scroll-thin">
            {!auditLog.length && <li className="px-6 py-10 text-center text-xs text-ink-500 italic">No activity yet.</li>}
            {auditLog.slice(0, 8).map((a, i) => (
              <li key={i} className="px-6 py-3 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-primary-50 ring-1 ring-primary-100 flex items-center justify-center shrink-0 mt-0.5"><Icon name="history" className="w-3.5 h-3.5 text-primary-600" /></div>
                <div className="flex-1 min-w-0"><p className="text-xs font-medium text-ink-900 truncate">{a.action}</p><p className="text-[10px] text-ink-500">{timeAgo(a.created_at)} · {a.actor_name || 'SYSTEM'}</p></div>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-2xl shadow-card ring-1 ring-slate-200/70 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100"><h2 className="font-semibold text-ink-900">Class Distribution</h2><p className="text-xs text-ink-500 mt-0.5">Roster send status.</p></div>
          <ul className="p-4 space-y-2.5 text-xs">
            {!groups.length && <li className="text-center py-6 text-xs text-ink-500 italic">No classes yet.</li>}
            {groups.map((g) => {
              const batch = rosterBatches.find((b) => b.class === g.cls && (b.stream || null) === (g.stream || null));
              const status = !batch ? 'Not Sent' : batch.ack ? 'Acknowledged' : 'Sent';
              const tone = status === 'Acknowledged' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : status === 'Sent' ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-slate-100 text-ink-600 ring-slate-200';
              return (
                <li key={`${g.cls}-${g.stream}`} className="flex items-center justify-between gap-2">
                  <span className="text-ink-700 truncate">{g.cls}{g.stream ? ' ' + g.stream : ''}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tone} ring-1 whitespace-nowrap`}>{g.count} · {status}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STUDENTS
   ═══════════════════════════════════════════════════════════════ */
function StudentsTab({ students, setStudents, teachers, rosterBatches, setRosterBatches, session }: {
  students: Student[]; setStudents: (s: Student[]) => void; teachers: Teacher[];
  rosterBatches: Roster[]; setRosterBatches: (r: Roster[]) => void; session: AdminSession;
}) {
  const [studentSearch, setStudentSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStream, setFilterStream] = useState('');
  const [bulkRows, setBulkRows] = useState<BulkStudentRow[]>([]);
  const [streamVisible, setStreamVisible] = useState(false);

  const filteredStudents = students.filter((s) => (s.fullname.toLowerCase().includes(studentSearch.toLowerCase()) || s.adm.toLowerCase().includes(studentSearch.toLowerCase())) && (!filterClass || s.class === filterClass) && (!filterStream || s.stream === filterStream));

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fullname = (form.elements.namedItem('fullname') as HTMLInputElement).value.trim();
    const dob = (form.elements.namedItem('dob') as HTMLInputElement).value;
    const gender = (form.elements.namedItem('gender') as HTMLSelectElement).value;
    const cls = (form.elements.namedItem('class') as HTMLSelectElement).value;
    const stream = SS_CLASSES.includes(cls) ? (form.elements.namedItem('stream') as HTMLSelectElement).value : null;
    const adm = (form.elements.namedItem('adm') as HTMLInputElement).value.trim();
    if (!fullname || !adm) return showToast('Name and admission number required.', 'error');
    if (SS_CLASSES.includes(cls) && !stream) return showToast('Stream required for SS classes.', 'error');
    if (students.some((s) => s.adm === adm)) return showToast('Admission number already exists.', 'error');
    let surname = fullname.split(',')[0].trim().split(' ')[0];
    surname = surname.charAt(0).toUpperCase() + surname.slice(1).toLowerCase();
    const cbt_password = generateCBTPassword(surname);
    const { error } = await supabase.from('students').insert({ adm, fullname, dob, gender, class: cls, stream, cbt_password });
    if (error) return showToast('Insert failed: ' + error.message, 'error');
    const { data } = await supabase.from('students').select('*').order('created_at', { ascending: false });
    setStudents(data || []);
    await logAction('Student registered', `${fullname} · ${adm} · ${cls}${stream ? ' ' + stream : ''}`);
    showToast(`Registered <b>${escapeHtml(fullname)}</b>. CBT password: <span class="font-mono font-bold">${cbt_password}</span>`);
    form.reset(); setStreamVisible(false);
  };

  const handleDeleteStudent = (id: string) => {
    const s = students.find((x) => x.id === id); if (!s) return;
    openConfirm('Remove Student?', `Permanently remove ${s.fullname} (${s.adm})?`, async () => {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) return showToast('Delete failed: ' + error.message, 'error');
      const { data } = await supabase.from('students').select('*').order('created_at', { ascending: false });
      setStudents(data || []);
      await logAction('Student removed', `${s.fullname} · ${s.adm}`);
      showToast('Student removed.', 'warn');
    });
  };

  const downloadTemplate = () => {
    const csv = 'fullname,dob,gender,class,stream,adm\n' +
      '"Yusuf, Amina Bello",2010-08-22,Female,SS2,Science,IRIS/2026/001\n' +
      '"Olawale, Tunde Rahman",2009-11-04,Male,SS2,Commercial,IRIS/2026/002\n' +
      '"Adeyemi, Bola Grace",2012-03-15,Female,JSS2,,IRIS/2026/003\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'IRIS_Student_Template.csv'; a.click();
    URL.revokeObjectURL(url);
    logAction('Student template downloaded');
    showToast('CSV template downloaded.', 'info');
  };

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const lines = String(reader.result).split(/\r?\n/).filter((l) => l.trim());
      const parsed: BulkStudentRow[] = [];
      lines.forEach((line, idx) => {
        if (idx === 0 && line.toLowerCase().includes('fullname')) return;
        const [fullname, dob, gender, cls, stream, adm] = parseCSVLine(line);
        const errors: string[] = [];
        if (!fullname) errors.push('Missing name');
        if (!adm) errors.push('Missing adm');
        if (!cls || !ALL_CLASSES.includes(cls)) errors.push('Invalid class');
        const isSS = SS_CLASSES.includes(cls);
        if (isSS && !stream) errors.push('Stream required for SS');
        if (!isSS && stream) errors.push('JSS must have empty stream');
        if (gender && !['Male', 'Female'].includes(gender)) errors.push('Invalid gender');
        if (students.some((s) => s.adm === adm)) errors.push('Adm exists');
        if (parsed.some((r) => r.adm === adm)) errors.push('Duplicate in file');
        parsed.push({ idx: parsed.length + 1, fullname, dob, gender, cls, stream: stream || null, adm, errors });
      });
      setBulkRows(parsed);
    };
    reader.readAsText(file);
  };

  const confirmBulkImport = async () => {
    const valid = bulkRows.filter((r) => !r.errors.length);
    if (!valid.length) return;
    const payload = valid.map((r) => {
      let surname = (r.fullname || '').split(',')[0].trim().split(' ')[0];
      surname = surname.charAt(0).toUpperCase() + surname.slice(1).toLowerCase();
      return { adm: r.adm, fullname: r.fullname, dob: r.dob || null, gender: r.gender || null, class: r.cls, stream: r.stream, cbt_password: generateCBTPassword(surname) };
    });
    const { error } = await supabase.from('students').insert(payload);
    if (error) return showToast('Import failed: ' + error.message, 'error');
    const { data } = await supabase.from('students').select('*').order('created_at', { ascending: false });
    setStudents(data || []);
    await logAction('Bulk student import', `${valid.length} students added`);
    showToast(`${valid.length} students imported.`);
    setBulkRows([]);
  };

  const findClassTeacher = (cls: string, stream: string | null) => teachers.find((t) => (t.role_type === 'class' || t.role_type === 'both') && t.assigned_class === cls && (t.assigned_stream || null) === (stream || null));

  const groups = (() => {
    const map = new Map<string, { cls: string; stream: string | null; count: number }>();
    students.forEach((s) => { const key = `${s.class}||${s.stream || ''}`; if (!map.has(key)) map.set(key, { cls: s.class, stream: s.stream, count: 0 }); map.get(key)!.count++; });
    return [...map.values()].sort((a, b) => `${a.cls}${a.stream || ''}`.localeCompare(`${b.cls}${b.stream || ''}`));
  })();

  const sendRoster = async (cls: string, stream: string | null) => {
    const teacher = findClassTeacher(cls, stream);
    if (!teacher) return showToast('No class teacher assigned.', 'error');
    const group = students.filter((s) => s.class === cls && (s.stream || null) === stream);
    if (!group.length) return showToast('No students in this class.', 'warn');
    const { error } = await supabase.from('rosters').upsert({ class: cls, stream, teacher_name: teacher.fullname, student_count: group.length, sent_by: session.name, sent_at: new Date().toISOString(), ack: false }, { onConflict: 'class,stream' });
    if (error) return showToast('Send failed: ' + error.message, 'error');
    const { data } = await supabase.from('rosters').select('*').order('sent_at', { ascending: false });
    setRosterBatches(data || []);
    await logAction('Roster sent', `${cls}${stream ? ' ' + stream : ''} → ${teacher.fullname}`);
    showToast(`Roster sent to ${escapeHtml(teacher.fullname)}.`);
  };

  const resetRoster = (cls: string, stream: string | null) => {
    openConfirm('Reset Roster?', `Mark ${cls}${stream ? ' ' + stream : ''} as not sent?`, async () => {
      let q = supabase.from('rosters').delete().eq('class', cls);
      q = stream ? q.eq('stream', stream) : q.is('stream', null);
      const { error } = await q;
      if (error) return showToast('Reset failed: ' + error.message, 'error');
      const { data } = await supabase.from('rosters').select('*').order('sent_at', { ascending: false });
      setRosterBatches(data || []);
      await logAction('Roster reset', `${cls}${stream ? ' ' + stream : ''}`);
      showToast('Roster reset.', 'warn');
    });
  };

  return (
    <div className="iris-watermark space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Register */}
        <div className="bg-white rounded-2xl shadow-card ring-1 ring-slate-200/70 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="font-semibold text-ink-900">Register Student</h2>
            <p className="text-xs text-ink-500 mt-0.5">Auto-generates CBT password.</p>
          </div>
          <form onSubmit={handleAddStudent} className="p-5 space-y-3.5">
            <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Full Name (Surname First)</label>
              <input name="fullname" required placeholder="Yusuf, Amina Bello" className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">DOB</label>
                <input name="dob" type="date" required className="w-full text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" /></div>
              <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Gender</label>
                <select name="gender" required className="w-full text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"><option value="" disabled>Select</option><option>Male</option><option>Female</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Class</label>
                <select name="class" required onChange={(e) => setStreamVisible(SS_CLASSES.includes(e.target.value))} className="w-full text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"><option value="" disabled>Select</option>{ALL_CLASSES.map((c) => (<option key={c}>{c}</option>))}</select></div>
              {streamVisible ? (
                <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Stream</label>
                  <select name="stream" required className="w-full text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"><option value="" disabled>Select</option>{STREAMS.map((s) => (<option key={s}>{s}</option>))}</select></div>
              ) : (
                <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Stream</label>
                  <div className="w-full text-sm px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-ink-500 italic">N/A for JSS</div></div>
              )}
            </div>
            <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Admission Number</label>
              <input name="adm" required placeholder="IRIS/2026/045" className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white outline-none" /></div>
            <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-xl text-sm shadow-sm transition">Register Student</button>
          </form>
        </div>

        {/* Bulk Upload */}
        <div className="bg-white rounded-2xl shadow-card ring-1 ring-slate-200/70 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-3">
            <div><h2 className="font-semibold text-ink-900">Bulk Upload</h2><p className="text-xs text-ink-500 mt-0.5">Import students from CSV.</p></div>
            <button onClick={downloadTemplate} className="shrink-0 text-[11px] font-semibold text-primary-600 hover:text-primary-700 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition">⬇ Sample</button>
          </div>
          <div className="p-5 space-y-3">
            <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-3 text-[11px] text-ink-600">
              <p className="font-semibold text-ink-700 mb-1">CSV format</p>
              <p className="font-mono text-[10px] bg-white p-2 rounded border border-slate-200 overflow-x-auto">fullname, dob, gender, class, stream, adm</p>
            </div>
            <label className="block cursor-pointer">
              <input type="file" accept=".csv,text/csv" onChange={handleCSV} className="hidden" />
              <div className="border-2 border-dashed border-slate-300 hover:border-primary-500/60 rounded-xl p-6 text-center transition">
                <svg className="w-8 h-8 mx-auto text-ink-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" /></svg>
                <p className="mt-2 text-xs font-semibold text-ink-700">Click to select CSV file</p>
              </div>
            </label>
          </div>
          {bulkRows.length > 0 && (
            <div className="border-t border-slate-100">
              <div className="px-5 py-3 bg-slate-50 flex items-center justify-between">
                <p className="text-[11px] text-ink-500">{bulkRows.length} parsed · <span className="text-emerald-700 font-semibold">{bulkRows.filter((r) => !r.errors.length).length} valid</span> · <span className="text-red-600 font-semibold">{bulkRows.filter((r) => r.errors.length).length} errors</span></p>
                <div className="flex gap-2">
                  <button onClick={() => setBulkRows([])} className="text-xs font-semibold text-ink-700 hover:text-red-600 px-3 py-2 rounded-lg">Cancel</button>
                  <button onClick={confirmBulkImport} disabled={!bulkRows.some((r) => !r.errors.length)} className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-xl text-xs disabled:opacity-50">Import</button>
                </div>
              </div>
              <div className="overflow-x-auto scroll-thin max-h-[280px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white text-ink-700 text-[10px] uppercase tracking-wider sticky top-0 border-b border-slate-200">
                    <tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Class</th><th className="px-3 py-2">Adm</th><th className="px-3 py-2">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bulkRows.map((r) => {
                      const ok = !r.errors.length;
                      return (
                        <tr key={r.idx} className={ok ? '' : 'bg-red-50/40'}>
                          <td className="px-3 py-2 text-ink-500">{r.idx}</td>
                          <td className="px-3 py-2">{escapeHtml(r.fullname)}</td>
                          <td className="px-3 py-2">{r.cls || '—'}</td>
                          <td className="px-3 py-2 font-mono">{escapeHtml(r.adm)}</td>
                          <td className="px-3 py-2">{ok ? (<span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Ready</span>) : (<span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700" title={r.errors.join(' · ')}>{r.errors.length} err</span>)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Rosters */}
        <div className="bg-white rounded-2xl shadow-card ring-1 ring-slate-200/70 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="font-semibold text-ink-900">Distribute Rosters</h2>
            <p className="text-xs text-ink-500 mt-0.5">Send class rosters to class teachers.</p>
          </div>
          <div className="p-5 space-y-3 max-h-[600px] overflow-y-auto scroll-thin">
            {!groups.length && <p className="text-xs text-ink-500 italic py-4 text-center">No students yet.</p>}
            {groups.map((g) => {
              const teacher = findClassTeacher(g.cls, g.stream);
              const batch = rosterBatches.find((b) => b.class === g.cls && (b.stream || null) === (g.stream || null));
              const status = !batch ? 'Not Sent' : batch.ack ? 'Acknowledged' : 'Sent';
              const tone = status === 'Acknowledged' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : status === 'Sent' ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-slate-100 text-ink-600 ring-slate-200';
              return (
                <div key={`${g.cls}-${g.stream}`} className="rounded-xl ring-1 ring-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-ink-900">{g.cls}{g.stream ? ' ' + g.stream : ''}</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-ink-600 ring-1 ring-slate-200">{g.count} students</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ${tone}`}>{status}</span>
                    </div>
                    <p className="text-[11px] text-ink-500 mt-1">
                      {teacher ? <>Class teacher: <span className="font-semibold text-ink-700">{teacher.fullname}</span></> : <span className="text-red-600 font-semibold">⚠ No class teacher assigned</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {batch && <button onClick={() => resetRoster(g.cls, g.stream)} className="text-xs font-semibold text-ink-600 hover:text-red-600 px-3 py-2 rounded-lg">Reset</button>}
                    <button onClick={() => sendRoster(g.cls, g.stream)} disabled={!teacher} className={`text-xs font-semibold px-3.5 py-2 rounded-lg transition ${teacher ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                      {batch ? 'Resend' : 'Send Roster'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Directory */}
      <div className="bg-white rounded-2xl shadow-card ring-1 ring-slate-200/70 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="font-semibold text-ink-900">Student Directory</h2>
          <p className="text-xs text-ink-500 mt-0.5">Total: {filteredStudents.length} student{filteredStudents.length === 1 ? '' : 's'}</p>
        </div>
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-2">
          <input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Search by name or admission number…" className="flex-grow text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"><option value="">All Classes</option>{ALL_CLASSES.map((c) => (<option key={c}>{c}</option>))}</select>
          <select value={filterStream} onChange={(e) => setFilterStream(e.target.value)} className="text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"><option value="">All Streams</option>{STREAMS.map((s) => (<option key={s}>{s}</option>))}</select>
        </div>
        <div className="overflow-x-auto scroll-thin max-h-[520px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-ink-700 text-[11px] uppercase tracking-wider sticky top-0">
              <tr><th className="px-4 py-3 font-semibold">Adm No</th><th className="px-4 py-3 font-semibold">Full Name</th><th className="px-4 py-3 font-semibold">DOB</th><th className="px-4 py-3 font-semibold">Class</th><th className="px-4 py-3 font-semibold">Stream</th><th className="px-4 py-3 font-semibold">CBT Password</th><th className="px-4 py-3 font-semibold text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!filteredStudents.length && (<tr><td colSpan={7} className="px-4 py-12 text-center text-xs text-ink-500 italic">No students registered yet.</td></tr>)}
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-4 py-3 font-mono font-semibold text-primary-600">{s.adm}</td>
                  <td className="px-4 py-3 font-medium text-ink-900">{s.fullname}</td>
                  <td className="px-4 py-3 text-ink-600">{s.dob || '—'}</td>
                  <td className="px-4 py-3"><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-ink-700 ring-1 ring-slate-200">{s.class}</span></td>
                  <td className="px-4 py-3">{s.stream ? (<span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 ring-1 ring-primary-100">{s.stream}</span>) : (<span className="text-[10px] text-ink-400 italic">—</span>)}</td>
                  <td className="px-4 py-3 font-mono text-emerald-700 font-semibold">{s.cbt_password || '—'}</td>
                  <td className="px-4 py-3 text-right"><button onClick={() => handleDeleteStudent(s.id)} className="text-red-600 hover:text-red-700 font-semibold text-[11px]">Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TEACHERS
   ═══════════════════════════════════════════════════════════════ */
function TeachersTab({ teachers, setTeachers, teacherSubjects, setTeacherSubjects, classSubjects, session }: {
  teachers: Teacher[]; setTeachers: (t: Teacher[]) => void;
  teacherSubjects: TeacherSubject[]; setTeacherSubjects: (t: TeacherSubject[]) => void;
  classSubjects: ClassSubject[]; session: AdminSession;
}) {
  const [search, setSearch] = useState('');
  const [assignTeacher, setAssignTeacher] = useState<Teacher | null>(null);

  const reloadTeachers = async () => {
    const { data } = await supabase.from('teachers').select('*').order('created_at', { ascending: false });
    setTeachers((data as Teacher[]) || []);
  };
  const reloadTeacherSubjects = async () => {
    const { data } = await supabase.from('teacher_subjects').select('*');
    setTeacherSubjects((data as TeacherSubject[]) || []);
  };

  const generateStaffId = () => {
    const existing = teachers.map((t) => t.staff_id).filter(Boolean);
    let n = 1;
    while (existing.includes(`IRIS/STF/${String(n).padStart(3, '0')}`)) n++;
    return `IRIS/STF/${String(n).padStart(3, '0')}`;
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fullname = (form.elements.namedItem('fullname') as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim().toLowerCase();
    const rt = (form.elements.namedItem('role_type') as HTMLSelectElement).value as 'class' | 'subject' | 'both';
    const cls = rt === 'subject' ? null : (form.elements.namedItem('assigned_class') as HTMLSelectElement).value || null;
    const stream = cls && SS_CLASSES.includes(cls) ? (form.elements.namedItem('assigned_stream') as HTMLSelectElement).value || null : null;

    if (!fullname || !email) return showToast('Name and email are required.', 'error');
    if ((rt === 'class' || rt === 'both') && !cls) return showToast('Please select the class.', 'error');
    if (cls && SS_CLASSES.includes(cls) && !stream) return showToast('Stream required for SS.', 'error');
    if (teachers.some((t) => t.email === email)) return showToast('Email already exists.', 'error');

    const staff_id = generateStaffId();
    const password = generateTeacherPassword(fullname);

    const { error } = await supabase.from('teachers').insert({ staff_id, fullname, email, password, role_type: rt, assigned_class: cls, assigned_stream: stream, status: 'active' });
    if (error) return showToast('Insert failed: ' + error.message, 'error');

    await reloadTeachers();
    await logAction('Teacher registered', `${fullname} · ${staff_id}`);
    showToast(`Registered <b>${escapeHtml(fullname)}</b>. Staff: <span class="font-mono">${staff_id}</span> · PW: <span class="font-mono">${password}</span>`);
    form.reset();
  };

  const handleDeleteTeacher = (id: string) => {
    const t = teachers.find((x) => x.id === id); if (!t) return;
    openConfirm('Remove Teacher?', `Remove ${t.fullname} (${t.staff_id})?`, async () => {
      const { error } = await supabase.from('teachers').delete().eq('id', id);
      if (error) return showToast('Delete failed: ' + error.message, 'error');
      await reloadTeachers();
      await reloadTeacherSubjects();
      await logAction('Teacher removed', `${t.fullname} · ${t.staff_id}`);
      showToast('Teacher removed.', 'warn');
    });
  };

  const resetTeacherPassword = async (id: string) => {
    const t = teachers.find((x) => x.id === id); if (!t) return;
    const newPassword = generateTeacherPassword(t.fullname);
    const { error } = await supabase.from('teachers').update({ password: newPassword }).eq('id', id);
    if (error) return showToast('Reset failed: ' + error.message, 'error');
    await reloadTeachers();
    await logAction('Teacher password reset', t.fullname);
    showToast(`New password for ${escapeHtml(t.fullname)}: <span class="font-mono font-bold">${newPassword}</span>`);
  };

  const filteredTeachers = teachers.filter((t) => t.fullname.toLowerCase().includes(search.toLowerCase()) || (t.staff_id || '').toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase()));
  const roleLabels: Record<string, string> = { class: 'Class Teacher', subject: 'Subject Teacher', both: 'Class & Subject' };

  return (
    <div className="iris-watermark space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl shadow-card ring-1 ring-slate-200/70 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="font-semibold text-ink-900">Register Teacher</h2>
            <p className="text-xs text-ink-500 mt-0.5">Auto-generates Staff ID and password.</p>
          </div>
          <form onSubmit={handleAddTeacher} className="p-5 space-y-3.5">
            <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Full Name</label>
              <input name="fullname" required placeholder="Dr. Aliyu Ibrahim" className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white" /></div>
            <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Email</label>
              <input name="email" type="email" required placeholder="aliyu@iris.edu.ng" className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white" /></div>
            <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Role</label>
              <select name="role_type" className="w-full text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                <option value="subject">Subject Teacher</option>
                <option value="class">Class Teacher</option>
                <option value="both">Class & Subject Teacher</option>
              </select></div>
            <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Class Teacher Of</label>
              <select name="assigned_class" className="w-full text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                <option value="">Select class</option>{ALL_CLASSES.map((c) => (<option key={c}>{c}</option>))}
              </select></div>
            <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Stream (SS only)</label>
              <select name="assigned_stream" className="w-full text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                <option value="">Select stream</option>{STREAMS.map((s) => (<option key={s}>{s}</option>))}
              </select></div>
            <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-xl text-sm shadow-sm transition">Register Teacher</button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card ring-1 ring-slate-200/70 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="font-semibold text-ink-900">Teacher Directory</h2><p className="text-xs text-ink-500 mt-0.5">Total: {filteredTeachers.length} teacher{filteredTeachers.length === 1 ? '' : 's'}</p></div>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff…" className="text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none w-full sm:w-64" />
          </div>
          <div className="overflow-x-auto scroll-thin max-h-[600px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-ink-700 text-[11px] uppercase tracking-wider">
                <tr><th className="px-4 py-3 font-semibold">Staff ID</th><th className="px-4 py-3 font-semibold">Name</th><th className="px-4 py-3 font-semibold">Email</th><th className="px-4 py-3 font-semibold">Role</th><th className="px-4 py-3 font-semibold text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!filteredTeachers.length && (<tr><td colSpan={5} className="px-4 py-12 text-center text-xs text-ink-500 italic">No teachers yet.</td></tr>)}
                {filteredTeachers.map((t) => {
                  const assigned = teacherSubjects.filter((ts) => ts.teacher_id === t.id);
                  const classInfo = t.role_type === 'class' || t.role_type === 'both' ? `Class: ${t.assigned_class}${t.assigned_stream ? ' ' + t.assigned_stream : ''}` : '';
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3 font-mono text-primary-600 font-semibold">{t.staff_id}</td>
                      <td className="px-4 py-3 font-medium text-ink-900">{t.fullname}</td>
                      <td className="px-4 py-3 text-ink-600">{t.email}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 ring-1 ring-primary-100 uppercase tracking-wider">{roleLabels[t.role_type] || t.role_type}</span>
                        {classInfo && <div className="text-[10px] text-ink-500 mt-0.5">{classInfo}</div>}
                        {assigned.length > 0 && <div className="text-[10px] text-ink-500 mt-0.5">{assigned.length} subject{assigned.length === 1 ? '' : 's'}</div>}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button onClick={() => setAssignTeacher(t)} className="text-primary-600 hover:text-primary-700 font-semibold text-[11px] mr-2">Assign</button>
                        <button onClick={() => resetTeacherPassword(t.id)} className="text-emerald-600 hover:text-emerald-700 font-semibold text-[11px] mr-2">Reset PW</button>
                        <button onClick={() => handleDeleteTeacher(t.id)} className="text-red-600 hover:text-red-700 font-semibold text-[11px]">Remove</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {assignTeacher && (
        <AssignSubjectsModal teacher={assignTeacher} classSubjects={classSubjects} teacherSubjects={teacherSubjects}
          onClose={() => setAssignTeacher(null)}
          onSaved={async () => { await reloadTeacherSubjects(); setAssignTeacher(null); }} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ASSIGN SUBJECTS MODAL
   ═══════════════════════════════════════════════════════════════ */
function AssignSubjectsModal({ teacher, classSubjects, teacherSubjects, onClose, onSaved }: {
  teacher: Teacher; classSubjects: ClassSubject[]; teacherSubjects: TeacherSubject[];
  onClose: () => void; onSaved: () => void;
}) {
  const [filterCls, setFilterCls] = useState('');
  const [selected, setSelected] = useState<Set<string>>(() => {
    const set = new Set<string>();
    teacherSubjects.filter((ts) => ts.teacher_id === teacher.id).forEach((ts) => set.add(`${ts.class}||${ts.stream || ''}||${ts.subject}`));
    return set;
  });

  const toggle = (key: string) => {
    setSelected((prev) => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  };

  const save = async () => {
    await supabase.from('teacher_subjects').delete().eq('teacher_id', teacher.id);
    if (selected.size) {
      const payload = Array.from(selected).map((key) => {
        const [cls, stream, subject] = key.split('||');
        return { teacher_id: teacher.id, class: cls, stream: stream || null, subject };
      });
      const { error } = await supabase.from('teacher_subjects').insert(payload);
      if (error) return showToast('Save failed: ' + error.message, 'error');
    }
    await logAction('Teacher assignments updated', `${teacher.fullname} · ${selected.size} subjects`);
    showToast(`Saved ${selected.size} subject assignment${selected.size === 1 ? '' : 's'}.`);
    onSaved();
  };

  const classes = filterCls ? [filterCls] : ALL_CLASSES;

  return (
    <div className="fixed inset-0 z-[100] bg-ink-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-pop ring-1 ring-slate-200 max-w-2xl w-full fade-in overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div><h3 className="font-semibold text-ink-900">Assign Subjects</h3><p className="text-xs text-ink-500 mt-0.5">{teacher.fullname} · {teacher.staff_id}</p></div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center">✕</button>
        </div>
        <div className="px-6 py-4 border-b border-slate-100 shrink-0">
          <select value={filterCls} onChange={(e) => setFilterCls(e.target.value)} className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none">
            <option value="">All Classes</option>{ALL_CLASSES.map((c) => (<option key={c}>{c}</option>))}
          </select>
        </div>
        <div className="p-6 overflow-y-auto scroll-thin flex-1 space-y-4">
          {classes.map((cls) => {
            const streams = SS_CLASSES.includes(cls) ? STREAMS : [null];
            return streams.map((stream) => {
              const subjects = classSubjects.filter((c) => c.class === cls && (c.stream || null) === (stream || null)).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
              if (!subjects.length) return null;
              return (
                <div key={`${cls}-${stream}`} className="rounded-xl ring-1 ring-slate-200 overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <p className="text-xs font-semibold text-ink-900">{cls}{stream ? ' · ' + stream : ''}</p>
                    <span className="text-[10px] text-ink-500">{subjects.length} subjects</span>
                  </div>
                  <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {subjects.map((s) => {
                      const key = `${cls}||${stream || ''}||${s.subject}`;
                      return (
                        <label key={key} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                          <input type="checkbox" checked={selected.has(key)} onChange={() => toggle(key)} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                          <span className="text-[11px] text-ink-800">{s.subject}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-700 hover:bg-slate-100">Cancel</button>
          <button onClick={save} className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700">Save</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CLASS SUBJECTS
   ═══════════════════════════════════════════════════════════════ */
function ClassesTab({ classSubjects, setClassSubjects }: { classSubjects: ClassSubject[]; setClassSubjects: (c: ClassSubject[]) => void }) {
  const [currentClassTab, setCurrentClassTab] = useState('JSS1');
  const [currentStreamTab, setCurrentStreamTab] = useState('Science');
  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState<'JSS' | 'SS'>('JSS');

  const reload = async () => {
    const { data } = await supabase.from('class_subjects').select('*').order('display_order');
    setClassSubjects((data as ClassSubject[]) || []);
  };

  const isJSS = JSS_CLASSES.includes(currentClassTab);
  const subjects = isJSS
    ? classSubjects.filter((cs) => cs.class === 'JSS1').sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    : classSubjects.filter((cs) => cs.class === currentClassTab && cs.stream === currentStreamTab).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const handleDelete = (id: string) => {
    const s = classSubjects.find((x) => x.id === id); if (!s) return;
    openConfirm('Remove Subject?', `Remove "${s.subject}" from ${s.class}${s.stream ? ' ' + s.stream : ''}?`, async () => {
      const { error } = await supabase.from('class_subjects').delete().eq('id', id);
      if (error) return showToast('Delete failed: ' + error.message, 'error');
      await reload();
      await logAction('Subject removed', `${s.subject} · ${s.class}`);
      showToast('Subject removed.', 'warn');
    });
  };

  return (
    <div className="iris-watermark space-y-5">
      <div className="bg-white rounded-2xl shadow-card ring-1 ring-slate-200/70 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-semibold text-ink-900">Class Subjects Manager</h2><p className="text-xs text-ink-500 mt-0.5">Define which subjects each class offers.</p></div>
          <div className="flex flex-wrap gap-2 bg-slate-50 p-1 rounded-xl ring-1 ring-slate-200">
            {ALL_CLASSES.map((c) => (
              <button key={c} onClick={() => setCurrentClassTab(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${currentClassTab === c ? 'bg-primary-600 text-white shadow-sm' : 'text-ink-700 hover:bg-slate-100'}`}>{c}</button>
            ))}
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h3 className="font-semibold text-ink-900">{currentClassTab}{isJSS ? ' Subjects (shared with all JSS)' : ` · ${currentStreamTab}`}</h3></div>
            <div className="flex items-center gap-2">
              {!isJSS && (
                <div className="flex bg-slate-50 p-1 rounded-xl ring-1 ring-slate-200">
                  {STREAMS.map((s) => (
                    <button key={s} onClick={() => setCurrentStreamTab(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${currentStreamTab === s ? 'bg-primary-600 text-white shadow-sm' : 'text-ink-700 hover:bg-slate-100'}`}>{s}</button>
                  ))}
                </div>
              )}
              <button onClick={() => { setAddType(isJSS ? 'JSS' : 'SS'); setAddOpen(true); }} className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-3.5 py-2 rounded-xl text-xs shadow-sm">+ Add Subject</button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {!subjects.length && <p className="col-span-full text-xs text-ink-500 italic text-center py-6">No subjects yet. Click &quot;Add Subject&quot;.</p>}
            {subjects.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-white ring-1 ring-slate-200">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900 truncate">{s.subject}</p>
                  <p className="text-[10px] text-ink-500 mt-0.5">OBJ {s.obj_max} · Theory {s.theory_max} · CA {s.ca_max}</p>
                </div>
                <button onClick={() => handleDelete(s.id)} className="shrink-0 text-red-500 hover:text-red-700 text-[11px] font-semibold">Remove</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {addOpen && (
        <AddSubjectModal type={addType} cls={currentClassTab} stream={addType === 'SS' ? currentStreamTab : null}
          onClose={() => setAddOpen(false)}
          onSaved={async () => { await reload(); setAddOpen(false); }} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ADD SUBJECT MODAL
   ═══════════════════════════════════════════════════════════════ */
function AddSubjectModal({ type, cls, stream, onClose, onSaved }: {
  type: 'JSS' | 'SS'; cls: string; stream: string | null;
  onClose: () => void; onSaved: () => void;
}) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const subject = (form.elements.namedItem('subject') as HTMLInputElement).value.trim();
    const obj_max = Number((form.elements.namedItem('obj') as HTMLInputElement).value) || 20;
    const theory_max = Number((form.elements.namedItem('theory') as HTMLInputElement).value) || 40;
    const ca_max = Number((form.elements.namedItem('ca') as HTMLInputElement).value) || 40;
    if (!subject) return showToast('Subject name required.', 'error');

    const targets = type === 'JSS' ? JSS_CLASSES.map((c) => ({ class: c, stream: null })) : [{ class: cls, stream }];
    const payload = targets.map((t) => ({ class: t.class, stream: t.stream, subject, obj_max, theory_max, ca_max, display_order: 999 }));
    const { error } = await supabase.from('class_subjects').insert(payload);
    if (error) return showToast('Insert failed: ' + error.message, 'error');
    await logAction('Subject added', `${subject} · ${type}`);
    showToast(`Added ${subject}.`);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-ink-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-pop ring-1 ring-slate-200 max-w-md w-full fade-in overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div><h3 className="font-semibold text-ink-900">Add Subject</h3><p className="text-xs text-ink-500 mt-0.5">{type === 'SS' ? `${cls} · ${stream}` : `${cls} (applies to all JSS)`}</p></div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Subject Name</label>
            <input name="subject" required placeholder="e.g. Further Mathematics" className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">OBJ Max</label>
              <input name="obj" type="number" min="0" defaultValue="20" className="w-full text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" /></div>
            <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Theory Max</label>
              <input name="theory" type="number" min="0" defaultValue="40" className="w-full text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" /></div>
            <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">CA Max</label>
              <input name="ca" type="number" min="0" defaultValue="40" className="w-full text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-700 hover:bg-slate-100">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700">Add Subject</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TERMS
   ═══════════════════════════════════════════════════════════════ */
function TermsTab({ termSettings, setTermSettings }: { termSettings: TermSetting[]; setTermSettings: (t: TermSetting[]) => void }) {
  const [editTerm, setEditTerm] = useState<TermSetting | null>(null);

  const reload = async () => {
    const { data } = await supabase.from('term_settings').select('*').order('term');
    setTermSettings((data as TermSetting[]) || []);
  };

  const setCurrent = (term: string) => {
    openConfirm('Set Current Term?', `Switch active term to ${term} Term?`, async () => {
      await supabase.from('term_settings').update({ is_current: false }).eq('session', '2025/2026');
      await supabase.from('term_settings').update({ is_current: true }).eq('session', '2025/2026').eq('term', term);
      await reload();
      await logAction('Current term changed', term);
      showToast(`${term} Term is now current.`);
    });
  };

  return (
    <div className="iris-watermark space-y-5">
      <div className="bg-white rounded-2xl shadow-card ring-1 ring-slate-200/70 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="font-semibold text-ink-900">Term Calendar</h2>
          <p className="text-xs text-ink-500 mt-0.5">These dates appear on report cards.</p>
        </div>
        <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {!termSettings.length && <p className="col-span-full text-xs text-ink-500 italic text-center py-6">No terms configured.</p>}
          {termSettings.map((t) => (
            <div key={t.id} className={`rounded-xl ring-1 p-5 bg-white ${t.is_current ? 'ring-2 ring-primary-500/40' : 'ring-slate-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Term</p>
                  <p className="text-lg font-bold text-ink-900">{t.term} Term</p>
                  <p className="text-[11px] text-ink-500">{t.session}</p>
                </div>
                {t.is_current
                  ? <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 uppercase tracking-wider">Current</span>
                  : <button onClick={() => setCurrent(t.term)} className="text-[10px] font-semibold text-primary-600 hover:text-primary-700 px-2.5 py-1 rounded-full ring-1 ring-primary-200">Set Current</button>}
              </div>
              <div className="space-y-1.5 text-xs text-ink-700">
                <div className="flex justify-between"><span className="text-ink-500">Start</span><span className="font-medium">{t.start_date || '—'}</span></div>
                <div className="flex justify-between"><span className="text-ink-500">End</span><span className="font-medium">{t.end_date || '—'}</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Next Term</span><span className="font-medium">{t.next_term_begins || '—'}</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Days Opened</span><span className="font-medium">{t.days_school_opened ?? '—'}</span></div>
              </div>
              <button onClick={() => setEditTerm(t)} className="mt-4 w-full text-xs font-semibold text-primary-600 hover:text-primary-700 py-2 rounded-lg hover:bg-primary-50 transition">Edit Term</button>
            </div>
          ))}
        </div>
      </div>

      {editTerm && (
        <TermEditModal term={editTerm} onClose={() => setEditTerm(null)} onSaved={async () => { await reload(); setEditTerm(null); }} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TERM EDIT MODAL
   ═══════════════════════════════════════════════════════════════ */
function TermEditModal({ term, onClose, onSaved }: { term: TermSetting; onClose: () => void; onSaved: () => void }) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const start_date = (form.elements.namedItem('start') as HTMLInputElement).value || null;
    const end_date = (form.elements.namedItem('end') as HTMLInputElement).value || null;
    const next_term_begins = (form.elements.namedItem('next') as HTMLInputElement).value || null;
    const days_school_opened = Number((form.elements.namedItem('days') as HTMLInputElement).value) || 0;
    const { error } = await supabase.from('term_settings').update({ start_date, end_date, next_term_begins, days_school_opened }).eq('id', term.id);
    if (error) return showToast('Save failed: ' + error.message, 'error');
    await logAction('Term calendar updated', `${term.term} Term`);
    showToast('Term saved.');
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-ink-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-pop ring-1 ring-slate-200 max-w-md w-full fade-in overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div><h3 className="font-semibold text-ink-900">Edit {term.term} Term</h3><p className="text-xs text-ink-500 mt-0.5">Session {term.session}</p></div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Start Date</label>
              <input name="start" type="date" defaultValue={term.start_date || ''} className="w-full text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" /></div>
            <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">End Date</label>
              <input name="end" type="date" defaultValue={term.end_date || ''} className="w-full text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" /></div>
          </div>
          <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Next Term Begins</label>
            <input name="next" type="date" defaultValue={term.next_term_begins || ''} className="w-full text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" /></div>
          <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Days School Opened</label>
            <input name="days" type="number" min="0" defaultValue={term.days_school_opened || 0} className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" /></div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-700 hover:bg-slate-100">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   QUESTIONS
   ═══════════════════════════════════════════════════════════════ */
function QuestionsTab({ questions, setQuestions, session }: { questions: Question[]; setQuestions: (q: Question[]) => void; session: AdminSession }) {
  const [bulkPreview, setBulkPreview] = useState<BulkQuestionRow[]>([]);
  const [pasteText, setPasteText] = useState('');
  const [subjFilter, setSubjFilter] = useState('');
  const [clsFilter, setClsFilter] = useState('');

  const reload = async () => {
    const { data } = await supabase.from('questions').select('*').order('created_at', { ascending: false });
    setQuestions((data as Question[]) || []);
  };

  const downloadTemplate = () => {
    const csv = 'subject,class,type,question,option_a,option_b,option_c,option_d,correct,marks\nBiology,SS1,objective,What is the powerhouse of the cell?,Nucleus,Ribosome,Mitochondria,Golgi,C,2\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'IRIS_Question_Template.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('Template downloaded.', 'info');
  };

  const processRows = (lines: string[]): BulkQuestionRow[] => {
    const rows: BulkQuestionRow[] = [];
    lines.forEach((line, idx) => {
      if (!line.trim()) return;
      if (idx === 0 && line.toLowerCase().includes('subject')) return;
      const cells = parseCSVLine(line);
      const [subject, cls, type, question, a, b, c, d, correct, marks] = cells;
      const errors: string[] = [];
      if (!subject) errors.push('Missing subject');
      if (!cls) errors.push('Missing class');
      if (!type) errors.push('Missing type');
      if (!question) errors.push('Missing question');
      const marksNum = Number(marks) || (type === 'theory' ? 5 : 2);
      if (type === 'objective') {
        if (![a, b, c, d].every((x) => x)) errors.push('Needs 4 options');
        if (!correct || !/^[A-Da-d]$/.test(correct)) errors.push('Correct must be A/B/C/D');
      }
      rows.push({ idx: rows.length + 1, subject, cls, type, question, a, b, c, d, correct: (correct || '').toUpperCase(), marks: marksNum, errors });
    });
    return rows;
  };

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBulkPreview(processRows(String(reader.result).split(/\r?\n/)));
    reader.readAsText(file);
  };

  const parsePasted = () => {
    if (!pasteText.trim()) return showToast('Paste some rows first.', 'warn');
    setBulkPreview(processRows(pasteText.split(/\r?\n/)));
  };

  const confirmImport = async () => {
    const valid = bulkPreview.filter((r) => !r.errors.length);
    if (!valid.length) return;
    const payload = valid.map((r) => ({
      subject: r.subject, class: r.cls, type: r.type, prompt: r.question,
      options: r.type === 'objective' ? [r.a, r.b, r.c, r.d] : [],
      correct_index: r.type === 'objective' ? ['A', 'B', 'C', 'D'].indexOf(r.correct) : -1,
      marks: r.marks, source: 'bulk',
    }));
    const { error } = await supabase.from('questions').insert(payload);
    if (error) return showToast('Import failed: ' + error.message, 'error');
    await reload();
    await logAction('Bulk question import', `${valid.length} questions added`);
    showToast(`${valid.length} questions imported.`);
    setBulkPreview([]);
    setPasteText('');
  };

  const deleteQuestion = (id: string) => {
    openConfirm('Delete Question?', 'Permanently remove?', async () => {
      const { error } = await supabase.from('questions').delete().eq('id', id);
      if (error) return showToast('Delete failed: ' + error.message, 'error');
      await reload();
      showToast('Question removed.', 'warn');
    });
  };

  const filtered = questions.filter((q) => (!subjFilter || q.subject === subjFilter) && (!clsFilter || q.class === clsFilter));
  const subjSet = [...new Set(questions.map((q) => q.subject))].sort();

  return (
    <div className="iris-watermark space-y-5">
      <div className="bg-white rounded-2xl shadow-card ring-1 ring-slate-200/70 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-semibold text-ink-900">Bulk Question Upload</h2></div>
          <button onClick={downloadTemplate} className="text-xs font-semibold text-primary-600 hover:text-primary-700 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition">⬇ CSV Template</button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 p-5">
          <div className="rounded-xl ring-1 ring-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200"><p className="text-xs font-semibold text-ink-900">Method 1 · CSV Upload</p></div>
            <div className="p-4">
              <label className="block cursor-pointer">
                <input type="file" accept=".csv" onChange={handleCSV} className="hidden" />
                <div className="border-2 border-dashed border-slate-300 hover:border-primary-500/60 rounded-xl p-6 text-center">
                  <svg className="w-8 h-8 mx-auto text-ink-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" /></svg>
                  <p className="mt-2 text-xs font-semibold text-ink-700">Click to select CSV file</p>
                </div>
              </label>
            </div>
          </div>
          <div className="rounded-xl ring-1 ring-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200"><p className="text-xs font-semibold text-ink-900">Method 2 · Paste Text</p></div>
            <div className="p-4 space-y-3">
              <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={6} placeholder="subject,class,type,question,option_a,option_b,option_c,option_d,correct,marks" className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none" />
              <button onClick={parsePasted} className="w-full text-xs font-semibold text-primary-600 hover:text-primary-700 py-2 rounded-lg hover:bg-primary-50 transition">Parse Pasted Text</button>
            </div>
          </div>
        </div>
        {bulkPreview.length > 0 && (
          <div className="border-t border-slate-100">
            <div className="px-6 py-4 flex items-center justify-between bg-slate-50">
              <p className="text-[11px] text-ink-500">{bulkPreview.length} parsed · <span className="text-emerald-700 font-semibold">{bulkPreview.filter((r) => !r.errors.length).length} valid</span></p>
              <div className="flex gap-2">
                <button onClick={() => setBulkPreview([])} className="text-xs font-semibold text-ink-700 hover:text-red-600 px-3 py-2 rounded-lg">Cancel</button>
                <button onClick={confirmImport} disabled={!bulkPreview.some((r) => !r.errors.length)} className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-xl text-xs disabled:opacity-50">Confirm Import</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-card ring-1 ring-slate-200/70 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-semibold text-ink-900">Question Bank</h2><p className="text-xs text-ink-500 mt-0.5">{filtered.length} question{filtered.length === 1 ? '' : 's'}</p></div>
          <div className="flex gap-2">
            <select value={subjFilter} onChange={(e) => setSubjFilter(e.target.value)} className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none">
              <option value="">All Subjects</option>
              {subjSet.map((s) => (<option key={s}>{s}</option>))}
            </select>
            <select value={clsFilter} onChange={(e) => setClsFilter(e.target.value)} className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none">
              <option value="">All Classes</option>{ALL_CLASSES.map((c) => (<option key={c}>{c}</option>))}
            </select>
          </div>
        </div>
        <div className="p-5 space-y-3 max-h-[600px] overflow-y-auto scroll-thin">
          {!filtered.length && <div className="text-center py-12 text-xs text-ink-500 italic">No questions yet.</div>}
          {filtered.slice(0, 100).map((q) => (
            <div key={q.id} className="p-4 rounded-xl ring-1 ring-slate-200 bg-white">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 ring-1 ring-primary-100">{q.subject}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-ink-700 ring-1 ring-slate-200">{q.class}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent-50 text-accent-600 ring-1 ring-accent-100 uppercase">{q.type}</span>
                  <span className="text-[10px] text-ink-500">{q.marks} marks</span>
                </div>
                <button onClick={() => deleteQuestion(q.id)} className="text-red-500 hover:text-red-700 text-[11px] font-semibold">Delete</button>
              </div>
              <p className="text-xs text-ink-900 font-medium mb-2">{q.prompt}</p>
              {q.type === 'objective' && Array.isArray(q.options) && q.options.length > 0 && (
                <ul className="grid grid-cols-2 gap-1.5 text-[11px]">
                  {q.options.map((o, i) => (
                    <li key={i} className={`px-2.5 py-1.5 rounded-lg ${i === q.correct_index ? 'bg-emerald-50 ring-1 ring-emerald-200 text-emerald-800 font-semibold' : 'bg-slate-50 ring-1 ring-slate-200 text-ink-600'}`}>
                      {String.fromCharCode(65 + i)}. {o} {i === q.correct_index ? '✓' : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EXAMS
   ═══════════════════════════════════════════════════════════════ */
function ExamsTab({ exams, setExams, session }: { exams: Exam[]; setExams: (e: Exam[]) => void; session: AdminSession }) {
  const reload = async () => {
    const { data } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
    setExams((data as Exam[]) || []);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const title = (form.elements.namedItem('title') as HTMLInputElement).value.trim();
    const subject = (form.elements.namedItem('subject') as HTMLInputElement).value.trim();
    const cls = (form.elements.namedItem('class') as HTMLInputElement).value.trim();
    const duration = Number((form.elements.namedItem('duration') as HTMLInputElement).value) || 45;
    const status = (form.elements.namedItem('status') as HTMLSelectElement).value;
    const { error } = await supabase.from('exams').insert({ title, subject, class: cls, duration, status, created_by: session.name });
    if (error) return showToast('Insert failed: ' + error.message, 'error');
    await reload();
    await logAction('Exam created', `${title} · ${subject} · ${cls}`);
    showToast(`Exam "${title}" ${status === 'published' ? 'published' : 'saved as draft'}.`);
    form.reset();
  };

  const toggleStatus = async (id: string) => {
    const ex = exams.find((e) => e.id === id); if (!ex) return;
    const newStatus = ex.status === 'published' ? 'draft' : 'published';
    await supabase.from('exams').update({ status: newStatus }).eq('id', id);
    await reload();
    showToast(`Exam is now ${newStatus}.`, 'info');
  };

  const deleteExam = (id: string) => {
    const ex = exams.find((e) => e.id === id); if (!ex) return;
    openConfirm('Delete Exam?', `Remove "${ex.title}"?`, async () => {
      const { error } = await supabase.from('exams').delete().eq('id', id);
      if (error) return showToast('Delete failed: ' + error.message, 'error');
      await reload();
      showToast('Exam removed.', 'warn');
    });
  };

  return (
    <div className="iris-watermark space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl shadow-card ring-1 ring-slate-200/70 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="font-semibold text-ink-900">Create Exam</h2>
            <p className="text-xs text-ink-500 mt-0.5">Set title, subject, class, duration.</p>
          </div>
          <form onSubmit={handleCreate} className="p-5 space-y-3.5">
            <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Title</label>
              <input name="title" required placeholder="Mid-Term Chemistry Test" className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Subject</label>
                <input name="subject" required placeholder="Chemistry" className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" /></div>
              <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Class</label>
                <input name="class" required placeholder="SS2 Science" className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Duration (min)</label>
                <input name="duration" type="number" min="5" defaultValue="45" className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" /></div>
              <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Status</label>
                <select name="status" className="w-full text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"><option value="draft">Draft</option><option value="published">Publish</option></select></div>
            </div>
            <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-xl text-sm shadow-sm">Save Exam</button>
          </form>
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card ring-1 ring-slate-200/70 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="font-semibold text-ink-900">Exam Sessions</h2>
            <p className="text-xs text-ink-500 mt-0.5">{exams.length} exam{exams.length === 1 ? '' : 's'}</p>
          </div>
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-ink-700 text-[11px] uppercase tracking-wider">
                <tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Class</th><th className="px-4 py-3 text-center">Duration</th><th className="px-4 py-3 text-center">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!exams.length && <tr><td colSpan={6} className="px-4 py-12 text-center text-xs text-ink-500 italic">No exams yet.</td></tr>}
                {exams.map((ex) => (
                  <tr key={ex.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-medium text-ink-900">{ex.title}</td>
                    <td className="px-4 py-3 text-ink-600">{ex.subject}</td>
                    <td className="px-4 py-3">{ex.class}</td>
                    <td className="px-4 py-3 text-center">{ex.duration} min</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ex.status === 'published' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'} uppercase tracking-wider`}>{ex.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => toggleStatus(ex.id)} className="text-primary-600 hover:text-primary-700 font-semibold text-[11px] mr-2">{ex.status === 'published' ? 'Unpublish' : 'Publish'}</button>
                      <button onClick={() => deleteExam(ex.id)} className="text-red-600 hover:text-red-700 font-semibold text-[11px]">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LIVE CBT
   ═══════════════════════════════════════════════════════════════ */
function LiveCbtTab({ students, session }: { students: Student[]; session: AdminSession }) {
  const [attempts, setAttempts] = useState<LiveAttempt[]>([]);
  const [filterExam, setFilterExam] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('exam_attempts').select('*').order('last_activity_at', { ascending: false }).limit(200);
      setAttempts((data as LiveAttempt[]) || []);
    };
    load();
    const ch = supabase.channel('iris-live-cbt-watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_attempts' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = attempts.filter((a) => {
    if (filterExam && a.exam_title !== filterExam) return false;
    if (filterClass && a.class !== filterClass) return false;
    if (filterStatus && a.status !== filterStatus) return false;
    if (search) {
      const s = students.find((x) => x.id === a.student_id);
      const name = (s?.fullname || a.student_name || '').toLowerCase();
      const adm = (s?.adm || a.student_adm || '').toLowerCase();
      if (!name.includes(search.toLowerCase()) && !adm.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const active = attempts.filter((a) => a.status === 'in_progress').length;
  const paused = attempts.filter((a) => a.status === 'paused').length;
  const submitted = attempts.filter((a) => a.status === 'submitted').length;
  const flagged = attempts.filter((a) => (a.flags || 0) > 0).length;
  const examTitles = [...new Set(attempts.map((a) => a.exam_title).filter(Boolean))].sort();

  const seedDemo = async () => {
    if (!students.length) return showToast('Register students first.', 'warn');
    const sample = students.slice(0, 3);
    const demo = sample.map((s, i) => ({
      student_id: s.id, exam_title: 'Demo Chemistry CBT', subject: 'Chemistry', class: s.class, stream: s.stream, session: '2025/2026', term: '1st',
      status: i === 0 ? 'in_progress' : i === 1 ? 'paused' : 'submitted',
      current_question: i === 0 ? 5 : i === 1 ? 3 : 10, total_questions: 10,
      score: i === 0 ? 8 : i === 1 ? 4 : 9, max_score: 10,
      started_at: new Date(Date.now() - 1000 * 60 * (10 + i * 5)).toISOString(),
      last_activity_at: new Date(Date.now() - 1000 * 60 * (1 + i)).toISOString(),
      submitted_at: i === 2 ? new Date(Date.now() - 1000 * 60).toISOString() : null,
      flags: i === 1 ? 2 : 0, flagged_reason: i === 1 ? 'Tab switch detected' : null,
    }));
    const { error } = await supabase.from('exam_attempts').insert(demo);
    if (error) return showToast('Seed failed: ' + error.message, 'error');
    showToast('3 demo attempts added.');
  };

  return (
    <div className="iris-watermark space-y-5">
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-500">Real-time</p>
            <h2 className="mt-0.5 font-serif text-xl">Live CBT Exam Monitor</h2>
            <p className="text-xs text-white/70 mt-0.5">{active > 0 ? `${active} student${active === 1 ? '' : 's'} actively writing` : 'Waiting for students to begin…'}</p>
          </div>
          <button onClick={seedDemo} className="text-xs font-semibold bg-amber-500/90 hover:bg-amber-500 text-white px-3.5 py-2 rounded-xl transition">+ Demo Data</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'In Progress', value: active, tone: 'text-emerald-600' },
          { label: 'Paused', value: paused, tone: 'text-amber-600' },
          { label: 'Submitted', value: submitted, tone: 'text-blue-600' },
          { label: 'Flagged', value: flagged, tone: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-card ring-1 ring-slate-200/70">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-card ring-1 ring-slate-200/70 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <select value={filterExam} onChange={(e) => setFilterExam(e.target.value)} className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none">
            <option value="">All Exams</option>{examTitles.map((e) => (<option key={e!}>{e}</option>))}
          </select>
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none">
            <option value="">All Classes</option>{ALL_CLASSES.map((c) => (<option key={c}>{c}</option>))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none">
            <option value="">All Statuses</option><option value="in_progress">In Progress</option><option value="paused">Paused</option><option value="submitted">Submitted</option><option value="abandoned">Abandoned</option>
          </select>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student…" className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none ml-auto w-full sm:w-56" />
        </div>
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-ink-700 text-[11px] uppercase tracking-wider">
              <tr><th className="px-5 py-3">Student</th><th className="px-5 py-3">Exam</th><th className="px-5 py-3">Class</th><th className="px-5 py-3">Progress</th><th className="px-5 py-3 text-center">Score</th><th className="px-5 py-3 text-center">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!filtered.length && <tr><td colSpan={6} className="px-5 py-12 text-center text-xs text-ink-500 italic">No attempts yet. Click "+ Demo Data" to test.</td></tr>}
              {filtered.map((a) => {
                const s = students.find((x) => x.id === a.student_id);
                const name = s?.fullname || a.student_name || '—';
                const adm = s?.adm || a.student_adm || '—';
                const total = a.total_questions || 0;
                const current = a.current_question || 0;
                const pct = total > 0 ? Math.round((current / total) * 100) : 0;
                const tones: Record<string, string> = {
                  in_progress: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
                  paused: 'bg-amber-50 text-amber-700 ring-amber-200',
                  submitted: 'bg-blue-50 text-blue-700 ring-blue-200',
                  abandoned: 'bg-red-50 text-red-700 ring-red-200',
                };
                return (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3">
                      <div className="font-medium text-ink-900">{name}</div>
                      <div className="text-[10px] text-ink-500 font-mono">{adm}</div>
                    </td>
                    <td className="px-5 py-3"><div className="text-ink-800">{a.exam_title || '—'}</div><div className="text-[10px] text-ink-500">{a.subject || ''}</div></td>
                    <td className="px-5 py-3"><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-ink-700 ring-1 ring-slate-200">{a.class}{a.stream ? ' ' + a.stream : ''}</span></td>
                    <td className="px-5 py-3">
                      <div className="w-32">
                        <div className="flex items-center justify-between text-[10px] text-ink-500 mb-0.5"><span>{current} / {total || '?'}</span><span>{pct}%</span></div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} /></div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center"><span className="font-bold text-primary-600">{a.score || 0}</span><span className="text-ink-400 text-[10px]">/{a.max_score || 0}</span></td>
                    <td className="px-5 py-3 text-center"><span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ring-1 ${tones[a.status] || tones.in_progress} uppercase tracking-wider`}>{a.status.replace('_', ' ')}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUBMISSIONS
   ═══════════════════════════════════════════════════════════════ */
function SubmissionsTab({ submissions, setSubmissions, session }: { submissions: ScoreSubmission[]; setSubmissions: (s: ScoreSubmission[]) => void; session: AdminSession }) {
  const [filterStatus, setFilterStatus] = useState('');
  const reload = async () => {
    const { data } = await supabase.from('score_submissions').select('*').order('created_at', { ascending: false });
    setSubmissions((data as ScoreSubmission[]) || []);
  };

  const approve = (id: string) => {
    const sub = submissions.find((s) => s.id === id); if (!sub) return;
    openConfirm('Approve Submission?', `${sub.subject} · ${sub.class}${sub.stream ? ' ' + sub.stream : ''} · ${sub.term} Term`, async () => {
      const { error } = await supabase.from('score_submissions').update({ status: 'admin_approved', reviewed_at: new Date().toISOString(), reviewed_by: session.name }).eq('id', id);
      if (error) return showToast('Approve failed: ' + error.message, 'error');
      await reload();
      await logAction('Submission approved', `${sub.subject} · ${sub.class} · ${sub.term}`);
      showToast('Submission approved and published.');
    });
  };

  const filtered = submissions.filter((s) => !filterStatus || s.status === filterStatus);

  return (
    <div className="iris-watermark space-y-5">
      <div className="bg-white rounded-2xl shadow-card ring-1 ring-slate-200/70 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-semibold text-ink-900">Subject Score Submissions</h2></div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none">
            <option value="">All Statuses</option>
            <option value="draft">Draft</option><option value="submitted">Submitted</option><option value="class_approved">Class Approved</option><option value="class_rejected">Rejected</option><option value="admin_approved">Approved</option>
          </select>
        </div>
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-ink-700 text-[11px] uppercase tracking-wider">
              <tr><th className="px-5 py-3">Class</th><th className="px-5 py-3">Stream</th><th className="px-5 py-3">Subject</th><th className="px-5 py-3">Term</th><th className="px-5 py-3">Teacher</th><th className="px-5 py-3 text-center">Status</th><th className="px-5 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!filtered.length && <tr><td colSpan={7} className="px-5 py-12 text-center text-xs text-ink-500 italic">No submissions yet.</td></tr>}
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3 font-medium text-ink-900">{s.class}</td>
                  <td className="px-5 py-3">{s.stream || '—'}</td>
                  <td className="px-5 py-3 text-ink-700">{s.subject}</td>
                  <td className="px-5 py-3">{s.term}</td>
                  <td className="px-5 py-3">{s.teacher_name || '—'}</td>
                  <td className="px-5 py-3 text-center"><span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ring-1 ${STATUS_TONES[s.status] || 'bg-slate-100 text-ink-600 ring-slate-200'} uppercase tracking-wider`}>{STATUS_LABELS[s.status] || s.status}</span></td>
                  <td className="px-5 py-3 text-right">
                    {s.status === 'submitted' || s.status === 'class_approved'
                      ? <button onClick={() => approve(s.id)} className="text-emerald-600 hover:text-emerald-700 font-semibold text-[11px]">Approve</button>
                      : <span className="text-ink-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BROADSHEETS
   ═══════════════════════════════════════════════════════════════ */
function BroadsheetsTab({ broadsheets, setBroadsheets, students, classSubjects, session }: {
  broadsheets: Broadsheet[]; setBroadsheets: (b: Broadsheet[]) => void;
  students: Student[]; classSubjects: ClassSubject[]; session: AdminSession;
}) {
  const reload = async () => {
    const { data } = await supabase.from('broadsheets').select('*').order('class');
    setBroadsheets((data as Broadsheet[]) || []);
  };

  const approve = (id: string) => {
    const b = broadsheets.find((x) => x.id === id); if (!b) return;
    openConfirm('Approve Broadsheet?', `${b.class}${b.stream ? ' ' + b.stream : ''} · ${b.term} Term?`, async () => {
      const { error } = await supabase.from('broadsheets').update({ status: 'approved', approved_by: session.name, approved_at: new Date().toISOString() }).eq('id', id);
      if (error) return showToast('Approve failed: ' + error.message, 'error');
      await reload();
      showToast('Broadsheet approved.');
    });
  };

  const bulkApprove = () => {
    const pending = broadsheets.filter((b) => b.status === 'pending');
    if (!pending.length) return showToast('No pending broadsheets.', 'info');
    openConfirm('Bulk Approve?', `Approve all ${pending.length} pending broadsheets?`, async () => {
      for (const b of pending) {
        await supabase.from('broadsheets').update({ status: 'approved', approved_by: session.name, approved_at: new Date().toISOString() }).eq('id', b.id);
      }
      await reload();
      showToast(`${pending.length} broadsheets approved.`);
    });
  };

  return (
    <div className="iris-watermark space-y-5">
      <div className="bg-white rounded-2xl shadow-card ring-1 ring-slate-200/70 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-semibold text-ink-900">Class Broadsheets — Approval</h2></div>
          <button onClick={bulkApprove} className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-sm">Bulk Approve Pending</button>
        </div>
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-ink-700 text-[11px] uppercase tracking-wider">
              <tr><th className="px-5 py-3">Class</th><th className="px-5 py-3">Stream</th><th className="px-5 py-3">Term</th><th className="px-5 py-3 text-center">Students</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!broadsheets.length && <tr><td colSpan={6} className="px-5 py-12 text-center text-xs text-ink-500 italic">No broadsheets yet.</td></tr>}
              {broadsheets.map((b) => {
                const tone = b.status === 'approved' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : b.status === 'pending' ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-slate-100 text-ink-600 ring-slate-200';
                return (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3 font-semibold">{b.class}</td>
                    <td className="px-5 py-3">{b.stream || '—'}</td>
                    <td className="px-5 py-3">{b.term}</td>
                    <td className="px-5 py-3 text-center">{b.student_count}</td>
                    <td className="px-5 py-3"><span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ring-1 ${tone} uppercase tracking-wider`}>{b.status.replace('_', ' ')}</span></td>
                    <td className="px-5 py-3 text-right">
                      {b.status === 'pending' && <button onClick={() => approve(b.id)} className="text-emerald-600 hover:text-emerald-700 font-semibold text-[11px]">Approve</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AUDIT
   ═══════════════════════════════════════════════════════════════ */
function AuditTab({ auditLog, setAuditLog }: { auditLog: AuditItem[]; setAuditLog: (a: AuditItem[]) => void }) {
  const clearAudit = () => {
    openConfirm('Clear Audit Log?', 'All audit history will be permanently deleted.', async () => {
      const { error } = await supabase.from('audit_log').delete().neq('id', 0);
      if (error) return showToast('Failed: ' + error.message, 'error');
      setAuditLog([]);
      showToast('Audit log cleared.', 'warn');
    });
  };

  return (
    <div className="iris-watermark space-y-5">
      <div className="bg-white rounded-2xl shadow-card ring-1 ring-slate-200/70 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-semibold text-ink-900">Audit Log</h2><p className="text-xs text-ink-500 mt-0.5">Every action timestamped and traceable.</p></div>
          <button onClick={clearAudit} className="text-xs font-semibold text-ink-600 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">Clear Log</button>
        </div>
        <ol className="p-5 space-y-3 max-h-[600px] overflow-y-auto scroll-thin">
          {!auditLog.length && <li className="text-center py-10 text-xs text-ink-500 italic">No actions logged yet.</li>}
          {auditLog.map((a, i) => (
            <li key={i} className="flex items-start gap-3 p-3 rounded-xl ring-1 ring-slate-200 bg-white">
              <div className="w-8 h-8 rounded-lg bg-primary-50 ring-1 ring-primary-100 flex items-center justify-center shrink-0"><Icon name="history" className="w-4 h-4 text-primary-600" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-ink-900">{a.action}</p>
                {a.detail && <p className="text-[11px] text-ink-500 mt-0.5">{a.detail}</p>}
                <p className="text-[10px] text-ink-500 mt-1">{new Date(a.created_at).toLocaleString()} · {a.actor_name || 'SYSTEM'}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SETTINGS + SUBADMINS
   ═══════════════════════════════════════════════════════════════ */
function SettingsTab({ subAdmins, setSubAdmins, session }: { subAdmins: SubAdmin[]; setSubAdmins: (s: SubAdmin[]) => void; session: AdminSession }) {
  const [addOpen, setAddOpen] = useState(false);

  const reload = async () => {
    const { data } = await supabase.from('sub_admins').select('*').order('created_at', { ascending: false });
    setSubAdmins((data as SubAdmin[]) || []);
  };

  const toggleStatus = async (admin_id: string) => {
    const s = subAdmins.find((x) => x.admin_id === admin_id); if (!s) return;
    const newStatus = s.status === 'active' ? 'suspended' : 'active';
    await supabase.from('sub_admins').update({ status: newStatus }).eq('admin_id', admin_id);
    await reload();
    showToast(`${s.name} is now ${newStatus}.`, 'info');
  };

  const deleteSubAdmin = (admin_id: string) => {
    const s = subAdmins.find((x) => x.admin_id === admin_id); if (!s) return;
    openConfirm('Delete Sub-Admin?', `Remove ${s.name}?`, async () => {
      const { error } = await supabase.from('sub_admins').delete().eq('admin_id', admin_id);
      if (error) return showToast('Delete failed: ' + error.message, 'error');
      await reload();
      showToast('Sub-admin removed.', 'warn');
    });
  };

  const roleLabels: Record<string, string> = { full: 'Full Admin', exam_officer: 'Exam Officer', records_officer: 'Records Officer', readonly: 'Read-Only' };

  return (
    <div className="iris-watermark space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl shadow-card ring-1 ring-slate-200/70 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="font-semibold text-ink-900">School Identity</h2>
              <p className="text-xs text-ink-500 mt-0.5">Appears on report cards.</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); showToast('Settings saved.'); }} className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">School Name</label>
                <input defaultValue="IBADU RAHMAN INTERNATIONAL SCHOOL" className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" /></div>
              <div className="sm:col-span-2"><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Motto</label>
                <input defaultValue="Quest for Excellence" className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" /></div>
              <div className="sm:col-span-2"><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Address</label>
                <input defaultValue="57, Unity Street, Papa Ibafo, Ogun State" className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" /></div>
              <div className="sm:col-span-2 flex justify-end">
                <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm">Save Settings</button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-card ring-1 ring-slate-200/70 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="font-semibold text-ink-900">Access Control · Sub-Admins</h2></div>
              <button onClick={() => setAddOpen(true)} className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-3.5 py-2 rounded-xl text-xs shadow-sm">+ Add Sub-Admin</button>
            </div>
            <div className="overflow-x-auto scroll-thin">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-ink-700 text-[11px] uppercase tracking-wider">
                  <tr><th className="px-5 py-3">Admin ID</th><th className="px-5 py-3">Name</th><th className="px-5 py-3">Password</th><th className="px-5 py-3 text-center">Status</th><th className="px-5 py-3 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {!subAdmins.length && <tr><td colSpan={5} className="px-5 py-10 text-center text-xs text-ink-500 italic">No sub-admins yet.</td></tr>}
                  {subAdmins.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3 font-mono font-semibold text-primary-600">{s.admin_id}</td>
                      <td className="px-5 py-3 font-medium">{s.name}</td>
                      <td className="px-5 py-3 font-mono text-emerald-700">{s.password}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.status === 'active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-100 text-ink-600 ring-1 ring-slate-200'} uppercase tracking-wider`}>{s.status}</span>
                        <div className="text-[10px] text-ink-500 mt-0.5">{roleLabels[s.role] || s.role}</div>
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <button onClick={() => toggleStatus(s.admin_id)} className="text-primary-600 hover:text-primary-700 font-semibold text-[11px] mr-2">{s.status === 'active' ? 'Suspend' : 'Activate'}</button>
                        <button onClick={() => deleteSubAdmin(s.admin_id)} className="text-red-600 hover:text-red-700 font-semibold text-[11px]">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl shadow-card ring-1 ring-slate-200/70 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100"><h2 className="font-semibold text-ink-900">Connection</h2></div>
            <div className="p-5 space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-ink-500">Project</span><span className="font-mono font-semibold text-ink-900">iris-cbt</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Realtime</span><span className="font-semibold text-emerald-600">Connected</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Version</span><span className="text-ink-700">v9.0</span></div>
            </div>
          </div>
        </div>
      </div>

      {addOpen && (
        <AddSubAdminModal onClose={() => setAddOpen(false)} onSaved={async () => { await reload(); setAddOpen(false); }} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ADD SUB-ADMIN MODAL
   ═══════════════════════════════════════════════════════════════ */
function AddSubAdminModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let p = ''; for (let i = 0; i < 10; i++) p += chars[Math.floor(Math.random() * chars.length)];
    return p;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
    const admin_id = (form.elements.namedItem('admin_id') as HTMLInputElement).value.trim().toUpperCase();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const role = (form.elements.namedItem('role') as HTMLSelectElement).value;
    const { error } = await supabase.from('sub_admins').insert({ admin_id, name, password, role, status: 'active' });
    if (error) return showToast('Create failed: ' + error.message, 'error');
    await logAction('Sub-admin created', `${name} (${admin_id})`);
    showToast(`Sub-admin ${name} created.`);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-ink-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-pop ring-1 ring-slate-200 max-w-md w-full fade-in overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-ink-900">Create Sub-Admin</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Full Name</label>
            <input name="name" required className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" /></div>
          <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Admin ID</label>
            <input name="admin_id" required placeholder="ADMIN-002" className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none" /></div>
          <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Password</label>
            <input name="password" required minLength={6} defaultValue={generatePassword()} className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" /></div>
          <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Role</label>
            <select name="role" className="w-full text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none">
              <option value="full">Full Admin</option><option value="exam_officer">Exam Officer</option><option value="records_officer">Records Officer</option><option value="readonly">Read-Only</option>
            </select></div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-700 hover:bg-slate-100">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUBSCRIPTION
   ═══════════════════════════════════════════════════════════════ */
function SubscriptionTab({ subscription, setSubscription, session }: { subscription: SubscriptionData; setSubscription: (s: SubscriptionData) => void; session: AdminSession }) {
  const reload = async () => {
    const { data: schoolRow } = await supabase.from('schools').select('*').eq('slug', 'iris').maybeSingle();
    let payments: any[] = [];
    if (schoolRow?.id) {
      const { data: p } = await supabase.from('subscription_payments').select('*').eq('school_id', schoolRow.id).order('submitted_at', { ascending: false });
      payments = p || [];
    }
    const { data: bank } = await supabase.from('payment_accounts').select('*').eq('is_active', true).order('display_order');
    const { data: settingsData } = await supabase.from('platform_settings').select('*');
    const settings: Record<string, string> = {};
    (settingsData || []).forEach((s: any) => (settings[s.key] = s.value));
    setSubscription({ school: schoolRow || null, payments, bankAccounts: bank || [], settings });
  };

  const submitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    const school = subscription.school;
    if (!school) return showToast('School record not found.', 'error');
    const form = e.target as HTMLFormElement;
    const term = (form.elements.namedItem('term') as HTMLSelectElement).value;
    const amount = Number((form.elements.namedItem('amount') as HTMLInputElement).value) || 0;
    const reference = (form.elements.namedItem('reference') as HTMLInputElement).value.trim();
    const proof_url = (form.elements.namedItem('proof') as HTMLInputElement).value.trim();
    if (!reference || !proof_url) return showToast('Reference and proof URL required.', 'error');
    const { error } = await supabase.from('subscription_payments').insert({
      school_id: school.id, amount, term, session: '2025/2026', reference, proof_url, status: 'pending', submitted_by: session.name,
    });
    if (error) return showToast('Failed: ' + error.message, 'error');
    showToast('Payment proof submitted. Awaiting vendor approval.');
    await reload();
  };

  const school = subscription.school;
  const days = school?.subscription_end_date ? Math.ceil((new Date(school.subscription_end_date + 'T23:59:59').getTime() - Date.now()) / 86400000) : null;

  return (
    <div className="iris-watermark space-y-5">
      {days !== null && days < 0 && (
        <div className="bg-red-50 rounded-2xl shadow-card ring-1 ring-red-200 p-6">
          <h3 className="text-base font-bold text-red-900">🔴 Subscription Expired</h3>
          <p className="text-xs text-red-800 mt-1">Renew now to restore CBT access.</p>
        </div>
      )}
      {days !== null && days >= 0 && (
        <div className={`rounded-2xl shadow-card ring-1 p-6 ${days <= 14 ? 'bg-amber-50 ring-amber-200' : 'bg-emerald-50 ring-emerald-200'}`}>
          <h3 className={`text-base font-bold ${days <= 14 ? 'text-amber-900' : 'text-emerald-900'}`}>
            Subscription Active — {days} days remaining
          </h3>
          <p className={`text-xs mt-1 ${days <= 14 ? 'text-amber-800' : 'text-emerald-800'}`}>
            Expires: {formatDate(school?.subscription_end_date)} · Plan: {school?.subscription_plan || '—'} Term
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl shadow-card ring-1 ring-slate-200/70 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100"><h2 className="font-semibold text-ink-900">Current Subscription</h2></div>
            <div className="p-6">
              {school?.subscription_end_date ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-4 rounded-xl bg-slate-50 ring-1 ring-slate-200"><p className="text-[10px] uppercase tracking-wider font-bold text-ink-500">Status</p><p className="text-base font-bold mt-0.5">{days! >= 0 ? '🟢 Active' : '🔴 Expired'}</p></div>
                  <div className="p-4 rounded-xl bg-slate-50 ring-1 ring-slate-200"><p className="text-[10px] uppercase tracking-wider font-bold text-ink-500">Plan</p><p className="text-base font-bold mt-0.5">{school.subscription_plan || '—'} Term</p></div>
                  <div className="p-4 rounded-xl bg-slate-50 ring-1 ring-slate-200"><p className="text-[10px] uppercase tracking-wider font-bold text-ink-500">Expires</p><p className="text-base font-bold mt-0.5">{formatDate(school.subscription_end_date)}</p></div>
                  <div className="p-4 rounded-xl bg-slate-50 ring-1 ring-slate-200"><p className="text-[10px] uppercase tracking-wider font-bold text-ink-500">Days Remaining</p><p className="text-base font-bold text-primary-600 mt-0.5">{days! >= 0 ? days : 0}</p></div>
                </div>
              ) : (
                <p className="text-sm text-ink-500 italic">No active subscription yet. Choose a plan below.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card ring-1 ring-slate-200/70 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100"><h2 className="font-semibold text-ink-900">Payment History</h2></div>
            <div className="overflow-x-auto scroll-thin">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-ink-700 text-[11px] uppercase tracking-wider">
                  <tr><th className="px-5 py-3">Date</th><th className="px-5 py-3">Term</th><th className="px-5 py-3 text-right">Amount</th><th className="px-5 py-3">Reference</th><th className="px-5 py-3 text-center">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {!subscription.payments.length && <tr><td colSpan={5} className="px-5 py-10 text-center text-xs text-ink-500 italic">No payments submitted yet.</td></tr>}
                  {subscription.payments.map((p: any) => {
                    const tone = p.status === 'approved' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : p.status === 'rejected' ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-amber-50 text-amber-700 ring-amber-200';
                    return (
                      <tr key={p.id}>
                        <td className="px-5 py-3 text-ink-600 text-[11px]">{new Date(p.submitted_at).toLocaleDateString()}</td>
                        <td className="px-5 py-3">{p.term} · {p.session}</td>
                        <td className="px-5 py-3 text-right font-mono font-bold">{formatNaira(p.amount)}</td>
                        <td className="px-5 py-3 font-mono text-ink-600 text-[11px] truncate max-w-[180px]">{p.reference || '—'}</td>
                        <td className="px-5 py-3 text-center"><span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ring-1 ${tone} uppercase tracking-wider`}>{p.status}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl shadow-card ring-1 ring-slate-200/70 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100"><h2 className="font-semibold text-ink-900">Bank Transfer Details</h2></div>
            <div className="p-5 space-y-3">
              {!subscription.bankAccounts.length && <p className="text-xs text-ink-500 italic">No bank accounts configured.</p>}
              {subscription.bankAccounts.map((a: any) => (
                <div key={a.id} className="p-4 rounded-xl bg-slate-50 ring-1 ring-slate-200">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-ink-500">{a.bank_name}</p>
                  <p className="text-lg font-mono font-bold text-ink-900 mt-1">{a.account_number}</p>
                  <p className="text-xs text-ink-600 mt-0.5">{a.account_name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card ring-1 ring-slate-200/70 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100"><h2 className="font-semibold text-ink-900">Submit Payment Proof</h2></div>
        <form onSubmit={submitProof} className="p-6 space-y-4 max-w-2xl">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Term</label>
              <select name="term" className="w-full text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                <option value="1st">1st Term — ₦250,000</option><option value="2nd">2nd Term — ₦250,000</option><option value="3rd">3rd Term — ₦250,000</option>
              </select></div>
            <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Amount (₦)</label>
              <input name="amount" type="number" required defaultValue="250000" className="w-full text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none" /></div>
          </div>
          <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Bank Transfer Reference</label>
            <input name="reference" required placeholder="e.g. FBN-20251004-XXXX" className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none" /></div>
          <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-700 mb-1.5">Proof URL</label>
            <input name="proof" required placeholder="https://drive.google.com/..." className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" /></div>
          <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm">Submit Payment Proof</button>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   END OF FILE
   ═══════════════════════════════════════════════════════════════
   File complete. All tabs, modals, and helpers defined.
   Total: AdminPage (main) + 13 tab components + 5 modals + 1 icon set.
   ═══════════════════════════════════════════════════════════════ */