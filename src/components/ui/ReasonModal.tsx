'use client';

import { useEffect, useState } from 'react';
import { Modal } from './Modal';

interface ReasonModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  title: string;
  subtitle?: string;
  placeholder?: string;
  confirmLabel?: string;
  loading?: boolean;
}

export function ReasonModal({
  open,
  onClose,
  onSubmit,
  title,
  subtitle,
  placeholder = 'Type your reason here…',
  confirmLabel = 'Confirm',
  loading = false,
}: ReasonModalProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setText('');
      setError('');
    }
  }, [open]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Please enter a reason.');
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <Modal open={open} onClose={onClose} size="md">
      <div className="px-6 py-5 border-b border-slate-100">
        <h3 className="font-semibold text-ink-900">{title}</h3>
        {subtitle && <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="p-6 space-y-4">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError('');
          }}
          rows={3}
          placeholder={placeholder}
          autoFocus
          className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 outline-none resize-none"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-700 hover:bg-slate-100 transition disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm transition disabled:opacity-60"
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}