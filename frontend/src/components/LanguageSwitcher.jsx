import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const LanguageSwitcher = ({ className = '' }) => {
  const { i18n } = useTranslation();
  const { changeLanguage } = useAuth();

  const languageOptions = [
    { value: 'en', label: 'English', native: 'English' },
    { value: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { value: 'mr', label: 'Marathi', native: 'मराठी' },
    { value: 'bn', label: 'Bengali', native: 'বাংলা' },
    { value: 'te', label: 'Telugu', native: 'తెలుగు' },
    { value: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { value: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
    { value: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
    { value: 'ml', label: 'Malayalam', native: 'മലയാളം' },
    { value: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
    { value: 'or', label: 'Odia', native: 'ଓଡ଼ିଆ' },
    { value: 'as', label: 'Assamese', native: 'অসমীয়া' },
    { value: 'ur', label: 'Urdu', native: 'اردو' },
    { value: 'sa', label: 'Sanskrit', native: 'संस्कृतम्' },
    { value: 'ne', label: 'Nepali', native: 'नेपाली' },
    { value: 'si', label: 'Sinhala', native: 'සිංහල' },
    { value: 'my', label: 'Myanmar', native: 'မြန်မာ' }
  ];

  const handleLanguageChange = (e) => {
    const selectedLanguage = e.target.value;
    changeLanguage(selectedLanguage);
  };

  return (
    <div style={{ position: 'relative' }}>
      <select
        value={i18n.language}
        onChange={handleLanguageChange}
        style={{
          appearance: 'none',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--neutral-border)',
          borderRadius: '4px',
          padding: '0.5rem 2rem 0.5rem 0.75rem',
          fontSize: '0.875rem',
          outline: 'none',
          cursor: 'pointer'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--primary)';
          e.target.style.boxShadow = '0 0 0 2px var(--primary-light)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--neutral-border)';
          e.target.style.boxShadow = 'none';
        }}
      >
        {languageOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.native}
          </option>
        ))}
      </select>
      <div style={{
        position: 'absolute',
        top: '50%',
        right: '0.5rem',
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
        color: 'var(--neutral-medium)'
      }}>
        ▼
      </div>
    </div>
  );
};

export default LanguageSwitcher;