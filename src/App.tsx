/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Routes, Route, Navigate, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Unlock, Loader2, AlertTriangle, X } from 'lucide-react';
import { AppMode, AppTheme, PayloadType, ToastMessage, FileItem } from './types';
import {
  encryptText,
  decryptText,
  encryptFile,
  decryptFile,
  generateSecurePassword,
  calculatePasswordStrength,
  downloadBlob,
  computeKeyfileFingerprint,
  generateKeyfile,
} from './lib/crypto';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ModeTabs } from './components/ModeTabs';
import { TextPanel } from './components/TextPanel';
import { FilePanel } from './components/FilePanel';
import { PasswordField } from './components/PasswordField';
import { OutputCard } from './components/OutputCard';
import { QrModal } from './components/QrModal';
import { Toasts } from './components/Toasts';
import { UpdateToast } from './components/UpdateToast';
import { SeoMeta } from './components/SeoMeta';

// Pages
import { HowItWorks } from './pages/HowItWorks';
import { SecurityPage } from './pages/SecurityPage';
import { AboutPage } from './pages/AboutPage';
import { FaqPage } from './pages/FaqPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Theme State with localStorage Persistence
  const [theme, setTheme] = useState<AppTheme>(() => {
    const stored = localStorage.getItem('zero-theme') as AppTheme;
    if (stored === 'high-contrast' || stored === 'minimalist' || stored === 'neural') {
      return stored;
    }
    const themeParam = new URLSearchParams(window.location.search).get('theme');
    return themeParam === 'high-contrast' || themeParam === 'minimalist' ? themeParam : 'neural';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('zero-theme', theme);
    
    // Sync with URL if needed
    const currentParam = searchParams.get('theme');
    if (currentParam !== theme) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('theme', theme);
      setSearchParams(nextParams, { replace: true });
    }
  }, [theme, searchParams, setSearchParams]);

  const updateTheme = useCallback((newTheme: AppTheme) => {
    setTheme(newTheme);
  }, []);

  // 2. Cryptographic Local State
  const [password, setPassword] = useState('');
  const [keyfile, setKeyfile] = useState<File | null>(null);
  const [keyfileBuffer, setKeyfileBuffer] = useState<ArrayBuffer | null>(null);
  const [keyfileFingerprint, setKeyfileFingerprint] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [payloadType, setPayloadType] = useState<PayloadType>('text');
  const [autoDownload, setAutoDownload] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [autoClearBanner, setAutoClearBanner] = useState<string | null>(null);

  // 3. Auto-Clear 60s Inactivity Security Feature
  const [autoClearEnabled, setAutoClearEnabled] = useState(true);
  const [inactivityRemaining, setInactivityRemaining] = useState(60);
  const lastActivityRef = useRef<number>(Date.now());

  // Toast dispatch helper
  const addToast = useCallback((title: string, message?: string, toastType: ToastMessage['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type: toastType, timestamp: Date.now() }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Emergency Wipe Function
  const handleEmergencyWipe = useCallback(() => {
    setInputText('');
    setOutputText('');
    setPassword('');
    setKeyfile(null);
    setKeyfileBuffer(null);
    setKeyfileFingerprint(null);
    setFiles([]);
    setIsQrModalOpen(false);
    setAutoClearBanner('Buffer emergency wiped. All sensitive credentials, keyfiles, and cache cleared.');
    addToast('Emergency Wipe Executed', 'All sensitive buffers were instantly cleared.', 'warning');
  }, [addToast]);

  // Keyfile Handlers
  const handleAttachKeyfile = async (file: File) => {
    if (file.size === 0) {
      addToast('Empty Keyfile', 'Keyfile is empty (0 bytes). Please attach a non-empty keyfile.', 'error');
      return;
    }
    try {
      const buffer = await file.arrayBuffer();
      if (buffer.byteLength === 0) {
        addToast('Empty Keyfile', 'Keyfile is empty (0 bytes). Please attach a non-empty keyfile.', 'error');
        return;
      }
      const fingerprint = await computeKeyfileFingerprint(buffer);
      setKeyfile(file);
      setKeyfileBuffer(buffer);
      setKeyfileFingerprint(fingerprint);
      addToast('Keyfile Attached', `${file.name} (${(file.size / 1024).toFixed(1)} KB) linked for key derivation.`, 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not read attached keyfile.';
      addToast('Keyfile Error', msg, 'error');
    }
  };

  const handleRemoveKeyfile = () => {
    setKeyfile(null);
    setKeyfileBuffer(null);
    setKeyfileFingerprint(null);
    addToast('Keyfile Detached', 'Keyfile removed from cryptographic session.', 'info');
  };

  const handleGenerateKeyfile = async () => {
    try {
      const { blob, fileName } = generateKeyfile();
      downloadBlob(blob, fileName);
      const buffer = await blob.arrayBuffer();
      const file = new File([blob], fileName, { type: 'application/octet-stream' });
      const fingerprint = await computeKeyfileFingerprint(buffer);
      setKeyfile(file);
      setKeyfileBuffer(buffer);
      setKeyfileFingerprint(fingerprint);
      addToast('Keyfile Generated', `${fileName} created, downloaded, and attached.`, 'success');
    } catch {
      addToast('Generation Failed', 'Could not generate random keyfile.', 'error');
    }
  };

  // Inactivity tracking
  useEffect(() => {
    const markActivity = () => {
      lastActivityRef.current = Date.now();
      setInactivityRemaining(60);
    };

    window.addEventListener('mousemove', markActivity);
    window.addEventListener('keydown', markActivity);
    window.addEventListener('click', markActivity);
    window.addEventListener('touchstart', markActivity);

    const interval = setInterval(() => {
      if (!autoClearEnabled) return;
      const elapsed = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining = Math.max(0, 60 - elapsed);
      setInactivityRemaining(remaining);

      if (remaining === 0 && (password || keyfile || inputText || outputText || files.length > 0)) {
        setInputText('');
        setOutputText('');
        setPassword('');
        setKeyfile(null);
        setKeyfileBuffer(null);
        setKeyfileFingerprint(null);
        setFiles([]);
        setIsQrModalOpen(false);
        lastActivityRef.current = Date.now();
        setInactivityRemaining(60);
        setAutoClearBanner('Buffer auto-cleared due to 60s of inactivity to prevent physical surveillance.');
        addToast('Buffer Auto-Cleared', 'Cleared after 60s of inactivity for zero-knowledge safety.', 'info');
      }
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', markActivity);
      window.removeEventListener('keydown', markActivity);
      window.removeEventListener('click', markActivity);
      window.removeEventListener('touchstart', markActivity);
      clearInterval(interval);
    };
  }, [autoClearEnabled, password, inputText, outputText, files.length, addToast]);

  const passwordStrength = useMemo(() => {
    return calculatePasswordStrength(password);
  }, [password]);

  const handleGeneratePassword = () => {
    const newPass = generateSecurePassword(24);
    setPassword(newPass);
    navigator.clipboard.writeText(newPass).catch(() => {});
    addToast('Password Generated & Copied', '24-character high-entropy cryptographic key generated.', 'success');
  };

  const handlePasteText = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputText(text);
        addToast('Pasted from Clipboard', `${text.length} characters inserted.`, 'info');
      }
    } catch {
      addToast('Paste Access Denied', 'Please grant clipboard permissions to paste directly.', 'error');
    }
  };

  const handleAddFiles = (newFiles: File[]) => {
    const formatted: FileItem[] = newFiles.map((f) => ({
      id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
      file: f,
      status: 'pending',
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...formatted]);
    addToast('Files Attached', `Added ${newFiles.length} file(s) for zero-knowledge processing.`, 'info');
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClearFiles = () => {
    setFiles([]);
  };

  // Execute Cryptographic Action
  const handleExecute = async (mode: AppMode) => {
    if (!password && !keyfileBuffer) {
      addToast('Credentials Required', 'Please enter a passphrase or attach a keyfile.', 'warning');
      return;
    }

    setIsProcessing(true);

    try {
      if (payloadType === 'text') {
        if (!inputText.trim()) {
          addToast('Input Required', 'Please provide text to process.', 'warning');
          setIsProcessing(false);
          return;
        }

        if (mode === 'encrypt') {
          const cipherResult = await encryptText(inputText, password, keyfileBuffer);
          setOutputText(cipherResult);
          addToast(
            'Encryption Complete',
            keyfile ? 'AES-256-GCM ciphertext generated with dual-factor keyfile.' : 'AES-256-GCM ciphertext generated.',
            'success'
          );
        } else {
          const plainResult = await decryptText(inputText, password, keyfileBuffer);
          setOutputText(plainResult);
          addToast('Decryption Complete', 'Payload verified and decrypted successfully.', 'success');
        }
      } else {
        if (files.length === 0) {
          addToast('No Files Attached', 'Please select or drag files into the drop zone.', 'warning');
          setIsProcessing(false);
          return;
        }

        const pendingFiles = files.filter((f) => f.status !== 'completed');
        if (pendingFiles.length === 0) {
          addToast('Files Already Processed', 'All attached files have already been processed.', 'info');
          setIsProcessing(false);
          return;
        }

        for (const item of files) {
          if (item.status === 'completed') continue;

          setFiles((prev) =>
            prev.map((f) => (f.id === item.id ? { ...f, status: 'processing', progress: 5 } : f))
          );

          try {
            if (mode === 'encrypt') {
              const { blob, fileName } = await encryptFile(
                item.file,
                password,
                (prog) => {
                  setFiles((prev) =>
                    prev.map((f) =>
                      f.id === item.id ? { ...f, progress: prog.percent, stage: prog.stage } : f
                    )
                  );
                },
                keyfileBuffer
              );

              setFiles((prev) =>
                prev.map((f) =>
                  f.id === item.id
                    ? {
                        ...f,
                        status: 'completed',
                        progress: 100,
                        resultBlob: blob,
                        resultFileName: fileName,
                      }
                    : f
                )
              );

              if (autoDownload) {
                downloadBlob(blob, fileName);
              }
            } else {
              const restoredFile = await decryptFile(
                item.file,
                password,
                (prog) => {
                  setFiles((prev) =>
                    prev.map((f) =>
                      f.id === item.id ? { ...f, progress: prog.percent, stage: prog.stage } : f
                    )
                  );
                },
                keyfileBuffer
              );

              setFiles((prev) =>
                prev.map((f) =>
                  f.id === item.id
                    ? {
                        ...f,
                        status: 'completed',
                        progress: 100,
                        resultBlob: restoredFile,
                        resultFileName: restoredFile.name,
                      }
                    : f
                )
              );

              if (autoDownload) {
                downloadBlob(restoredFile, restoredFile.name);
              }
            }
          } catch (fileErr: unknown) {
            const errMessage = fileErr instanceof Error ? fileErr.message : 'Processing failed';
            setFiles((prev) =>
              prev.map((f) =>
                f.id === item.id ? { ...f, status: 'error', errorMessage: errMessage } : f
              )
            );
            addToast(`Failed: ${item.file.name}`, errMessage, 'error');
          }
        }

        addToast(
          mode === 'encrypt' ? 'Batch Encryption Finished' : 'Batch Decryption Finished',
          autoDownload ? 'Processed files downloaded automatically.' : 'Files ready for download.',
          'success'
        );
      }
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Cryptographic operation failed';
      addToast('Operation Failed', errMessage, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Keyboard Shortcuts: Ctrl+Shift+L (Emergency Wipe)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'L' || e.key === 'l')) {
        e.preventDefault();
        handleEmergencyWipe();
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [handleEmergencyWipe]);

  // Main Vault Component Render
  const renderVaultPanel = (mode: AppMode) => {
    const hasCredentials = Boolean(password || keyfile);
    const isActionDisabled =
      isProcessing ||
      !hasCredentials ||
      (payloadType === 'text' && !inputText.trim()) ||
      (payloadType === 'file' && files.length === 0);

    const schemaData = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: mode === 'encrypt' ? 'Zero-Knowledge Encryption Engine' : 'Zero-Knowledge Decryption Engine',
      applicationCategory: 'SecurityApplication',
      operatingSystem: 'All',
      description: mode === 'encrypt'
        ? 'Client-side zero-knowledge encryption for text and files using Web Crypto AES-256-GCM and PBKDF2.'
        : 'Client-side zero-knowledge decryption for ZeroVault .encc packages and text payloads.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    };

    return (
      <div className="space-y-5 animate-in fade-in">
        <SeoMeta
          title={mode === 'encrypt' ? 'Encrypt Text & Files' : 'Decrypt Text & Files'}
          description={
            mode === 'encrypt'
              ? 'Encrypt confidential text and files client-side using Web Crypto AES-256-GCM, PBKDF2 600,000 iterations, and dual-factor keyfiles.'
              : 'Decrypt ZeroVault .encc files and encrypted payloads directly in your browser memory with zero server data leakage.'
          }
          canonicalPath={mode === 'encrypt' ? '/encrypt' : '/decrypt'}
          structuredData={schemaData}
        />

        {/* Page Title */}
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            {mode === 'encrypt' ? 'Zero-Knowledge Encryption' : 'Zero-Knowledge Decryption'}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            {mode === 'encrypt'
              ? 'Encrypt files and confidential text client-side before transmission or cloud storage.'
              : 'Decrypt ZeroVault payloads and packages with your secret key directly in memory.'}
          </p>
        </div>

        {/* Mode & Payload Segmented Controls */}
        <ModeTabs
          mode={mode}
          onModeChange={(newMode) => navigate(`/${newMode}`)}
          type={payloadType}
          onTypeChange={(newType) => setPayloadType(newType)}
        />

        {/* Card 1: Input (Text or File Panel) */}
        {payloadType === 'text' ? (
          <TextPanel
            mode={mode}
            text={inputText}
            onTextChange={setInputText}
            onPaste={handlePasteText}
            onClear={() => setInputText('')}
          />
        ) : (
          <FilePanel
            mode={mode}
            files={files}
            onAddFiles={handleAddFiles}
            onRemoveFile={handleRemoveFile}
            onClearFiles={handleClearFiles}
            autoDownload={autoDownload}
            onToggleAutoDownload={() => setAutoDownload(!autoDownload)}
          />
        )}

        {/* Card 2: Password & Cryptographic Controls */}
        <PasswordField
          password={password}
          onPasswordChange={setPassword}
          onGeneratePassword={handleGeneratePassword}
          strength={passwordStrength}
          isEncryptMode={mode === 'encrypt'}
          keyfile={keyfile}
          keyfileFingerprint={keyfileFingerprint}
          onAttachKeyfile={handleAttachKeyfile}
          onRemoveKeyfile={handleRemoveKeyfile}
          onGenerateKeyfile={handleGenerateKeyfile}
        />

        {/* Primary Action Button */}
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => handleExecute(mode)}
            disabled={isActionDisabled}
            className={`w-full py-3 px-4 rounded-xl font-medium text-sm transition-all duration-150 flex items-center justify-center gap-2.5 shadow-sm min-h-[48px] focus-ring ${
              isActionDisabled
                ? 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border)] cursor-not-allowed opacity-60'
                : 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] cursor-pointer'
            }`}
            aria-label={
              mode === 'encrypt'
                ? `Encrypt ${payloadType === 'text' ? 'Text' : 'Files'}`
                : `Decrypt ${payloadType === 'text' ? 'Text' : 'Files'}`
            }
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing WebCrypto operations...</span>
              </>
            ) : mode === 'encrypt' ? (
              <>
                <Lock className="w-4 h-4" />
                <span>Encrypt {payloadType === 'text' ? 'Text' : 'Files'}</span>
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                <span>Decrypt {payloadType === 'text' ? 'Text' : 'Files'}</span>
              </>
            )}

            {!isProcessing && (
              <span className="hidden sm:inline-block ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono-code opacity-75 border border-current">
                Ctrl+Enter
              </span>
            )}
          </button>
        </div>

        {/* Output Card for Text Mode */}
        {payloadType === 'text' && (
          <OutputCard
            mode={mode}
            outputText={outputText}
            onOpenQrModal={() => setIsQrModalOpen(true)}
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-app)] text-[var(--text-primary)] antialiased">
      {/* Top Bar Header */}
      <Header
        theme={theme}
        onThemeChange={updateTheme}
        onEmergencyWipe={handleEmergencyWipe}
        inactivityRemaining={inactivityRemaining}
        autoClearEnabled={autoClearEnabled}
        onToggleAutoClear={() => setAutoClearEnabled(!autoClearEnabled)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 pt-3 pb-8 sm:pb-12 space-y-5">
        {/* Security Auto-Clear Banner */}
        {autoClearBanner && (
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning-bg)] text-[var(--color-warning)] text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{autoClearBanner}</span>
            </div>
            <button
              onClick={() => setAutoClearBanner(null)}
              className="p-1 hover:opacity-80 transition-opacity"
              aria-label="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Route Definitions */}
        <Routes>
          <Route path="/" element={<Navigate to="/encrypt" replace />} />
          <Route path="/encrypt" element={renderVaultPanel('encrypt')} />
          <Route path="/decrypt" element={renderVaultPanel('decrypt')} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* QR Code Modal */}
      <QrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        data={outputText}
        title={location.pathname === '/encrypt' ? 'Ciphertext Optical Matrix' : 'Decrypted Plaintext QR'}
      />

      {/* Floating Toasts */}
      <Toasts toasts={toasts} onDismiss={dismissToast} />

      {/* PWA Update / Offline Toast */}
      <UpdateToast isProcessing={isProcessing} />

      {/* Footer */}
      <Footer />
    </div>
  );
}
