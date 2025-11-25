import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import ProfessionalNavbar from '../components/ProfessionalNavbar';

const Home = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  // Temporarily disabled redirect to show new UI sections
  // if (user) {
  //   // If user is logged in, redirect to dashboard
  //   window.location.href = '/dashboard';
  //   return null;
  // }

  return (
    <div style={{
      background: 'var(--bg-primary)',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <ProfessionalNavbar />

      {/* Background Gradient Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100vh',
        background: 'radial-gradient(ellipse at top, rgba(255, 140, 0, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Hero Section */}
      <section className="section-padding" style={{
        textAlign: 'center',
        padding: '6rem 2rem 5rem',
        maxWidth: '1400px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        <div className="hero-glass-card" style={{
          background: 'rgba(26, 26, 26, 0.6)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '4rem 3rem',
          border: '1px solid rgba(255, 140, 0, 0.2)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          marginBottom: '2rem'
        }}>
          <div className="hero-title" style={{
            background: 'var(--gradient-primary)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: 'clamp(3rem, 6vw, 5rem)',
            fontWeight: '900',
            marginBottom: '1rem',
            letterSpacing: '-0.03em',
            lineHeight: '1.1'
          }}>
            AS/400 MODERNIZATION
          </div>

          <h2 className="hero-subtitle" style={{
            color: 'var(--text-primary)',
            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            fontWeight: '700',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <span style={{
              fontSize: '2.5rem',
              filter: 'drop-shadow(0 0 10px rgba(255, 140, 0, 0.6))'
            }}>🚀</span>
            PLATFORM
          </h2>

          <p className="hero-description" style={{
            color: 'var(--text-secondary)',
            fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
            lineHeight: '1.7',
            marginBottom: '3rem',
            maxWidth: '900px',
            margin: '0 auto 3rem auto',
            fontWeight: '300'
          }}>
            {t('home.subtitle', 'Transform your legacy IBM AS/400 systems with AI-powered modernization tools, expert guidance, and seamless migration strategies.')}
          </p>

          {/* CTA Buttons */}
          <div className="cta-buttons" style={{
            display: 'flex',
            gap: '1.5rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '2rem'
          }}>
            <Link to="/dashboard" style={{ textDecoration: 'none' }}>
              <button className="btn-primary" style={{
                padding: '16px 32px',
                fontSize: '1.2rem',
                borderRadius: '12px',
                fontWeight: '600',
                boxShadow: '0 8px 24px rgba(255, 140, 0, 0.3)',
                transform: 'translateY(0)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 12px 32px rgba(255, 140, 0, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 24px rgba(255, 140, 0, 0.3)';
              }}>
                🚀 {t('auth.getStarted', 'Get Started')}
              </button>
            </Link>

            <Link to="/login" style={{ textDecoration: 'none' }}>
              <button className="btn-secondary" style={{
                padding: '15px 31px',
                fontSize: '1.2rem',
                borderRadius: '12px',
                fontWeight: '600',
                borderWidth: '2px',
                transform: 'translateY(0)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 24px rgba(255, 140, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}>
                🔑 {t('auth.signIn', 'Sign In')}
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section style={{
        background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.8) 0%, rgba(17, 17, 17, 0.9) 100%)',
        padding: '5rem 2rem',
        borderTop: '1px solid rgba(255, 140, 0, 0.2)',
        borderBottom: '1px solid rgba(255, 140, 0, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255, 140, 0, 0.05) 0%, transparent 25%), radial-gradient(circle at 75% 75%, rgba(255, 215, 0, 0.05) 0%, transparent 25%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            background: 'rgba(26, 26, 26, 0.6)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '3rem 2rem',
            border: '1px solid rgba(255, 140, 0, 0.2)',
            boxShadow: '0 16px 32px rgba(0, 0, 0, 0.3)',
            marginBottom: '3rem'
          }}>
            <h3 style={{
              color: 'var(--text-primary)',
              fontSize: 'clamp(2rem, 4vw, 2.5rem)',
              fontWeight: '700',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem'
            }}>
              <span style={{
                fontSize: '2.5rem',
                filter: 'drop-shadow(0 0 10px rgba(255, 140, 0, 0.6))'
              }}>🎯</span>
              Why Modernize AS/400?
            </h3>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '1.1rem',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              Unlock the potential of your legacy systems with modern solutions
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem'
          }}>
            {[
              { icon: '📈', title: 'Scalability', desc: 'Adapt to growing business demands with flexible, cloud-ready architecture' },
              { icon: '⚡', title: 'Efficiency', desc: 'Improve performance and reduce operational costs significantly' },
              { icon: '🔗', title: 'Integration', desc: 'Connect seamlessly with modern IT infrastructure and APIs' },
              { icon: '🌱', title: 'Sustainability', desc: 'Ensure long-term system viability and future-proof your business' }
            ].map((item, index) => (
              <div key={index} className="value-card" style={{
                background: 'rgba(26, 26, 26, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 140, 0, 0.2)',
                borderRadius: '16px',
                padding: '2rem',
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 16px 40px rgba(255, 140, 0, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(255, 140, 0, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
                e.currentTarget.style.borderColor = 'rgba(255, 140, 0, 0.2)';
              }}>
                {/* Gradient overlay on hover */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(255, 140, 0, 0.02) 0%, rgba(255, 215, 0, 0.02) 100%)',
                  borderRadius: '16px',
                  pointerEvents: 'none',
                  zIndex: -1
                }} />

                <div style={{
                  fontSize: '3.5rem',
                  marginBottom: '1.5rem',
                  filter: 'drop-shadow(0 0 8px rgba(255, 140, 0, 0.4))'
                }}>
                  {item.icon}
                </div>
                <h4 style={{
                  color: 'var(--text-primary)',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  fontSize: '1.3rem'
                }}>
                  {item.title}
                </h4>
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '1rem',
                  lineHeight: '1.6'
                }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        padding: '5rem 2rem',
        maxWidth: '1400px',
        margin: '0 auto',
        position: 'relative'
      }}>
        {/* Section Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '4rem'
        }}>
          <div style={{
            background: 'rgba(26, 26, 26, 0.6)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '2rem',
            border: '1px solid rgba(255, 140, 0, 0.2)',
            boxShadow: '0 16px 32px rgba(0, 0, 0, 0.3)',
            display: 'inline-block'
          }}>
            <h3 style={{
              color: 'var(--text-primary)',
              fontSize: 'clamp(2rem, 4vw, 2.5rem)',
              fontWeight: '700',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem'
            }}>
              <span style={{
                fontSize: '2.5rem',
                filter: 'drop-shadow(0 0 10px rgba(255, 140, 0, 0.6))'
              }}>✨</span>
              Platform Features
            </h3>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '1.1rem',
              margin: 0,
              lineHeight: '1.6'
            }}>
              Powerful tools designed for seamless modernization
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '2.5rem'
        }}>
          {[
            {
              icon: '🔥',
              title: 'AI Assistant',
              description: 'Get expert guidance on code migration, database modernization, and system integration with our intelligent assistant powered by advanced machine learning.',
              gradient: 'linear-gradient(135deg, rgba(255, 100, 0, 0.1) 0%, rgba(255, 140, 0, 0.05) 100%)'
            },
            {
              icon: '⚡',
              title: 'Voice Control',
              description: 'Use voice commands to interact with the system and get hands-free assistance for your modernization projects. Natural language processing included.',
              gradient: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 140, 0, 0.05) 100%)'
            },
            {
              icon: '🚀',
              title: 'Multilingual',
              description: 'Platform supports multiple languages to ensure accessibility for global development teams. Real-time translation and localization features.',
              gradient: 'linear-gradient(135deg, rgba(255, 140, 0, 0.1) 0%, rgba(255, 100, 0, 0.05) 100%)'
            }
          ].map((feature, index) => (
            <div
              key={index}
              className="feature-card"
              style={{
                background: 'rgba(26, 26, 26, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 140, 0, 0.2)',
                borderRadius: '20px',
                padding: '2.5rem',
                textAlign: 'center',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
                transition: 'all 0.4s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-12px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 20px 48px rgba(255, 140, 0, 0.25)';
                e.currentTarget.style.borderColor = 'rgba(255, 140, 0, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.4)';
                e.currentTarget.style.borderColor = 'rgba(255, 140, 0, 0.2)';
              }}
            >
              {/* Dynamic background gradient */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: feature.gradient,
                borderRadius: '20px',
                pointerEvents: 'none',
                zIndex: -1
              }} />

              {/* Floating orb animation */}
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '8px',
                height: '8px',
                background: 'var(--gradient-primary)',
                borderRadius: '50%',
                boxShadow: '0 0 20px rgba(255, 140, 0, 0.6)',
                animation: `pulse 2s infinite ease-in-out ${index * 0.5}s`
              }} />

              <div style={{
                fontSize: '4rem',
                marginBottom: '1.5rem',
                filter: 'drop-shadow(0 0 12px rgba(255, 140, 0, 0.5))',
                transform: 'scale(1)',
                transition: 'transform 0.3s ease'
              }}>
                {feature.icon}
              </div>

              <h4 style={{
                color: 'var(--text-primary)',
                fontSize: '1.5rem',
                fontWeight: '600',
                marginBottom: '1.5rem',
                background: 'var(--gradient-primary)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {feature.title}
              </h4>

              <p style={{
                color: 'var(--text-secondary)',
                lineHeight: '1.7',
                fontSize: '1rem'
              }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Statistics Section */}
      <section style={{
        background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.95) 0%, rgba(26, 26, 26, 0.9) 100%)',
        padding: '5rem 2rem',
        borderTop: '1px solid rgba(255, 140, 0, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(26, 26, 26, 0.6)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '3rem 2rem',
            border: '1px solid rgba(255, 140, 0, 0.2)',
            boxShadow: '0 16px 32px rgba(0, 0, 0, 0.3)',
            marginBottom: '3rem'
          }}>
            <h3 style={{
              color: 'var(--text-primary)',
              fontSize: 'clamp(2rem, 4vw, 2.5rem)',
              fontWeight: '700',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem'
            }}>
              <span style={{
                fontSize: '2.5rem',
                filter: 'drop-shadow(0 0 10px rgba(255, 140, 0, 0.6))'
              }}>📊</span>
              Trusted by Industry Leaders
            </h3>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '1.1rem',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              Join thousands of enterprises who have successfully modernized their AS/400 systems
            </p>
          </div>

          <div className="stats-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem'
          }}>
            {[
              { number: '500+', label: 'Successful Migrations', icon: '🚀' },
              { number: '98%', label: 'Client Satisfaction', icon: '⭐' },
              { number: '50M+', label: 'Lines of Code Modernized', icon: '💻' },
              { number: '24/7', label: 'Expert Support', icon: '🛠️' }
            ].map((stat, index) => (
              <div key={index} style={{
                background: 'rgba(26, 26, 26, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 140, 0, 0.2)',
                borderRadius: '16px',
                padding: '2rem 1rem',
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 16px 40px rgba(255, 140, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
              }}>
                <div style={{
                  fontSize: '2.5rem',
                  marginBottom: '1rem',
                  filter: 'drop-shadow(0 0 8px rgba(255, 140, 0, 0.4))'
                }}>
                  {stat.icon}
                </div>
                <div style={{
                  color: 'var(--text-primary)',
                  fontSize: '2rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                  background: 'var(--gradient-primary)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {stat.number}
                </div>
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  margin: 0
                }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section style={{
        padding: '5rem 2rem',
        maxWidth: '1400px',
        margin: '0 auto',
        position: 'relative'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '4rem'
        }}>
          <div style={{
            background: 'rgba(26, 26, 26, 0.6)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '2rem',
            border: '1px solid rgba(255, 140, 0, 0.2)',
            boxShadow: '0 16px 32px rgba(0, 0, 0, 0.3)',
            display: 'inline-block'
          }}>
            <h3 style={{
              color: 'var(--text-primary)',
              fontSize: 'clamp(2rem, 4vw, 2.5rem)',
              fontWeight: '700',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem'
            }}>
              <span style={{
                fontSize: '2.5rem',
                filter: 'drop-shadow(0 0 10px rgba(255, 140, 0, 0.6))'
              }}>💬</span>
              What Our Clients Say
            </h3>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '2rem'
        }}>
          {[
            {
              quote: "The AS/400 modernization platform transformed our legacy systems seamlessly. The AI assistant provided invaluable guidance throughout the migration process.",
              author: "Sarah Johnson",
              title: "CTO, TechCorp Industries",
              avatar: "👩‍💼"
            },
            {
              quote: "Exceptional support and cutting-edge tools. Our development team was able to modernize decades-old code in just months instead of years.",
              author: "Michael Chen",
              title: "Lead Developer, GlobalSoft",
              avatar: "👨‍💻"
            },
            {
              quote: "The multilingual support and voice control features made adoption smooth across our international teams. Highly recommended!",
              author: "Elena Rodriguez",
              title: "IT Director, InnovateLabs",
              avatar: "👩‍🔬"
            }
          ].map((testimonial, index) => (
            <div key={index} className="testimonial-card" style={{
              background: 'rgba(26, 26, 26, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 140, 0, 0.2)',
              borderRadius: '20px',
              padding: '2.5rem',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 20px 48px rgba(255, 140, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.4)';
            }}>
              <div style={{
                fontSize: '3rem',
                color: 'rgba(255, 140, 0, 0.3)',
                marginBottom: '1rem'
              }}>
                "
              </div>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '1.1rem',
                lineHeight: '1.6',
                marginBottom: '2rem',
                fontStyle: 'italic'
              }}>
                {testimonial.quote}
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{
                  fontSize: '2.5rem',
                  background: 'var(--gradient-primary)',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {testimonial.avatar}
                </div>
                <div>
                  <div style={{
                    color: 'var(--text-primary)',
                    fontWeight: '600',
                    marginBottom: '0.25rem'
                  }}>
                    {testimonial.author}
                  </div>
                  <div style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem'
                  }}>
                    {testimonial.title}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section style={{
        background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.8) 0%, rgba(17, 17, 17, 0.9) 100%)',
        padding: '5rem 2rem',
        borderTop: '1px solid rgba(255, 140, 0, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(ellipse at center, rgba(255, 140, 0, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            background: 'rgba(26, 26, 26, 0.6)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '4rem 3rem',
            border: '1px solid rgba(255, 140, 0, 0.2)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
          }}>
            <h3 style={{
              color: 'var(--text-primary)',
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: '700',
              marginBottom: '1.5rem',
              background: 'var(--gradient-primary)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Ready to Modernize Your AS/400 Systems?
            </h3>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '1.2rem',
              lineHeight: '1.6',
              marginBottom: '2.5rem',
              maxWidth: '700px',
              margin: '0 auto 2.5rem auto'
            }}>
              Join industry leaders who have transformed their legacy systems with our AI-powered modernization platform. Start your journey today.
            </p>
            <div style={{
              display: 'flex',
              gap: '1.5rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <Link to="/register" style={{ textDecoration: 'none' }}>
                <button className="btn-primary" style={{
                  padding: '18px 36px',
                  fontSize: '1.3rem',
                  borderRadius: '12px',
                  fontWeight: '600',
                  boxShadow: '0 12px 32px rgba(255, 140, 0, 0.4)',
                  transform: 'translateY(0)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-3px)';
                  e.target.style.boxShadow = '0 16px 40px rgba(255, 140, 0, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 12px 32px rgba(255, 140, 0, 0.4)';
                }}>
                  🚀 Start Free Trial
                </button>
              </Link>
              <button style={{
                background: 'transparent',
                border: '2px solid rgba(255, 140, 0, 0.6)',
                color: 'var(--text-primary)',
                padding: '16px 32px',
                fontSize: '1.3rem',
                borderRadius: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 140, 0, 0.1)';
                e.target.style.borderColor = 'rgba(255, 140, 0, 0.8)';
                e.target.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.borderColor = 'rgba(255, 140, 0, 0.6)';
                e.target.style.transform = 'translateY(0)';
              }}>
                📞 Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: 'linear-gradient(135deg, #000000 0%, #111111 100%)',
        borderTop: '1px solid rgba(255, 140, 0, 0.3)',
        padding: '4rem 2rem 2rem',
        position: 'relative'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          {/* Main Footer Content */}
          <div className="footer-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '3rem',
            marginBottom: '3rem'
          }}>
            {/* Company Info */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  background: 'var(--gradient-primary)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  🚀
                </div>
                <span style={{
                  color: 'var(--text-primary)',
                  fontSize: '20px',
                  fontWeight: '600'
                }}>
                  AS/400 <span style={{ color: '#FFD700' }}>Modernization</span>
                </span>
              </div>
              <p style={{
                color: 'var(--text-secondary)',
                lineHeight: '1.6',
                marginBottom: '1.5rem'
              }}>
                Transforming legacy IBM AS/400 systems with cutting-edge AI technology and expert guidance.
              </p>
              <div style={{
                display: 'flex',
                gap: '1rem'
              }}>
                {['💼', '🐦', '📧', '📱'].map((icon, index) => (
                  <div key={index} style={{
                    width: '40px',
                    height: '40px',
                    background: 'rgba(255, 140, 0, 0.1)',
                    border: '1px solid rgba(255, 140, 0, 0.3)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 140, 0, 0.2)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 140, 0, 0.1)';
                    e.target.style.transform = 'translateY(0)';
                  }}>
                    {icon}
                  </div>
                ))}
              </div>
            </div>

            {/* Solutions */}
            <div>
              <h4 style={{
                color: 'var(--text-primary)',
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '1.5rem'
              }}>
                Solutions
              </h4>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                {[
                  'Code Migration',
                  'Database Modernization',
                  'System Integration',
                  'Performance Optimization',
                  'Security Enhancement',
                  'Cloud Migration'
                ].map((item, index) => (
                  <li key={index} style={{
                    marginBottom: '0.75rem'
                  }}>
                    <a href="#" style={{
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      transition: 'color 0.3s ease',
                      display: 'block'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = 'var(--accent-start)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = 'var(--text-secondary)';
                    }}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 style={{
                color: 'var(--text-primary)',
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '1.5rem'
              }}>
                Resources
              </h4>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                {[
                  'Documentation',
                  'API Reference',
                  'Case Studies',
                  'Best Practices',
                  'Community Forum',
                  'Video Tutorials'
                ].map((item, index) => (
                  <li key={index} style={{
                    marginBottom: '0.75rem'
                  }}>
                    <a href="#" style={{
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      transition: 'color 0.3s ease',
                      display: 'block'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = 'var(--accent-start)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = 'var(--text-secondary)';
                    }}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 style={{
                color: 'var(--text-primary)',
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '1.5rem'
              }}>
                Support
              </h4>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                {[
                  'Help Center',
                  'Contact Support',
                  'System Status',
                  'Security Center',
                  'Privacy Policy',
                  'Terms of Service'
                ].map((item, index) => (
                  <li key={index} style={{
                    marginBottom: '0.75rem'
                  }}>
                    <a href="#" style={{
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      transition: 'color 0.3s ease',
                      display: 'block'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = 'var(--accent-start)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = 'var(--text-secondary)';
                    }}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="footer-bottom" style={{
            borderTop: '1px solid rgba(255, 140, 0, 0.2)',
            paddingTop: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{
              color: 'var(--text-secondary)',
              fontSize: '14px'
            }}>
              © 2024 AS/400 Modernization Platform. All rights reserved.
            </div>
            <div style={{
              display: 'flex',
              gap: '2rem',
              alignItems: 'center'
            }}>
              <span style={{
                color: 'var(--text-secondary)',
                fontSize: '14px'
              }}>
                🌟 Trusted by 500+ enterprises
              </span>
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center'
              }}>
                <span style={{
                  color: 'var(--text-secondary)',
                  fontSize: '14px'
                }}>
                  Built with
                </span>
                <span style={{
                  color: 'var(--accent-start)',
                  fontSize: '16px'
                }}>
                  💖
                </span>
                <span style={{
                  color: 'var(--text-secondary)',
                  fontSize: '14px'
                }}>
                  by 404 KILLERS
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
