import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, EyeOff, Lock, Download, ExternalLink, ArrowRight, Github } from 'lucide-react';
import { SeoMeta } from '../components/SeoMeta';

export const AboutPage: React.FC = () => {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About Zero — Zero-Knowledge Encryption Engine',
    description: 'Learn about Zero: a pure client-side zero-knowledge encryption application engineered for complete digital privacy.',
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <SeoMeta
        title="About — Zero-Knowledge Mission & Philosophy"
        description="Read about Zero: an offline-first, client-side encryption utility created to safeguard privacy without servers, accounts, or telemetry."
        canonicalPath="/about"
        structuredData={schemaData}
      />

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          About Zero 👻
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Zero was created with a simple premise: privacy shouldn't require trust in a third-party server, cloud vendor, or subscription service.
        </p>
      </div>

      <div className="space-y-4 text-xs text-[var(--text-muted)] leading-relaxed">
        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-3 text-xs text-[var(--text-primary)]">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-[var(--accent)]" />
            <span>Zero Server Telemetry</span>
          </h2>
          <p className="text-[var(--text-muted)]">
            Zero has no backend database, no login credentials, no analytics, and no tracking scripts. Everything you encrypt or decrypt is processed entirely within your device's RAM and discarded upon clearing or closing the tab.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-3 text-xs text-[var(--text-primary)]">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-[var(--accent)]" />
            <span>Offline-First Progressive Web App & Android</span>
          </h2>
          <p className="text-[var(--text-muted)]">
            Zero is a Progressive Web App (PWA) and native Android app powered by Capacitor. Once loaded, you can turn off Wi-Fi and Bluetooth or enable Airplane Mode, and the app will continue to encrypt and decrypt files flawlessly.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <a
              href="https://github.com/ThinkerBird/Zero-/releases/latest/download/Zero-Android.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] transition-all shadow-sm focus-ring"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Android APK (v1.36.1)</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </a>

            <a
              href="https://github.com/ThinkerBird/Zero-/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--accent)] transition-all shadow-sm focus-ring"
            >
              <Github className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>GitHub Releases</span>
              <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
            </a>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-3 text-xs text-[var(--text-primary)]">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Lock className="w-4 h-4 text-[var(--accent)]" />
            <span>Zero URL Data Exposure</span>
          </h2>
          <p className="text-[var(--text-muted)]">
            In accordance with zero-knowledge standards, Zero never embeds passwords, keys, file names, or ciphertext into the URL bar, query parameters, or browser history.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-3 text-xs text-[var(--text-primary)]">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-[var(--accent)]" />
            <span>Open Source Software & Font Licenses</span>
          </h2>
          <p className="text-[var(--text-muted)]">
            Zero uses the <strong>Google Sans Flex Variable Font</strong> (Copyright 2015 Google LLC), licensed under the <strong>SIL Open Font License, Version 1.1</strong>.
          </p>
          <div className="pt-1">
            <a
              href="/LICENSES.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[var(--accent)] hover:underline font-mono-code font-medium"
            >
              <span>View Full Open Source LICENSES file</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="pt-2 flex justify-start">
        <Link
          to="/encrypt"
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] transition-colors flex items-center gap-1.5"
        >
          <span>Go to Encryption Vault</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
