import React from 'react';
import { Clipboard, FileCode, RotateCcw } from 'lucide-react';
import { AppMode } from '../types';

interface TextPanelProps {
  mode: AppMode;
  text: string;
  onTextChange: (text: string) => void;
  onPaste: () => void;
  onClear: () => void;
}

export const TextPanel: React.FC<TextPanelProps> = ({
  mode,
  text,
  onTextChange,
  onPaste,
  onClear,
}) => {
  const isEncrypt = mode === 'encrypt';

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5 shadow-[var(--shadow-card)] space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-[var(--accent)]" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            {isEncrypt ? 'Source Plaintext' : 'Encrypted Base64 Payload'}
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Character / Byte count */}
          <span className="text-[11px] font-mono-code text-[var(--text-muted)] mr-1">
            {text.length.toLocaleString()} {text.length === 1 ? 'char' : 'chars'}
          </span>

          {/* Paste button */}
          <button
            type="button"
            onClick={onPaste}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] transition-colors focus-ring"
            title="Paste from clipboard"
            aria-label="Paste from clipboard"
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>Paste</span>
          </button>

          {/* Clear button */}
          {text && (
            <button
              type="button"
              onClick={onClear}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--bg-hover)] transition-colors focus-ring"
              title="Clear input"
              aria-label="Clear input"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          rows={6}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={
            isEncrypt
              ? 'Type or paste the sensitive text, credentials, notes, or JSON to encrypt...'
              : 'Paste the Base64 ciphertext block to decrypt...'
          }
          className="w-full p-3.5 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-xs sm:text-sm font-mono-code leading-relaxed resize-y focus-ring transition-colors"
          spellCheck={false}
          aria-label={isEncrypt ? 'Plaintext content to encrypt' : 'Ciphertext content to decrypt'}
        />
      </div>
    </div>
  );
};
