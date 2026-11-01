import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  theme?: 'auto' | 'light' | 'dark';
  className?: string;
  style?: React.CSSProperties;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  theme = 'auto',
  className,
  style,
}) => {
  const themeContext = useTheme();
  const activeTheme = theme === 'auto' ? themeContext.theme : theme;

  const isDark = activeTheme === 'dark';

  const sizeMap = {
    sm: { container: 32, icon: 24, fontSize: '1.1rem', radius: 8 },
    md: { container: 38, icon: 30, fontSize: '1.25rem', radius: 10 },
    lg: { container: 48, icon: 38, fontSize: '1.45rem', radius: 12 },
    xl: { container: 64, icon: 52, fontSize: '1.8rem', radius: 16 },
  };

  const { container, icon, fontSize, radius } = sizeMap[size];

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'sm' ? '0.6rem' : '0.75rem',
        textDecoration: 'none',
        userSelect: 'none',
        ...style,
      }}
    >
      {/* Golden Flame & Wings Icon Emblem */}
      <div
        style={{
          width: `${container}px`,
          height: `${container}px`,
          borderRadius: `${radius}px`,
          background: 'radial-gradient(circle at 50% 30%, #16243A 0%, #070D18 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(212, 175, 55, 0.35)',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <img
          src="/logo-icon.png"
          alt="SignBridge AI Emblem"
          style={{
            width: `${icon}px`,
            height: `${icon}px`,
            objectFit: 'contain',
            filter: 'drop-shadow(0 2px 5px rgba(212, 175, 55, 0.25))',
          }}
        />
      </div>

      {/* Brand Text */}
      {showText && (
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize,
            fontWeight: 800,
            color: isDark ? '#FFFFFF' : 'var(--color-navy)',
            letterSpacing: '-0.025em',
            display: 'inline-flex',
            alignItems: 'center',
            lineHeight: 1.2,
          }}
        >
          SignBridge{' '}
          <span
            style={{
              marginLeft: '0.28em',
              background: 'linear-gradient(135deg, #E5C07B 0%, #D4AF37 50%, #00E5C5 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 900,
            }}
          >
            AI
          </span>
        </span>
      )}
    </div>
  );
};
