import React, { useState } from 'react';
import { Check, Copy, QrCode, Lock, ShieldAlert } from 'lucide-react';
import { AppMode } from '../types';

interface OutputCardProps {
  mode: AppMode;
  outputText: string;
  onOpenQrModal: () => void;
}

export const OutputCard: React.FC<OutputCardProps> = ({
  mode,
  outputText,
  onOpenQrModal,
}) => {
  const [copied, setCopied] = useState(false);
  const isEncrypt = mode === 'encrypt';

  const handleCopy = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5 shadow-[var(--shadow-card)] space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-[var(--accent)]" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            {isEncrypt ? 'Ciphertext Output (Base64)' : 'Decrypted Plaintext'}
          </h2>
        </div>

        {outputText && (
          <div className="flex items-center gap-1.5">
            {/* Length info */}
            <span className="text-[11px] font-mono-code text-[var(--text-muted)] mr-1">
              {outputText.length.toLocaleString()} chars
            </span>

            {/* QR Code Matrix Button */}
            <button
              type="button"
              onClick={onOpenQrModal}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] transition-colors focus-ring"
              title="Show Optical Matrix QR Code"
              aria-label="View QR Code Matrix"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Matrix</span>
            </button>

            {/* Copy button */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-[var(--accent-text)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors shadow-sm focus-ring"
              title={copied ? 'Copied to clipboard' : 'Copy output'}
              aria-label="Copy output text to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Output Content or Empty State */}
      {outputText ? (
        <div className="relative">
          <textarea
            readOnly
            rows={5}
            value={outputText}
            className="w-full p-3.5 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-primary)] text-xs font-mono-code leading-relaxed select-all resize-y focus-ring"
            aria-label="Cryptographic output content"
          />
        </div>
      ) : (
        <div className="py-8 px-4 rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-subtle)]/50 flex flex-col items-center justify-center text-center">
          <ShieldAlert className="w-6 h-6 text-[var(--text-muted)] mb-2 stroke-[1.5]" />
          <p className="text-xs font-medium text-[var(--text-secondary)]">
            No cryptographic output yet
          </p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5 max-w-xs">
            {isEncrypt
              ? 'Enter plaintext and your passphrase above, then execute encryption.'
              : 'Paste an encrypted ciphertext and the correct passphrase to decrypt.'}
          </p>
        </div>
      )}
    </div>
  );
};
