import React from 'react';
import { Shield, CheckCircle2, Lock, Cpu, ServerOff, Terminal, Key, Database, RefreshCw, AlertTriangle } from 'lucide-react';
import { SeoMeta } from '../components/SeoMeta';

export const SecurityPage: React.FC = () => {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    name: 'Zero-Knowledge Security Specifications & Cryptographic Audit',
    description: 'Technical security disclosure of Zero: AES-256-GCM, PBKDF2 600k iterations, chunk AAD binding, IV uniqueness, keyfile domain separation, and CSP connect-src none.',
  };

  const securityConcerns = [
    {
      title: '1. AES-GCM Nonce Management & IV Uniqueness',
      icon: RefreshCw,
      summary: 'Strict IV uniqueness guaranteed across every single operation and streaming chunk.',
      details: [
        'Fresh Salt & IV per Operation: Every text or file operation generates a fresh cryptographically random 16-byte salt and 12-byte base IV using crypto.getRandomValues().',
        'Key Freshness: Because a unique salt is generated per operation, PBKDF2 derives a brand-new 256-bit AES-GCM key every single time.',
        'Chunk IV Derivation: For 2MB file streaming, chunk i computes its IV by XOR-ing chunkIndex into bytes 8–11 of baseIv (deriveChunkIv). This guarantees zero IV reuse even across multi-gigabyte files.'
      ]
    },
    {
      title: '2. Keyfile Dual-Factor Binding (2FA)',
      icon: Key,
      summary: 'Domain-separated hashing combining passphrase and keyfile into PBKDF2 key derivation.',
      details: [
        'Domain Separation: Password and keyfile SHA-256 digest are prefixed with a domain tag ("ZeroVault-DualFactor-Keyfile::") before entering key derivation.',
        'Strict Hardening: The combined bytes are processed through PBKDF2-HMAC-SHA256 (600,000 iterations). Changing a single bit of either factor changes the derived key, failing GCM authentication.',
        'Zero-Byte Protection: Keyfiles with 0 bytes are rejected explicitly to prevent weak or empty factor bypass.'
      ]
    },
    {
      title: '3. Chunk Authentication & Anti-Reordering (AAD)',
      icon: Lock,
      summary: 'AEAD Additional Authenticated Data prevents chunk reordering, deletion, or truncation.',
      details: [
        'Index & Status Binding: Every 2MB chunk incorporates Additional Authenticated Data (AAD) containing [4-byte chunkIndex LE][1-byte isFinal].',
        'Tamper-Proofing: Reordering chunks, deleting a chunk, injecting fake chunks, or truncating the file before completion causes AES-GCM tag verification to immediately fail.',
        'Strict Sequential Reading: Decryption verifies chunk indices in exact 0...N order and enforces the isFinal byte flag on the terminal chunk.'
      ]
    },
    {
      title: '4. Memory Model & Active Processing Footprint',
      icon: Cpu,
      summary: '~4MB peak active RAM footprint during cryptographic processing.',
      details: [
        'Surgical Slicing: File processing uses File.slice(start, end) to process 2MB chunks in isolation.',
        'Peak Memory Discipline: Only one 2MB plaintext chunk and one 2MB ciphertext chunk reside in active crypto memory during transformation.',
        'Browser Blob Storage: Final download payloads are assembled in browser Blob storage, avoiding V8 engine Heap allocations and preventing OOM browser crashes on multi-gigabyte files.'
      ]
    },
    {
      title: '5. Network Isolation & Outbound Audit',
      icon: ServerOff,
      summary: 'Strict CSP connect-src \'none\' combined with complete offline execution.',
      details: [
        'Browser Enforcement: Content-Security-Policy header connect-src \'none\' blocks fetch, XHR, WebSockets, WebRTC, and sendBeacon at the browser kernel level.',
        'Zero SDKs & Telemetry: Codebase audited to contain zero analytics, zero external scripts, zero remote CDNs, and zero cloud API endpoints.',
        'PWA Offline Capability: Fully functional offline via Service Worker precaching.'
      ]
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      <SeoMeta
        title="Security Specifications & Audit Transparency"
        description="Review the defensive security audit of Zero: AES-256-GCM authenticated encryption, PBKDF2 600,000 iterations, chunk AAD binding, and CSP connect-src none."
        canonicalPath="/security"
        structuredData={schemaData}
      />

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Security Specifications & Audit Transparency
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Zero is designed with defense-in-depth cryptographic principles. Every primitive uses standard browser Web Crypto APIs (`crypto.subtle`) verified against defensive security audits.
        </p>
      </div>

      {/* Security Matrix */}
      <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
          <Shield className="w-4 h-4 text-[var(--accent)]" />
          <span>Cryptographic Primitives Matrix</span>
        </h2>

        <div className="divide-y divide-[var(--border-subtle)] text-xs">
          <div className="py-2.5 flex justify-between gap-4">
            <span className="font-semibold text-[var(--text-primary)]">Symmetric Cipher</span>
            <span className="font-mono-code text-[var(--accent)]">AES-256-GCM (256-bit key, 128-bit auth tag)</span>
          </div>
          <div className="py-2.5 flex justify-between gap-4">
            <span className="font-semibold text-[var(--text-primary)]">Key Derivation (KDF)</span>
            <span className="font-mono-code text-[var(--accent)]">PBKDF2-HMAC-SHA256 (600,000 iterations)</span>
          </div>
          <div className="py-2.5 flex justify-between gap-4">
            <span className="font-semibold text-[var(--text-primary)]">Header & Chunk Binding</span>
            <span className="font-mono-code text-[var(--accent)]">AES-GCM AAD ([chunkIndex][isFinal])</span>
          </div>
          <div className="py-2.5 flex justify-between gap-4">
            <span className="font-semibold text-[var(--text-primary)]">Streaming Memory Model</span>
            <span className="font-mono-code text-[var(--accent)]">2MB Chunked Architectural Streaming (~4MB RAM)</span>
          </div>
          <div className="py-2.5 flex justify-between gap-4">
            <span className="font-semibold text-[var(--text-primary)]">Keyfile Dual-Factor</span>
            <span className="font-mono-code text-[var(--accent)]">SHA-256 Digest + Domain Separation Prefix</span>
          </div>
          <div className="py-2.5 flex justify-between gap-4">
            <span className="font-semibold text-[var(--text-primary)]">Network Policy</span>
            <span className="font-mono-code text-[var(--accent)]">CSP connect-src 'none' (Zero Outbound Requests)</span>
          </div>
        </div>
      </div>

      {/* Detailed Technical Responses to Security Audit Concerns */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[var(--accent)]" />
          <span>Defensive Audit Responses & Cryptographic Guarantees</span>
        </h2>

        <div className="space-y-3">
          {securityConcerns.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div key={idx} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-2 text-xs">
                <div className="flex items-center gap-2 font-semibold text-sm text-[var(--text-primary)]">
                  <IconComponent className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <span>{item.title}</span>
                </div>
                <p className="text-[var(--text-secondary)] font-medium">
                  {item.summary}
                </p>
                <ul className="list-disc list-inside space-y-1 text-[var(--text-muted)] leading-relaxed pl-1">
                  {item.details.map((detail, dIdx) => (
                    <li key={dIdx}>{detail}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Defensive Protections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-2">
          <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
            <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />
            <span>Zip Bomb & Memory Defense</span>
          </div>
          <p className="text-[var(--text-muted)] leading-relaxed">
            Streaming decompression incorporates an explicit byte threshold to abort decompressed outputs exceeding 2 GB or 10× file size.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-2">
          <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
            <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />
            <span>Path Traversal Sanitization</span>
          </div>
          <p className="text-[var(--text-muted)] leading-relaxed">
            Restored file names are stripped of path traversal markers (`../`), control characters, and null bytes before trigger downloads.
          </p>
        </div>
      </div>
    </div>
  );
};

