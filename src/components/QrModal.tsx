import React, { useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, AlertTriangle, AlertOctagon, Download, QrCode } from 'lucide-react';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: string;
  title?: string;
}

export const QrModal: React.FC<QrModalProps> = ({
  isOpen,
  onClose,
  data,
  title = 'Optical Matrix (QR Code)',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const charLength = data.length;
  const isHighDensity = charLength > 2000 && charLength <= 2900;
  const isTooLarge = charLength > 2900;

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const downloadSvg = () => {
    const svgElement = modalRef.current?.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zerovault-qr-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-2xl transition-all space-y-4"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-[var(--accent)]" />
            <h3 id="qr-modal-title" className="text-sm font-semibold text-[var(--text-primary)]">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors focus-ring"
            aria-label="Close QR Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Capacity warnings */}
        {isHighDensity && (
          <div className="flex items-start gap-2 p-3 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning-bg)] text-[var(--color-warning)] text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">High density payload ({charLength} bytes):</span> Optical scanning by mobile phone cameras may require high contrast and steady lighting.
            </div>
          </div>
        )}

        {isTooLarge && (
          <div className="flex items-start gap-2 p-3 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error-bg)] text-[var(--color-error)] text-xs">
            <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Maximum optical capacity exceeded ({charLength} chars):</span> Standard QR codes support up to 2,953 alphanumeric characters. Please use clipboard copy or file export instead.
            </div>
          </div>
        )}

        {/* QR Code Container */}
        {!isTooLarge ? (
          <div className="p-4 sm:p-6 rounded-xl bg-white flex items-center justify-center border border-[var(--border)] shadow-inner">
            <QRCodeSVG
              value={data}
              size={240}
              level="M"
              includeMargin={true}
              className="w-full max-w-[240px] h-auto"
            />
          </div>
        ) : (
          <div className="p-8 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] text-center text-xs text-[var(--text-muted)]">
            QR rendering disabled due to data length ({charLength} characters).
          </div>
        )}

        {/* Footer info & Download button */}
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-[11px] font-mono-code text-[var(--text-muted)]">
            Size: {charLength.toLocaleString()} bytes
          </span>

          {!isTooLarge && (
            <button
              onClick={downloadSvg}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent-subtle)] border border-[var(--accent-border)] transition-colors focus-ring"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save SVG</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
