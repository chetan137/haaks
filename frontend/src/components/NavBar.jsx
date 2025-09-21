import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const NavBar = ({ user, onLogout }) => {
  const { t } = useTranslation();

  return (
    <nav style={{
      backgroundColor: 'var(--primary)',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        color: 'var(--text-light)',
        fontSize: '1.5rem',
        fontWeight: 'bold'
      }}>
        AS/400 Modernization Platform
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <LanguageSwitcher />

        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            color: 'var(--text-light)'
          }}>
            <span>{t('welcome')}, {user.name}</span>
            <button
              onClick={onLogout}
              style={{
                backgroundColor: 'var(--secondary)',
                color: 'var(--text-light)',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = 'var(--secondary-hover)'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'var(--secondary)'}
            >
              {t('logout')}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;