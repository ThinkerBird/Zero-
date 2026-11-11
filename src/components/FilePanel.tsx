import React, { useRef, useState } from 'react';
import { UploadCloud, File, AlertTriangle, CheckCircle2, AlertCircle, Loader2, Download, Trash2 } from 'lucide-react';
import { AppMode, FileItem } from '../types';
import { downloadBlob } from '../lib/crypto';

interface FilePanelProps {
  mode: AppMode;
  files: FileItem[];
  onAddFiles: (newFiles: File[]) => void;
  onRemoveFile: (id: string) => void;
  onClearFiles: () => void;
  autoDownload: boolean;
  onToggleAutoDownload: () => void;
}

export const FilePanel: React.FC<FilePanelProps> = ({
  mode,
  files,
  onAddFiles,
  onRemoveFile,
  onClearFiles,
  autoDownload,
  onToggleAutoDownload,
}) => {
  const isEncrypt = mode === 'encrypt';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // File metrics calculations
  const totalFiles = files.length;
  const totalSizeBytes = files.reduce((acc, f) => acc + f.file.size, 0);
  const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);

  // Large file alert check (>500MB)
  const hasLargeFile = files.some((f) => f.file.size > 500 * 1024 * 1024);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(Array.from(e.target.files));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5 shadow-[var(--shadow-card)] space-y-4">
      {/* Header & Metrics */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <UploadCloud className="w-4 h-4 text-[var(--accent)]" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            {isEncrypt ? 'Files to Encrypt' : 'Encrypted Files (.encc)'}
          </h2>
        </div>

        {totalFiles > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono-code text-[var(--text-muted)]">
              {totalFiles} {totalFiles === 1 ? 'file' : 'files'} · {totalSizeMB} MB
            </span>
            <button
              onClick={onClearFiles}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--color-error)] transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Large File Alert (>500MB) */}
      {hasLargeFile && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning-bg)] text-[var(--color-warning)] text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Large file detected (&gt;500 MB):</span> Browser-based in-memory Web Crypto may cause high RAM consumption. Make sure your browser has sufficient available memory.
          </div>
        </div>
      )}

      {/* Drop Zone with restrained hover/drag-over state */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border border-dashed rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors duration-150 ${
          isDragOver
            ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
            : 'border-[var(--border)] hover:border-[var(--border-focus)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)]'
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            fileInputRef.current?.click();
          }
        }}
        aria-label="Upload files drop zone"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleInputChange}
          className="hidden"
          accept={isEncrypt ? undefined : '.encc,application/octet-stream'}
        />

        <div className="w-10 h-10 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] mb-2.5">
          <UploadCloud className="w-5 h-5 text-[var(--accent)]" />
        </div>

        <p className="text-xs sm:text-sm font-medium text-[var(--text-primary)]">
          <span className="text-[var(--accent)] hover:underline">Choose files</span> or drag and drop here
        </p>
        <p className="text-[11px] text-[var(--text-muted)] mt-1">
          {isEncrypt
            ? 'Any format (documents, archives, videos) · Gzip compressed'
            : 'Encrypted ZeroVault binary packages (.encc)'}
        </p>
      </div>

      {/* Auto Download Checkbox */}
      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] pt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoDownload}
            onChange={onToggleAutoDownload}
            className="w-3.5 h-3.5 rounded border-[var(--border)] text-[var(--accent)] focus-ring bg-[var(--bg-subtle)] cursor-pointer"
          />
          <span>Auto-download processed files</span>
        </label>
      </div>

      {/* Compact File Rows */}
      {files.length > 0 && (
        <div className="space-y-2 pt-1">
          {files.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] space-y-2 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <File className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--text-primary)] truncate font-mono-code">
                      {item.file.name}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {formatFileSize(item.file.size)}
                      {item.stage && item.status === 'processing' && (
                        <span className="ml-1 text-[var(--accent)] uppercase font-semibold">
                          · {item.stage}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Status indicator */}
                  {item.status === 'pending' && (
                    <span className="text-[10px] text-[var(--text-muted)]">Queued</span>
                  )}

                  {item.status === 'processing' && (
                    <div className="flex items-center gap-1.5 text-xs text-[var(--accent)] font-mono-code font-semibold">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{item.progress}%</span>
                    </div>
                  )}

                  {item.status === 'completed' && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[var(--color-success)] flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Done
                      </span>
                      {item.resultBlob && (
                        <button
                          onClick={() => downloadBlob(item.resultBlob!, item.resultFileName || item.file.name)}
                          className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-hover)] transition-colors focus-ring"
                          title="Download processed file"
                          aria-label="Download processed file"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  {item.status === 'error' && (
                    <span className="text-[10px] text-[var(--color-error)] flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Failed
                    </span>
                  )}

                  {/* Remove file button */}
                  {item.status !== 'processing' && (
                    <button
                      onClick={() => onRemoveFile(item.id)}
                      className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--bg-hover)] transition-colors focus-ring"
                      title="Remove file"
                      aria-label="Remove file from list"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Thin progress bar */}
              {item.status === 'processing' && (
                <div className="w-full bg-[var(--border-subtle)] rounded-full h-1 overflow-hidden">
                  <div
                    className="bg-[var(--accent)] h-full transition-all duration-150"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}

              {/* Error message */}
              {item.status === 'error' && item.errorMessage && (
                <p className="text-[11px] text-[var(--color-error)] mt-1">
                  {item.errorMessage}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
