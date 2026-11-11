import React, { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

interface UpdateToastProps {
  isProcessing: boolean;
}

export const UpdateToast: React.FC<UpdateToastProps> = ({ isProcessing }) => {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('zero_update_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        // Check for updates every 60 minutes
        setInterval(() => {
          registration.update().catch(() => {});
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.warn('Zero Service Worker registration error:', error);
    },
  });

  // Never show update toasts in local development mode or if dismissed this session
  if (import.meta.env.DEV || dismissed || !needRefresh) {
    return null;
  }

  const handleReload = () => {
    if (isProcessing) return;
    try {
      sessionStorage.removeItem('zero_update_dismissed');
    } catch {}
    updateServiceWorker(true);
  };

  const handleDismiss = () => {
    setNeedRefresh(false);
    setDismissed(true);
    try {
      sessionStorage.setItem('zero_update_dismissed', 'true');
    } catch {}
  };

  return (
    <div
      className="fixed bottom-4 left-4 z-50 pointer-events-none"
      aria-live="polite"
    >
      <div
        className="pointer-events-auto flex items-center gap-2.5 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-lg backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 text-xs"
        role="status"
      >
        <span className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0 animate-pulse" />
        <span className="font-medium text-[var(--text-primary)]">
          {isProcessing ? 'Update available (finish task first)' : 'Update available'}
        </span>

        <div className="flex items-center gap-1.5 ml-1">
          <button
            onClick={handleReload}
            disabled={isProcessing}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg text-[var(--accent-text)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors focus-ring ${
              isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
            title={isProcessing ? 'Finish current task first' : 'Reload to apply update'}
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reload</span>
          </button>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors focus-ring"
            aria-label="Dismiss update notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
