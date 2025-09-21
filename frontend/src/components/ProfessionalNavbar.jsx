import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProfessionalNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--neutral-border)',
      padding: '0',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backdropFilter: 'blur(10px)',
      backgroundColor: 'rgba(26, 26, 26, 0.95)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        height: '64px'
      }}>
        {/* Logo */}
        <Link
          to="/"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div style={{
            background: 'var(--gradient-primary)',
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}>
            🚀
          </div>
          <span style={{
            color: 'var(--text-primary)',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            AS/400 <span style={{ color: '#FFD700' }}>Modernization</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {user ? (
            <>
              <Link
                to="/dashboard"
                style={{
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  color: isActive('/dashboard') ? 'var(--text-dark)' : 'var(--text-primary)',
                  background: isActive('/dashboard') ? 'var(--gradient-primary)' : 'transparent',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive('/dashboard')) {
                    e.target.style.background = 'rgba(255, 140, 0, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive('/dashboard')) {
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                Dashboard
              </Link>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginLeft: '16px',
                paddingLeft: '16px',
                borderLeft: '1px solid var(--neutral-border)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--gradient-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-dark)'
                  }}>
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span style={{
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {user.name || user.email}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--neutral-border)',
                    color: 'var(--text-secondary)',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'var(--error)';
                    e.target.style.color = 'white';
                    e.target.style.borderColor = 'var(--error)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = 'var(--text-secondary)';
                    e.target.style.borderColor = 'var(--neutral-border)';
                  }}
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div style={{
              display: 'flex',
              gap: '8px'
            }}>
              <Link
                to="/login"
                style={{
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  background: 'transparent',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  border: '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 140, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                }}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn-primary"
                style={{
                  textDecoration: 'none',
                  display: 'inline-block'
                }}
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default ProfessionalNavbar;