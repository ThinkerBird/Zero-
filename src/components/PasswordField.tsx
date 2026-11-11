import React, { useState, useRef } from 'react';
import { Eye, EyeOff, Copy, Dices, Check, KeyRound, FileKey, X, Sparkles } from 'lucide-react';
import { PasswordStrength } from '../lib/crypto';
import { StrengthMeter } from './StrengthMeter';

interface PasswordFieldProps {
  password: string;
  onPasswordChange: (value: string) => void;
  onGeneratePassword: () => void;
  strength: PasswordStrength;
  isEncryptMode: boolean;
  keyfile: File | null;
  keyfileFingerprint: string | null;
  onAttachKeyfile: (file: File) => void;
  onRemoveKeyfile: () => void;
  onGenerateKeyfile: () => void;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  password,
  onPasswordChange,
  onGeneratePassword,
  strength,
  isEncryptMode,
  keyfile,
  keyfileFingerprint,
  onAttachKeyfile,
  onRemoveKeyfile,
  onGenerateKeyfile,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onAttachKeyfile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5 shadow-[var(--shadow-card)] space-y-3">
      {/* Header & Algorithm Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[var(--accent)]" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            {isEncryptMode ? 'Encryption Key / Password' : 'Decryption Password'}
          </h2>
        </div>

        {/* Algorithm Badge */}
        <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)] font-medium">
          AES-256-GCM
        </span>
      </div>

      {/* Input Field with integrated inline actions */}
      <div className="relative flex items-center">
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder={
            isEncryptMode
              ? keyfile
                ? 'Optional: Add passphrase for Dual-Factor 2FA...'
                : 'Enter or generate a high-entropy passphrase...'
              : keyfile
              ? 'Enter passphrase (if one was used with keyfile)...'
              : 'Enter the passphrase used during encryption...'
          }
          className="w-full pl-3.5 pr-28 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm font-mono-code focus-ring transition-colors"
          autoComplete="off"
          spellCheck={false}
          aria-label="Secret Passphrase"
        />

        {/* Inline Icon Buttons */}
        <div className="absolute right-1.5 flex items-center gap-0.5">
          {/* Generate Password (Dice button) */}
          {isEncryptMode && (
            <button
              type="button"
              onClick={onGeneratePassword}
              className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-hover)] transition-colors focus-ring"
              title="Generate 24-character cryptographic password"
              aria-label="Generate random secure password"
            >
              <Dices className="w-4 h-4" />
            </button>
          )}

          {/* Copy Password */}
          <button
            type="button"
            onClick={handleCopy}
            disabled={!password}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-30 disabled:pointer-events-none transition-colors focus-ring"
            title={copied ? 'Copied to clipboard' : 'Copy password'}
            aria-label="Copy password to clipboard"
          >
            {copied ? (
              <Check className="w-4 h-4 text-[var(--color-success)]" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          {/* Show / Hide Toggle */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors focus-ring"
            title={showPassword ? 'Hide password' : 'Show password'}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* 4-segment strength meter (in encrypt mode or when password is typed) */}
      <StrengthMeter strength={strength} visible={Boolean(password)} />

      {/* Keyfile Enhancement Option (2FA) */}
      <div className="pt-2 border-t border-[var(--border-subtle)]">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInput}
          className="hidden"
        />

        {keyfile ? (
          <div className="space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--accent-border)] bg-[var(--accent-subtle)]/40 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileKey className="w-4 h-4 text-[var(--accent)] shrink-0" />
                <div className="min-w-0">
                  <div className="font-mono-code font-semibold text-[var(--text-primary)] truncate">
                    {keyfile.name}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono-code truncate">
                    {formatFileSize(keyfile.size)} · SHA-256:{' '}
                    {keyfileFingerprint ? `${keyfileFingerprint.substring(0, 16)}...` : 'computing...'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onRemoveKeyfile}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--bg-hover)] transition-colors shrink-0 focus-ring"
                title="Detach keyfile"
                aria-label="Detach keyfile"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-[var(--accent)] flex items-center gap-1 font-medium">
              <Sparkles className="w-3 h-3 shrink-0" />
              <span>
                {isEncryptMode
                  ? 'Keyfile enhancement active: Decryption will require this exact file.'
                  : 'Keyfile attached for decryption verification.'}
              </span>
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              <FileKey className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Keyfile (Optional 2FA)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors focus-ring"
              >
                Upload Keyfile
              </button>

              {isEncryptMode && (
                <button
                  type="button"
                  onClick={onGenerateKeyfile}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg border border-[var(--accent-border)] bg-[var(--accent-subtle)] text-[var(--accent)] hover:bg-[var(--accent-hover)] hover:text-[var(--accent-text)] transition-colors focus-ring"
                  title="Generate and download a 256-bit random binary keyfile"
                >
                  Generate .key
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
