import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const Register = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    language: 'en'
  });

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

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('validation.nameRequired', 'Name is required');
    }

    if (!formData.email) {
      newErrors.email = t('validation.emailRequired', 'Email is required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('errors.invalidEmail', 'Invalid email address');
    }

    if (!formData.password) {
      newErrors.password = t('validation.passwordRequired', 'Password is required');
    } else if (formData.password.length < 6) {
      newErrors.password = t('errors.passwordMinLength', 'Password must be at least 6 characters');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.confirmPasswordRequired', 'Confirm password is required');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('errors.passwordsDoNotMatch', 'Passwords do not match');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        language: formData.language
      });
      navigate('/dashboard');
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-secondary)',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '500px'
      }}>
        <h2 style={{
          color: 'var(--text-primary)',
          fontSize: '1.75rem',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          {t('auth.register', 'Create Account')}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              color: 'var(--text-primary)',
              fontWeight: '500',
              marginBottom: '0.5rem'
            }}>
              {t('auth.name', 'Full Name')}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${errors.name ? 'var(--error)' : 'var(--neutral-border)'}`,
                borderRadius: '4px',
                fontSize: '1rem',
                outline: 'none',
                backgroundColor: 'var(--bg-primary)'
              }}
              onFocus={(e) => {
                if (!errors.name) {
                  e.target.style.borderColor = 'var(--primary)';
                  e.target.style.boxShadow = '0 0 0 2px var(--primary-light)';
                }
              }}
              onBlur={(e) => {
                if (!errors.name) {
                  e.target.style.borderColor = 'var(--neutral-border)';
                  e.target.style.boxShadow = 'none';
                }
              }}
            />
            {errors.name && (
              <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.name}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              color: 'var(--text-primary)',
              fontWeight: '500',
              marginBottom: '0.5rem'
            }}>
              {t('auth.email', 'Email')}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${errors.email ? 'var(--error)' : 'var(--neutral-border)'}`,
                borderRadius: '4px',
                fontSize: '1rem',
                outline: 'none',
                backgroundColor: 'var(--bg-primary)'
              }}
              onFocus={(e) => {
                if (!errors.email) {
                  e.target.style.borderColor = 'var(--primary)';
                  e.target.style.boxShadow = '0 0 0 2px var(--primary-light)';
                }
              }}
              onBlur={(e) => {
                if (!errors.email) {
                  e.target.style.borderColor = 'var(--neutral-border)';
                  e.target.style.boxShadow = 'none';
                }
              }}
            />
            {errors.email && (
              <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.email}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              color: 'var(--text-primary)',
              fontWeight: '500',
              marginBottom: '0.5rem'
            }}>
              {t('auth.password', 'Password')}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${errors.password ? 'var(--error)' : 'var(--neutral-border)'}`,
                borderRadius: '4px',
                fontSize: '1rem',
                outline: 'none',
                backgroundColor: 'var(--bg-primary)'
              }}
              onFocus={(e) => {
                if (!errors.password) {
                  e.target.style.borderColor = 'var(--primary)';
                  e.target.style.boxShadow = '0 0 0 2px var(--primary-light)';
                }
              }}
              onBlur={(e) => {
                if (!errors.password) {
                  e.target.style.borderColor = 'var(--neutral-border)';
                  e.target.style.boxShadow = 'none';
                }
              }}
            />
            {errors.password && (
              <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.password}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              color: 'var(--text-primary)',
              fontWeight: '500',
              marginBottom: '0.5rem'
            }}>
              {t('auth.confirmPassword', 'Confirm Password')}
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${errors.confirmPassword ? 'var(--error)' : 'var(--neutral-border)'}`,
                borderRadius: '4px',
                fontSize: '1rem',
                outline: 'none',
                backgroundColor: 'var(--bg-primary)'
              }}
              onFocus={(e) => {
                if (!errors.confirmPassword) {
                  e.target.style.borderColor = 'var(--primary)';
                  e.target.style.boxShadow = '0 0 0 2px var(--primary-light)';
                }
              }}
              onBlur={(e) => {
                if (!errors.confirmPassword) {
                  e.target.style.borderColor = 'var(--neutral-border)';
                  e.target.style.boxShadow = 'none';
                }
              }}
            />
            {errors.confirmPassword && (
              <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              color: 'var(--text-primary)',
              fontWeight: '500',
              marginBottom: '0.5rem'
            }}>
              {t('auth.preferredLanguage', 'Preferred Language')}
            </label>
            <select
              name="language"
              value={formData.language}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--neutral-border)',
                borderRadius: '4px',
                fontSize: '1rem',
                outline: 'none',
                backgroundColor: 'var(--bg-primary)',
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
                  {option.native} ({option.label})
                </option>
              ))}
            </select>
          </div>

          {errors.submit && (
            <div style={{
              backgroundColor: 'var(--error)',
              color: 'var(--text-light)',
              padding: '0.75rem',
              borderRadius: '4px',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              {errors.submit}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: loading ? 'var(--neutral-medium)' : 'var(--primary)',
              color: 'var(--text-light)',
              padding: '0.75rem',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '1rem'
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = 'var(--primary-hover)';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = 'var(--primary)';
              }
            }}
          >
            {loading ? t('auth.registering', 'Creating Account...') : t('auth.register', 'Create Account')}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          color: 'var(--text-secondary)'
        }}>
          {t('auth.haveAccount', "Already have an account?")}{' '}
          <Link
            to="/login"
            style={{
              color: 'var(--primary)',
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            {t('auth.login', 'Sign In')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;