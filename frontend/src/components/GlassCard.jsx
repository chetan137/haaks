import React from 'react';

const GlassCard = ({
  children,
  className = '',
  style = {},
  blur = 20,
  opacity = 0.1,
  borderOpacity = 0.2,
  ...props
}) => {
  const cardStyle = {
    background: `rgba(255, 255, 255, ${opacity})`,
    backdropFilter: `blur(${blur}px)`,
    border: `1px solid rgba(255, 255, 255, ${borderOpacity})`,
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
    ...style
  };

  return (
    <div
      className={`glass-card ${className}`}
      style={cardStyle}
      {...props}
    >
      {/* Subtle gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(142, 45, 226, 0.05) 0%, rgba(218, 68, 83, 0.05) 100%)',
        borderRadius: '16px',
        pointerEvents: 'none',
        zIndex: -1
      }} />
      {children}
    </div>
  );
};

export default GlassCard;