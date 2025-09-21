import React from 'react';

const GradientButton = ({
  children,
  onClick,
  className = '',
  style = {},
  variant = 'primary',
  size = 'medium',
  disabled = false,
  ...props
}) => {
  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #8E2DE2 0%, #DA4453 100%)',
      color: '#ffffff',
      boxShadow: '0 4px 15px rgba(142, 45, 226, 0.3)'
    },
    secondary: {
      background: 'linear-gradient(135deg, #243B55 0%, #8E2DE2 100%)',
      color: '#ffffff',
      boxShadow: '0 4px 15px rgba(36, 59, 85, 0.3)'
    },
    outline: {
      background: 'transparent',
      color: '#8E2DE2',
      border: '2px solid #8E2DE2',
      boxShadow: 'none'
    }
  };

  const sizes = {
    small: {
      padding: '8px 16px',
      fontSize: '14px',
      borderRadius: '6px'
    },
    medium: {
      padding: '12px 24px',
      fontSize: '16px',
      borderRadius: '8px'
    },
    large: {
      padding: '16px 32px',
      fontSize: '18px',
      borderRadius: '10px'
    }
  };

  const buttonStyle = {
    border: 'none',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    ...variants[variant],
    ...sizes[size],
    opacity: disabled ? 0.6 : 1,
    ...style
  };

  const handleMouseEnter = (e) => {
    if (!disabled) {
      e.target.style.transform = 'translateY(-2px)';
      if (variant === 'primary') {
        e.target.style.boxShadow = '0 8px 25px rgba(142, 45, 226, 0.4)';
      } else if (variant === 'secondary') {
        e.target.style.boxShadow = '0 8px 25px rgba(36, 59, 85, 0.4)';
      }
    }
  };

  const handleMouseLeave = (e) => {
    if (!disabled) {
      e.target.style.transform = 'translateY(0)';
      e.target.style.boxShadow = buttonStyle.boxShadow;
    }
  };

  return (
    <button
      className={`gradient-button ${className}`}
      style={buttonStyle}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
      {...props}
    >
      {/* Shine effect on hover */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
        transition: 'left 0.5s ease',
        pointerEvents: 'none'
      }} className="shine-effect" />
      {children}
    </button>
  );
};

export default GradientButton;