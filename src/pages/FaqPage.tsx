import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ShieldAlert } from 'lucide-react';
import { SeoMeta } from '../components/SeoMeta';

interface FaqItem {
  question: string;
  answer: string;
}

export const FaqPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      question: 'What happens if I forget my passphrase?',
      answer: 'Because Zero is a true zero-knowledge system with no servers or key recovery backdoors, lost passphrases CANNOT be recovered by anyone. Always store your passphrase in a secure password manager.',
    },
    {
      question: 'Are my files uploaded to any server or cloud?',
      answer: 'No. All processing occurs locally in your browser memory using the Web Crypto API. Zero initiates zero outbound network requests and works completely offline in Airplane Mode.',
    },
    {
      question: 'What is a Keyfile (2FA) and how does it work?',
      answer: 'A keyfile acts as a physical second factor. The SHA-256 digest of your chosen keyfile is cryptographically combined with your passphrase to derive the encryption key. Decryption requires both the exact passphrase AND the exact keyfile.',
    },
    {
      question: 'Can I encrypt large files (e.g., videos, archives > 1 GB)?',
      answer: 'Yes! Zero uses Version 3 Chunked Architectural Streaming, encrypting and decrypting files in 2 MB memory-safe chunks with a constant ~4 MB RAM footprint.',
    },
    {
      question: 'What is the .encc file extension?',
      answer: '.encc is the standard extension for ZeroVault encrypted binary packages, containing authenticated headers (AAD), PBKDF2 salt, AES-GCM IV, and encrypted payload.',
    },
    {
      question: 'Is Zero free to use?',
      answer: 'Yes, Zero is 100% free and open-source under the Apache 2.0 license with no paid tiers, ads, tracking, or accounts.',
    },
  ];

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <SeoMeta
        title="FAQ — Frequently Asked Questions"
        description="Find answers to common questions about Zero: passphrase recovery, keyfiles, offline usage, .encc files, and client-side Web Crypto safety."
        canonicalPath="/faq"
        structuredData={schemaData}
      />

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Everything you need to know about zero-knowledge encryption, keyfiles, and offline safety.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full p-4 text-left flex items-center justify-between gap-3 focus-ring cursor-pointer"
                aria-expanded={isOpen}
              >
                <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 shrink-0 ${
                    isOpen ? 'rotate-180 text-[var(--accent)]' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)] leading-relaxed animate-in fade-in">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning-bg)] text-[var(--color-warning)] text-xs flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Security Warning:</span> Zero cannot recover encrypted data if you lose your passphrase or keyfile. Keep backups of your keyfiles and store passphrases in a trusted password manager.
        </div>
      </div>
    </div>
  );
};
