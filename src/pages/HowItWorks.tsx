import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, ShieldCheck, Zap, HardDrive, Key, Lock, ArrowRight } from 'lucide-react';
import { SeoMeta } from '../components/SeoMeta';

export const HowItWorks: React.FC = () => {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How Zero-Knowledge Encryption Works in Zero',
    description: 'Learn how client-side Web Crypto API, AES-256-GCM, and PBKDF2 600,000 iterations protect your files and text offline.',
    step: [
      {
        '@type': 'HowToStep',
        name: 'Passphrase & Salt Generation',
        text: 'A random 16-byte salt is generated via window.crypto.getRandomValues().',
      },
      {
        '@type': 'HowToStep',
        name: 'PBKDF2 Key Derivation',
        text: 'PBKDF2-HMAC-SHA256 executes 600,000 iterations in the browser to derive a 256-bit key.',
      },
      {
        '@type': 'HowToStep',
        name: 'AES-256-GCM Encryption',
        text: 'Data is encrypted in 2MB chunks with 128-bit authentication tags and authenticated metadata (AAD).',
      },
    ],
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <SeoMeta
        title="How It Works — Web Crypto & Zero-Knowledge Architecture"
        description="Discover how Zero encrypts files and text 100% client-side using Web Crypto AES-256-GCM, PBKDF2 600,000 iterations, and chunked memory-safe streaming."
        canonicalPath="/how-it-works"
        structuredData={schemaData}
      />

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          How Zero Works
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Zero operates on a strict zero-knowledge architecture. All cryptographic key derivation, encryption, and decryption happen 100% locally in your browser's memory using the native Web Crypto API (`window.crypto.subtle`).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center">
            <Key className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            1. Key Derivation (PBKDF2 600,000)
          </h2>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Your secret passphrase is never stored. Zero uses PBKDF2-HMAC-SHA256 with 600,000 iterations and a cryptographically secure 16-byte random salt to stretch your passphrase into a 256-bit key.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            2. Authenticated Encryption (AES-256-GCM)
          </h2>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Zero uses AES-256-GCM with 128-bit authentication tags. File headers (filename, MIME type) are authenticated via Additional Authenticated Data (AAD), preventing tampering or spoofing.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center">
            <HardDrive className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            3. Chunked Architectural Streaming
          </h2>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Large files are encrypted in 2 MB memory-safe chunks. Each chunk is authenticated with a unique counter IV and index. Peak RAM usage remains constant at ~4 MB regardless of file size.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            4. Dual-Factor Keyfile Protection
          </h2>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Attach an optional keyfile as a second authentication factor. The SHA-256 digest of the keyfile is combined with your passphrase using domain separation, creating 2FA encryption.
          </p>
        </div>
      </div>

      <div className="p-5 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-subtle)]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Ready to encrypt your files?</h3>
          <p className="text-xs text-[var(--text-muted)]">No account, no sign-up, no server uploads required.</p>
        </div>
        <Link
          to="/encrypt"
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] transition-colors flex items-center gap-1.5 shrink-0"
        >
          <span>Start Encrypting</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
