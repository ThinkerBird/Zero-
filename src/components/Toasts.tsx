import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastsProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toasts: React.FC<ToastsProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-xs sm:max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        let borderClass = 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)]';
        let iconColor = 'text-[var(--accent)]';
        let Icon = Info;

        if (toast.type === 'success') {
          borderClass = 'border-[var(--color-success)]/30 bg-[var(--bg-surface)] text-[var(--text-primary)]';
          iconColor = 'text-[var(--color-success)]';
          Icon = CheckCircle2;
        } else if (toast.type === 'error') {
          borderClass = 'border-[var(--color-error)]/30 bg-[var(--bg-surface)] text-[var(--text-primary)]';
          iconColor = 'text-[var(--color-error)]';
          Icon = AlertCircle;
        } else if (toast.type === 'warning') {
          borderClass = 'border-[var(--color-warning)]/30 bg-[var(--bg-surface)] text-[var(--text-primary)]';
          iconColor = 'text-[var(--color-warning)]';
          Icon = AlertTriangle;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-xl border shadow-[var(--shadow-card)] backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${borderClass}`}
            role="status"
          >
            <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold tracking-tight text-[var(--text-primary)]">
                {toast.title}
              </div>
              {toast.message && (
                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 break-words">
                  {toast.message}
                </div>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 rounded transition-colors focus-ring"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
