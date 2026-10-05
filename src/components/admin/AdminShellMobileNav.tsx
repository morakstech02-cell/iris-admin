'use client';

import { ADMIN_TABS } from '@/lib/config';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  currentHash: string;
  onClose: () => void;
}

export function AdminShellMobileNav({ open, currentHash, onClose }: Props) {
  if (!open) return null;

  const allTabs = ADMIN_TABS.flatMap((g) => g.items);

  return (
    <div className="lg:hidden border-t border-slate-200 bg-white px-3 py-2 overflow-x-auto scroll-thin">
      <div className="flex gap-1.5 min-w-max">
        {allTabs.map((item) => {
          const tabKey = item.href.split('#')[1] || 'dashboard';
          const active = currentHash === tabKey;
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'whitespace-nowrap px-3 py-2 rounded-lg text-xs font-medium transition',
                active ? 'bg-primary-600 text-white' : 'text-ink-700 hover:bg-slate-100'
              )}
            >
              {item.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}