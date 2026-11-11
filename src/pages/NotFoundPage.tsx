import React from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon, ArrowLeft, Home } from 'lucide-react';
import { SeoMeta } from '../components/SeoMeta';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="py-12 flex flex-col items-center justify-center text-center space-y-5 animate-in fade-in">
      <SeoMeta
        title="404 — Page Not Found"
        description="The requested route does not exist in Zero Vault."
        canonicalPath="/404"
      />

      <div className="w-16 h-16 rounded-2xl bg-[var(--color-error-bg)] border border-[var(--color-error)]/30 flex items-center justify-center text-[var(--color-error)]">
        <AlertOctagon className="w-8 h-8" />
      </div>

      <div className="space-y-1 max-w-sm">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">
          404 — Page Not Found
        </h1>
        <p className="text-xs text-[var(--text-muted)]">
          The requested URL path does not exist or has moved. Zero keeps all routes static and free of user data.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Link
          to="/encrypt"
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] transition-colors flex items-center gap-2 shadow-sm"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Return to Encryption Vault</span>
        </Link>
      </div>
    </div>
  );
};
