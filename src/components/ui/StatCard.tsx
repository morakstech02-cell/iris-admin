import { type ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  accent?: 'primary' | 'emerald' | 'amber' | 'red' | 'purple' | 'blue';
  note?: string;
  icon?: ReactNode;
}

const TONES: Record<string, string> = {
  primary: 'text-primary-600',
  emerald: 'text-emerald-600',
  amber: 'text-amber-600',
  red: 'text-red-600',
  purple: 'text-purple-600',
  blue: 'text-blue-600',
};

export function StatCard({ label, value, accent = 'primary', note, icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-card ring-1 ring-slate-200/70">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
          {label}
        </p>
        {icon && <div className="text-ink-300">{icon}</div>}
      </div>
      <p className={`text-2xl font-bold mt-1 ${TONES[accent]}`}>{value}</p>
      {note && <p className="text-[11px] text-ink-500 mt-0.5">{note}</p>}
    </div>
  );
}