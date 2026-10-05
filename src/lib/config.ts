export const CFG = {
  CURRENT_SESSION: '2025/2026',
  SESSION_TIMEOUT_MS: 30 * 60 * 1000,
  LIVE_REFRESH_MS: 30 * 1000,
  SCHOOL_SLUG: 'iris',
  JSS: ['JSS1', 'JSS2', 'JSS3'] as const,
  SS: ['SS1', 'SS2', 'SS3'] as const,
  STREAMS: ['Science', 'Arts', 'Commercial'] as const,
};

export const ALL_CLASSES = [...CFG.JSS, ...CFG.SS];
export type ClassName = (typeof CFG.JSS)[number] | (typeof CFG.SS)[number];
export type Stream = (typeof CFG.STREAMS)[number];

// ─────────────────────────────────────────────────────────────
// School admin sidebar tabs
// ─────────────────────────────────────────────────────────────
export const ADMIN_TABS = [
  {
    group: 'Overview',
    items: [{ href: '/portal/admin', label: 'Dashboard', icon: 'dashboard' }],
  },
  {
    group: 'People',
    items: [
      { href: '/portal/admin/students', label: 'Students', icon: 'users' },
      { href: '/portal/admin/teachers', label: 'Teachers', icon: 'teacher' },
    ],
  },
  {
    group: 'Academics',
    items: [
      { href: '/portal/admin/classes', label: 'Class Subjects', icon: 'list' },
      { href: '/portal/admin/terms', label: 'Term Calendar', icon: 'calendar' },
      { href: '/portal/admin/questions', label: 'Question Bank', icon: 'help' },
      { href: '/portal/admin/exams', label: 'Exams', icon: 'clock' },
    ],
  },
  {
    group: 'Live & Review',
    items: [
      { href: '/portal/admin/live-cbt', label: 'Live CBT Monitor', icon: 'radio', badge: 'live' as const },
      { href: '/portal/admin/submissions', label: 'Submissions', icon: 'wave' },
      { href: '/portal/admin/reports', label: 'Broadsheets', icon: 'grid' },
    ],
  },
  {
    group: 'System',
    items: [
      { href: '/portal/admin/audit', label: 'Audit Log', icon: 'history' },
      { href: '/portal/admin/settings', label: 'Settings & Access', icon: 'cog' },
      { href: '/portal/admin/subscription', label: 'Subscription', icon: 'card', badge: 'sub' as const },
    ],
  },
] as const;

// ─────────────────────────────────────────────────────────────
// Vendor sidebar tabs
// ─────────────────────────────────────────────────────────────
export const VENDOR_TABS = [
  {
    group: 'Platform',
    items: [
      { href: '/portal/vendor', label: 'Dashboard', icon: 'dashboard' },
      { href: '/portal/vendor/schools', label: 'All Schools', icon: 'building' },
      { href: '/portal/vendor/subscriptions', label: 'Payments', icon: 'card' },
    ],
  },
  {
    group: 'Control',
    items: [
      { href: '/portal/vendor/audit', label: 'Platform Audit', icon: 'history' },
      { href: '/portal/vendor/settings', label: 'Global Settings', icon: 'cog' },
    ],
  },
] as const;

// ─────────────────────────────────────────────────────────────
// Status labels + colors
// ─────────────────────────────────────────────────────────────
export const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  class_review: 'Class Review',
  class_approved: 'Class Approved',
  class_rejected: 'Rejected by Class',
  admin_approved: 'Approved',
  admin_rejected: 'Rejected by Admin',
};

export const STATUS_TONES: Record<string, string> = {
  draft: 'bg-slate-100 text-ink-600 ring-slate-200',
  submitted: 'bg-blue-50 text-blue-700 ring-blue-200',
  class_review: 'bg-amber-50 text-amber-700 ring-amber-200',
  class_approved: 'bg-purple-50 text-purple-700 ring-purple-200',
  class_rejected: 'bg-red-50 text-red-700 ring-red-200',
  admin_approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  admin_rejected: 'bg-red-50 text-red-700 ring-red-200',
};