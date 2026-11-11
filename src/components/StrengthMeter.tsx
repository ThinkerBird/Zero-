import React from 'react';
import { PasswordStrength } from '../lib/crypto';

interface StrengthMeterProps {
  strength: PasswordStrength;
  visible: boolean;
}

export const StrengthMeter: React.FC<StrengthMeterProps> = ({ strength, visible }) => {
  if (!visible) return null;

  // 4 segments calculation based on score (0-100)
  // Segment 1: score > 0
  // Segment 2: score >= 40
  // Segment 3: score >= 65
  // Segment 4: score >= 85
  const activeSegments = strength.score === 0 ? 0 : strength.score < 40 ? 1 : strength.score < 65 ? 2 : strength.score < 85 ? 3 : 4;

  const segmentColors: Record<string, string> = {
    WEAK: 'bg-[var(--color-error)]',
    FAIR: 'bg-[var(--color-warning)]',
    STRONG: 'bg-[var(--color-success)]',
    SECURE: 'bg-[var(--accent)]',
  };

  const activeColor = segmentColors[strength.label] || 'bg-[var(--border)]';

  return (
    <div className="flex items-center gap-3 pt-2">
      {/* 4-segment bar */}
      <div className="flex-1 grid grid-cols-4 gap-1.5 h-1.5" role="progressbar" aria-valuenow={strength.score} aria-valuemin={0} aria-valuemax={100} aria-label={`Password strength: ${strength.label}`}>
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`h-full rounded-full transition-colors duration-200 ${
              index < activeSegments ? activeColor : 'bg-[var(--border-subtle)]'
            }`}
          />
        ))}
      </div>

      {/* Label */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--text-muted)]">
          Entropy:
        </span>
        <span
          className={`text-[10px] font-semibold tracking-wider font-mono-code ${
            strength.label === 'SECURE'
              ? 'text-[var(--accent)]'
              : strength.label === 'STRONG'
              ? 'text-[var(--color-success)]'
              : strength.label === 'FAIR'
              ? 'text-[var(--color-warning)]'
              : 'text-[var(--color-error)]'
          }`}
        >
          {strength.label}
        </span>
      </div>
    </div>
  );
};
