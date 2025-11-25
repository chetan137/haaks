import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import PrivateRoute from './components/PrivateRoute';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

const ScrollToTop = () => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.pageYOffset > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        border: 'none',
        backgroundColor: 'var(--text-accent, #4CAF50)',
        color: 'white',
        fontSize: '20px',
        cursor: 'pointer',
        display: showButton ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        transition: 'all 0.3s ease',
        zIndex: 1000,
        backdropFilter: 'blur(10px)'
      }}
      onMouseOver={(e) => {
        e.target.style.transform = 'translateY(-2px)';
        e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
      }}
      onMouseOut={(e) => {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
      }}
    >
      ↑
    </button>
  );
};

const ProgressBar = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.pageYOffset / totalHeight) * 100;
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: `${scrollProgress}%`,
      height: '3px',
      backgroundColor: 'var(--text-accent, #4CAF50)',
      zIndex: 1001,
      transition: 'width 0.1s ease',
      boxShadow: '0 0 10px rgba(76, 175, 80, 0.5)'
    }} />
  );
};

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail('');
      }, 3000);
    }
  };

  const footerLinks = {
    quickLinks: ['Home', 'About', 'Services', 'Contact', 'Blog', 'FAQ'],
    support: ['Help Center', 'Documentation', 'API Reference', 'Community', 'Status Page', 'Contact Support'],
    legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy']
  };

  return (
    <footer style={{
      backgroundColor: 'var(--bg-primary, #1a1a1a)',
      color: 'var(--text-primary, #ffffff)',
      padding: '50px 0 30px 0',
      marginTop: 'auto',
      borderTop: '1px solid var(--border-color, #333)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle background pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(76, 175, 80, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        position: 'relative'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '50px',
          marginBottom: '40px'
        }}>
          {/* Company Info */}
          <div style={{
            animation: 'fadeInUp 0.6s ease-out'
          }}>
            <h3 style={{
              fontSize: '1.4rem',
              marginBottom: '20px',
              color: 'var(--text-accent, #4CAF50)',
              fontWeight: '600',
              letterSpacing: '-0.5px'
            }}>
              Your App
            </h3>
            <p style={{
              fontSize: '0.95rem',
              lineHeight: '1.7',
              color: 'var(--text-secondary, #cccccc)',
              marginBottom: '25px',
              maxWidth: '280px'
            }}>
              Building the future of digital communication and collaboration.
              Empowering users with innovative solutions that scale.
            </p>
            <div style={{
              display: 'flex',
              gap: '15px',
              alignItems: 'center'
            }}>
              {['📘', '🐦', '💼', '📷', '🎯'].map((icon, index) => (
                <a key={index} href="#" style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  textDecoration: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = 'var(--text-accent, #4CAF50)';
                  e.target.style.transform = 'translateY(-3px) scale(1.05)';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
                  e.target.style.transform = 'translateY(0) scale(1)';
                }}>
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{
              fontSize: '1.1rem',
              marginBottom: '20px',
              color: 'var(--text-primary, #ffffff)',
              fontWeight: '500'
            }}>
              Quick Links
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              {footerLinks.quickLinks.map((item, index) => (
                <li key={item} style={{
                  marginBottom: '12px',
                  animation: `fadeInLeft 0.6s ease-out ${index * 0.1}s both`
                }}>
                  <a href="#" style={{
                    color: 'var(--text-secondary, #cccccc)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s ease',
                    display: 'inline-block',
                    padding: '4px 0',
                    position: 'relative'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.color = 'var(--text-accent, #4CAF50)';
                    e.target.style.transform = 'translateX(5px)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.color = 'var(--text-secondary, #cccccc)';
                    e.target.style.transform = 'translateX(0)';
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
              fontSize: '1.1rem',
              marginBottom: '20px',
              color: 'var(--text-primary, #ffffff)',
              fontWeight: '500'
            }}>
              Support & Resources
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              {footerLinks.support.map((item, index) => (
                <li key={item} style={{
                  marginBottom: '12px',
                  animation: `fadeInLeft 0.6s ease-out ${index * 0.1}s both`
                }}>
                  <a href="#" style={{
                    color: 'var(--text-secondary, #cccccc)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s ease',
                    display: 'inline-block',
                    padding: '4px 0'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.color = 'var(--text-accent, #4CAF50)';
                    e.target.style.transform = 'translateX(5px)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.color = 'var(--text-secondary, #cccccc)';
                    e.target.style.transform = 'translateX(0)';
                  }}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 style={{
              fontSize: '1.1rem',
              marginBottom: '20px',
              color: 'var(--text-primary, #ffffff)',
              fontWeight: '500'
            }}>
              Stay Updated
            </h4>
            <p style={{
              fontSize: '0.9rem',
              color: 'var(--text-secondary, #cccccc)',
              marginBottom: '20px',
              lineHeight: '1.6'
            }}>
              Get the latest updates, features, and insights delivered to your inbox.
            </p>
            <form onSubmit={handleSubscribe} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #333)',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-primary, #ffffff)',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--text-accent, #4CAF50)';
                    e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-color, #333)';
                    e.target.style.backgroundColor = 'rgba(255,255,255,0.05)';
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={subscribed}
                style={{
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: subscribed ? '#45a049' : 'var(--text-accent, #4CAF50)',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: subscribed ? 'default' : 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseOver={(e) => {
                  if (!subscribed) {
                    e.target.style.backgroundColor = '#45a049';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!subscribed) {
                    e.target.style.backgroundColor = 'var(--text-accent, #4CAF50)';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              >
                {subscribed ? '✓ Subscribed!' : 'Subscribe'}
              </button>
            </form>
            {subscribed && (
              <p style={{
                fontSize: '0.85rem',
                color: 'var(--text-accent, #4CAF50)',
                marginTop: '10px',
                animation: 'fadeIn 0.3s ease'
              }}>
                Thank you for subscribing! 🎉
              </p>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '30px',
          margin: '40px 0',
          padding: '30px 0',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          {[
            { number: '10K+', label: 'Active Users' },
            { number: '99.9%', label: 'Uptime' },
            { number: '50+', label: 'Countries' },
            { number: '24/7', label: 'Support' }
          ].map((stat, index) => (
            <div key={index} style={{
              textAlign: 'center',
              animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
            }}>
              <div style={{
                fontSize: '1.8rem',
                fontWeight: '700',
                color: 'var(--text-accent, #4CAF50)',
                marginBottom: '5px',
                letterSpacing: '-0.5px'
              }}>
                {stat.number}
              </div>
              <div style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary, #cccccc)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          paddingTop: '20px'
        }}>
          <div style={{
            fontSize: '0.9rem',
            color: 'var(--text-secondary, #cccccc)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span>© 2024 Your App.</span>
            <span style={{
              padding: '4px 8px',
              backgroundColor: 'rgba(76, 175, 80, 0.2)',
              borderRadius: '12px',
              fontSize: '0.8rem',
              color: 'var(--text-accent, #4CAF50)'
            }}>
              Built with ❤️
            </span>
          </div>
          <div style={{
            display: 'flex',
            gap: '25px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            {footerLinks.legal.map((item) => (
              <a key={item} href="#" style={{
                color: 'var(--text-secondary, #cccccc)',
                textDecoration: 'none',
                fontSize: '0.9rem',
                transition: 'all 0.3s ease',
                padding: '5px 0',
                position: 'relative'
              }}
              onMouseOver={(e) => {
                e.target.style.color = 'var(--text-accent, #4CAF50)';
              }}
              onMouseOut={(e) => {
                e.target.style.color = 'var(--text-secondary, #cccccc)';
              }}>
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

const AppContent = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-secondary)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      <ProgressBar />
      <NavBar user={user} onLogout={logout} />

      {/* Main Content Area - Scrollable */}
      <main style={{
        flex: '1',
        overflow: 'auto',
        scrollBehavior: 'smooth',
        position: 'relative'
      }}>
        <div style={{
          minHeight: 'calc(100vh - 60px)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            flex: '1',
            position: 'relative',
            zIndex: 1
          }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={< Register/>} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={

                    <Dashboard />

                }
              />

              {/* Redirect any unknown routes to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>

          <Footer />
        </div>
      </main>

      <ScrollToTop />

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: var(--bg-primary, #1a1a1a);
        }

        ::-webkit-scrollbar-thumb {
          background: var(--text-accent, #4CAF50);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #45a049;
        }

        /* Smooth transitions for all interactive elements */
        * {
          transition: color 0.3s ease, background-color 0.3s ease, transform 0.3s ease;
        }
      `}</style>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Router>
          <AppContent />
        </Router>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
