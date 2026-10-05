export const ADMIN_TABS = [
  {
    group: 'Overview',
    items: [{ href: '/portal/admin#dashboard', label: 'Dashboard', icon: 'dashboard' }],
  },
  {
    group: 'People',
    items: [
      { href: '/portal/admin#students', label: 'Students', icon: 'users' },
      { href: '/portal/admin#teachers', label: 'Teachers', icon: 'teacher' },
    ],
  },
  {
    group: 'Academics',
    items: [
      { href: '/portal/admin#classes', label: 'Class Subjects', icon: 'list' },
      { href: '/portal/admin#terms', label: 'Term Calendar', icon: 'calendar' },
      { href: '/portal/admin#questions', label: 'Question Bank', icon: 'help' },
      { href: '/portal/admin#exams', label: 'Exams', icon: 'clock' },
    ],
  },
  {
    group: 'Live & Review',
    items: [
      { href: '/portal/admin#live-cbt', label: 'Live CBT Monitor', icon: 'radio', badge: 'live' as const },
      { href: '/portal/admin#submissions', label: 'Submissions', icon: 'wave' },
      { href: '/portal/admin#reports', label: 'Broadsheets', icon: 'grid' },
    ],
  },
  {
    group: 'System',
    items: [
      { href: '/portal/admin#audit', label: 'Audit Log', icon: 'history' },
      { href: '/portal/admin#settings', label: 'Settings & Access', icon: 'cog' },
      { href: '/portal/admin#subscription', label: 'Subscription', icon: 'card', badge: 'sub' as const },
    ],
  },
] as const;