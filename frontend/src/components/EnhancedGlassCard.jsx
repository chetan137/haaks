import React from 'react';

const EnhancedGlassCard = ({
  children,
  className = '',
  style = {},
  glowColor = '#FFD700',
  variant = 'default',
  interactive = true,
  ...props
}) => {
  const variants = {
    default: {
      background: 'rgba(255, 215, 0, 0.08)',
      backdropFilter: 'blur(25px)',
      border: '1px solid rgba(255, 215, 0, 0.3)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 215, 0, 0.4)'
    },
    premium: {
      background: 'rgba(255, 140, 0, 0.12)',
      backdropFilter: 'blur(30px)',
      border: '2px solid rgba(255, 140, 0, 0.4)',
      boxShadow: '0 12px 40px rgba(255, 140, 0, 0.3), inset 0 1px 0 rgba(255, 215, 0, 0.6)'
    },
    subtle: {
      background: 'rgba(204, 204, 204, 0.05)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 215, 0, 0.2)',
      boxShadow: '0 6px 24px rgba(0, 0, 0, 0.3)'
    }
  };

  const cardStyle = {
    borderRadius: '20px',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    ...variants[variant],
    ...style
  };

  const hoverStyle = interactive ? {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: `0 20px 60px rgba(255, 140, 0, 0.4), 0 0 40px ${glowColor}40`,
    border: `2px solid ${glowColor}60`
  } : {};

  return (
    <div
      className={`enhanced-glass-card ${className}`}
      style={cardStyle}
      onMouseEnter={(e) => {
        if (interactive) {
          Object.assign(e.currentTarget.style, hoverStyle);
        }
      }}
      onMouseLeave={(e) => {
        if (interactive) {
          Object.assign(e.currentTarget.style, cardStyle);
        }
      }}
      {...props}
    >
      {/* Animated background gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(45deg,
          transparent 0%,
          rgba(255, 215, 0, 0.1) 25%,
          transparent 50%,
          rgba(255, 140, 0, 0.1) 75%,
          transparent 100%)`,
        animation: 'shimmer 3s ease-in-out infinite',
        borderRadius: '20px',
        zIndex: -1
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
};

export default EnhancedGlassCard;