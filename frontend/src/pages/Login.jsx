import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import ThreeBackground from '../components/ThreeBackground';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';

const Login = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
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
      const result = await login(formData.email, formData.password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setErrors({ submit: result.error });
      }
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ThreeBackground />
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        position: 'relative',
        zIndex: 1
      }}>
        <GlassCard style={{
          width: '100%',
          maxWidth: '450px',
          padding: '3rem 2rem'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: 'var(--gradient-primary)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '2.5rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem'
            }}>
              🚀 {t('auth.login', 'Login')}
            </div>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '1rem'
            }}>
              Access your modernization platform
            </p>
          </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              color: 'var(--text-gold)',
              fontWeight: '600',
              marginBottom: '0.5rem',
              fontSize: '1rem'
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
                border: `1px solid ${errors.email ? 'var(--error)' : 'rgba(255, 255, 255, 0.2)'}`,
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'var(--text-light)',
                backdropFilter: 'blur(10px)'
              }}
              onFocus={(e) => {
                if (!errors.email) {
                  e.target.style.borderColor = 'var(--accent-start)';
                  e.target.style.boxShadow = '0 0 0 2px rgba(142, 45, 226, 0.3)';
                }
              }}
              onBlur={(e) => {
                if (!errors.email) {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
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

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              color: 'var(--text-gold)',
              fontWeight: '600',
              marginBottom: '0.5rem',
              fontSize: '1rem'
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
                border: `1px solid ${errors.password ? 'var(--error)' : 'rgba(255, 255, 255, 0.2)'}`,
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'var(--text-light)',
                backdropFilter: 'blur(10px)'
              }}
              onFocus={(e) => {
                if (!errors.password) {
                  e.target.style.borderColor = 'var(--accent-start)';
                  e.target.style.boxShadow = '0 0 0 2px rgba(142, 45, 226, 0.3)';
                }
              }}
              onBlur={(e) => {
                if (!errors.password) {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
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

          {errors.submit && (
            <div style={{
              backgroundColor: 'rgba(255, 48, 48, 0.9)',
              color: 'var(--text-light)',
              padding: '0.75rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              textAlign: 'center',
              border: '1px solid #ff3030',
              boxShadow: '0 4px 12px rgba(255, 48, 48, 0.3)'
            }}>
              {errors.submit}
            </div>
          )}

          <GradientButton
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              marginBottom: '1.5rem',
              padding: '1rem'
            }}
          >
            {loading ? t('auth.loggingIn', 'Logging in...') : `🚀 ${t('auth.login', 'Login')}`}
          </GradientButton>
        </form>

          <div style={{
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}>
            {t('auth.noAccount', "Don't have an account?")}{' '}
            <Link
              to="/register"
              style={{
                background: 'var(--gradient-primary)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              {t('auth.register', 'Register')}
            </Link>
          </div>
        </GlassCard>
      </div>
    </>
  );
};

export default Login;