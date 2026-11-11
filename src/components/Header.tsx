import React from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun, Contrast, Trash2 } from 'lucide-react';
import { AppTheme } from '../types';

interface HeaderProps {
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  onEmergencyWipe: () => void;
  inactivityRemaining?: number;
  autoClearEnabled: boolean;
  onToggleAutoClear: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onThemeChange,
  onEmergencyWipe,
  inactivityRemaining,
  autoClearEnabled,
  onToggleAutoClear,
}) => {
  return (
    <header className="w-full bg-transparent transition-colors">
      <div className="max-w-3xl mx-auto px-4 pt-6 sm:pt-8 pb-2 flex items-center justify-between gap-3">
        {/* Brand Header */}
        <Link to="/encrypt" className="flex flex-col group">
          <span className="zero-logo-spooky text-2xl sm:text-3xl cursor-pointer">
            Zero 👻
          </span>
          <p className="text-[11px] text-[var(--text-muted)] hidden sm:block mt-0.5">
            Client-Side Web Crypto · No Server Telemetry
          </p>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Auto-clear inactivity pill */}
          <button
            onClick={onToggleAutoClear}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              autoClearEnabled
                ? 'border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                : 'border-transparent text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
            }`}
            title="Auto-clears sensitive data after 60s of inactivity"
            aria-label="Toggle auto-clear inactivity timer"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                autoClearEnabled ? 'bg-[var(--color-success)]' : 'bg-[var(--text-muted)]'
              }`}
            />
            <span className="text-[11px]">
              {autoClearEnabled
                ? `Auto-clear: ${inactivityRemaining ?? 60}s`
                : 'Auto-clear: Off'}
            </span>
          </button>

          {/* Emergency Wipe Button */}
          <button
            onClick={onEmergencyWipe}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-bg)] border border-transparent hover:border-[var(--color-error)]/30 transition-all focus-ring"
            title="Emergency Wipe (Ctrl+Shift+L)"
            aria-label="Emergency Wipe buffer (Shortcut: Ctrl+Shift+L)"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Theme Switcher Segmented Control */}
          <div
            className="flex items-center p-0.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)]"
            role="radiogroup"
            aria-label="Color Theme"
          >
            <button
              onClick={() => onThemeChange('neural')}
              role="radio"
              aria-checked={theme === 'neural'}
              className={`p-1.5 rounded-md transition-all ${
                theme === 'neural'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
              title="Neural Dark Theme"
              aria-label="Switch to Neural Dark Theme"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onThemeChange('high-contrast')}
              role="radio"
              aria-checked={theme === 'high-contrast'}
              className={`p-1.5 rounded-md transition-all ${
                theme === 'high-contrast'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
              title="High Contrast OLED Theme"
              aria-label="Switch to High Contrast OLED Theme"
            >
              <Contrast className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onThemeChange('minimalist')}
              role="radio"
              aria-checked={theme === 'minimalist'}
              className={`p-1.5 rounded-md transition-all ${
                theme === 'minimalist'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
              title="Minimalist Light Theme"
              aria-label="Switch to Minimalist Light Theme"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
