import React from 'react';
import { NavLink } from 'react-router-dom';

export const Footer: React.FC = () => {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `transition-colors hover:text-[var(--text-primary)] ${
      isActive ? 'text-[var(--accent)] font-semibold' : 'text-[var(--text-muted)]'
    }`;

  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--bg-surface)] py-4 mt-auto transition-colors">
      <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Navigation Slugs */}
        <nav className="flex items-center gap-4 text-[11px]">
          <NavLink to="/encrypt" className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/how-it-works" className={linkClass}>
            How It Works
          </NavLink>
          <NavLink to="/security" className={linkClass}>
            Security
          </NavLink>
          <NavLink to="/about" className={linkClass}>
            About
          </NavLink>
          <NavLink to="/faq" className={linkClass}>
            FAQ
          </NavLink>
        </nav>

        {/* Runtime info */}
        <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
          <span>AES-256-GCM · Client-side</span>
          <span className="font-mono-code">{__APP_VERSION__}</span>
        </div>
      </div>
    </footer>
  );
};
