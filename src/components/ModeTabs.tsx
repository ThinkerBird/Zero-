import React from 'react';
import { Lock, Unlock, FileText, Files } from 'lucide-react';
import { AppMode, PayloadType } from '../types';

interface ModeTabsProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  type: PayloadType;
  onTypeChange: (type: PayloadType) => void;
}

export const ModeTabs: React.FC<ModeTabsProps> = ({
  mode,
  onModeChange,
  type,
  onTypeChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* Primary Mode: Encrypt / Decrypt Segmented Control */}
      <div
        className="flex items-center p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)]"
        role="tablist"
        aria-label="Crypto Mode"
      >
        <button
          role="tab"
          aria-selected={mode === 'encrypt'}
          onClick={() => onModeChange('encrypt')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all min-h-[44px] sm:min-h-0 focus-ring ${
            mode === 'encrypt'
              ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Encrypt</span>
        </button>

        <button
          role="tab"
          aria-selected={mode === 'decrypt'}
          onClick={() => onModeChange('decrypt')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all min-h-[44px] sm:min-h-0 focus-ring ${
            mode === 'decrypt'
              ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Unlock className="w-3.5 h-3.5" />
          <span>Decrypt</span>
        </button>
      </div>

      {/* Secondary Payload Type: File / Text Segmented Control */}
      <div
        className="flex items-center p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] self-start sm:self-auto w-full sm:w-auto"
        role="tablist"
        aria-label="Payload Type"
      >
        <button
          role="tab"
          aria-selected={type === 'text'}
          onClick={() => onTypeChange('text')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[44px] sm:min-h-0 focus-ring ${
            type === 'text'
              ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Text</span>
        </button>

        <button
          role="tab"
          aria-selected={type === 'file'}
          onClick={() => onTypeChange('file')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[44px] sm:min-h-0 focus-ring ${
            type === 'file'
              ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Files className="w-3.5 h-3.5" />
          <span>Files</span>
        </button>
      </div>
    </div>
  );
};
