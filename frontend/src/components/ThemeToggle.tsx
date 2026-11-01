import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  style?: React.CSSProperties;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className,
  style,
  showLabel = false,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={className}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        width: showLabel ? 'auto' : '40px',
        height: '40px',
        padding: showLabel ? '0 1rem' : 0,
        borderRadius: 'var(--radius-pill)',
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(11, 45, 91, 0.06)',
        border: `1px solid ${isDark ? 'rgba(212, 175, 55, 0.35)' : 'var(--color-border-medium)'}`,
        color: isDark ? '#E5C07B' : 'var(--color-navy)',
        cursor: 'pointer',
        transition: 'all var(--transition-normal)',
        boxShadow: isDark
          ? '0 0 12px rgba(212, 175, 55, 0.15)'
          : '0 2px 6px rgba(11, 45, 91, 0.06)',
        flexShrink: 0,
        outline: 'none',
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.borderColor = isDark ? '#00E5C5' : 'var(--color-teal)';
        e.currentTarget.style.backgroundColor = isDark ? 'rgba(0, 229, 197, 0.15)' : 'rgba(0, 194, 168, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.borderColor = isDark ? 'rgba(212, 175, 55, 0.35)' : 'var(--color-border-medium)';
        e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(11, 45, 91, 0.06)';
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform var(--transition-fast)',
        }}
      >
        {isDark ? (
          <Sun size={18} color="#FFD166" style={{ filter: 'drop-shadow(0 0 4px rgba(255, 209, 102, 0.6))' }} />
        ) : (
          <Moon size={18} color="var(--color-navy)" />
        )}
      </div>

      {showLabel && (
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
          {isDark ? 'Light mode' : 'Dark mode'}
        </span>
      )}
    </button>
  );
};
