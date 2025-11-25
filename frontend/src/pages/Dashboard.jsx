import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AS400ModernizationAssistant from '../components/AS400ModernizationAssistant';
import ModernizationApp from '../components/ModernizationApp';

// Placeholder components - replace with your actual imports
const ProfessionalNavbar = () => (
  <div style={{
    padding: '1rem 2rem',
    background: 'rgba(0, 0, 0, 0.3)',
    borderBottom: '1px solid rgba(255, 215, 0, 0.3)'
  }}>
    <h2 style={{ color: '#FFD700', margin: 0 }}>AS/400 Modernization Platform</h2>
  </div>
);

const Dashboard = () => {
  const [showAS400Component, setShowAS400Component] = useState(false);
  const [showModernizationApp, setShowModernizationApp] = useState(false);

  const handleNavigateToAS400 = () => {
    setShowAS400Component(true);
    setShowModernizationApp(false);
  };

  const handleNavigateToModernization = () => {
    setShowModernizationApp(true);
    setShowAS400Component(false);
  };

  const handleBackToDashboard = () => {
    setShowAS400Component(false);
    setShowModernizationApp(false);
  };

  // Glass effect styles
  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
  };

  const buttonGlassStyle = {
    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.8), rgba(255, 215, 0, 0.6))',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(255, 215, 0, 0.2)',
    transition: 'all 0.3s ease'
  };

  // Show AS400 component if user clicked the button
  if (showAS400Component) {
    return (
      <div>
        <motion.button
          onClick={handleBackToDashboard}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-4 z-50 px-4 py-2 bg-gray-800 text-white rounded-lg border border-orange-500/30 hover:bg-gray-700 transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            position: 'fixed',
            top: '1rem',
            left: '1rem',
            zIndex: 50,
            padding: '0.75rem 1.5rem',
            background: '#1f2937',
            color: '#fff',
            borderRadius: '0.5rem',
            border: '1px solid rgba(255, 165, 0, 0.3)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}
        >
          ← Back to Dashboard
        </motion.button>
        <AS400ModernizationAssistant />
      </div>
    );
  }

  // Show Modernization App if user clicked the new modernization button
  if (showModernizationApp) {
    return (
      <div>
        <motion.button
          onClick={handleBackToDashboard}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-4 z-50 px-4 py-2 bg-gray-800 text-white rounded-lg border border-blue-500/30 hover:bg-gray-700 transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            position: 'fixed',
            top: '1rem',
            left: '1rem',
            zIndex: 50,
            padding: '0.75rem 1.5rem',
            background: '#1f2937',
            color: '#fff',
            borderRadius: '0.5rem',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}
        >
          ← Back to Dashboard
        </motion.button>
        <ModernizationApp />
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%)',
      minHeight: '100vh',
      position: 'relative',
      color: '#fff'
    }}>
      {/* Animated Background Elements */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: 0
      }}>
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: '100px',
              height: '100px',
              background: `linear-gradient(45deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05))`,
              borderRadius: '50%',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <ProfessionalNavbar />

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem 1rem',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            textAlign: 'center',
            marginBottom: '3rem'
          }}
        >
          <motion.h1
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              color: '#fff',
              fontSize: '2.5rem',
              fontWeight: '700',
              marginBottom: '0.5rem'
            }}
          >
            AS/400 <motion.span
              style={{ color: '#FFD700' }}
              animate={{
                textShadow: [
                  '0 0 5px rgba(255, 215, 0, 0.5)',
                  '0 0 20px rgba(255, 215, 0, 0.8)',
                  '0 0 5px rgba(255, 215, 0, 0.5)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Modernization Platform
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '1.1rem',
              margin: '0 0 2rem 0'
            }}
          >
            AI-Powered Legacy System Transformation with Multi-Agent Pipeline
          </motion.p>

          {/* Main Demo Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            style={{
              marginTop: '1rem',
              padding: '2rem',
              ...glassStyle,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <motion.div
              style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.1), transparent)'
              }}
              animate={{ left: ['100%', '-100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />

            <motion.p
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                color: '#fff',
                fontSize: '1.2rem',
                margin: '0 0 1.5rem 0',
                fontWeight: '600'
              }}
            >
              🚀 <strong>Main Project Feature:</strong>
            </motion.p>

            <motion.button
              onClick={handleNavigateToAS400}
              whileHover={{
                scale: 1.05,
                boxShadow: '0 10px 40px rgba(255, 215, 0, 0.3)'
              }}
              whileTap={{ scale: 0.98 }}
              style={{
                ...buttonGlassStyle,
                color: '#000',
                fontSize: '1.3rem',
                fontWeight: '700',
                padding: '1.25rem 3rem',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                border: 'none'
              }}
            >
              <motion.span
                style={{
                  position: 'relative',
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  justifyContent: 'center'
                }}
              >
                <motion.span
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  🔗
                </motion.span>
                Access Full Demo Environment
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ✨
                </motion.span>
              </motion.span>

              <motion.div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)'
                }}
                animate={{ left: ['100%', '-100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </motion.button>

            {/* New Modernization App Button */}
            <motion.button
              onClick={handleNavigateToModernization}
              whileHover={{
                scale: 1.05,
                boxShadow: '0 10px 40px rgba(59, 130, 246, 0.3)'
              }}
              whileTap={{ scale: 0.98 }}
              style={{
                ...buttonGlassStyle,
                background: 'linear-gradient(145deg, rgba(59, 130, 246, 0.8), rgba(37, 99, 235, 0.9))',
                color: '#fff',
                fontSize: '1.3rem',
                fontWeight: '700',
                padding: '1.25rem 3rem',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                border: 'none',
                marginTop: '1rem'
              }}
            >
              <motion.span
                style={{
                  position: 'relative',
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  justifyContent: 'center'
                }}
              >
                <motion.span
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  🚀
                </motion.span>
                AI Modernization Dashboard
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ⚡
                </motion.span>
              </motion.span>

              <motion.div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)'
                }}
                animate={{ left: ['100%', '-100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </motion.button>
          </motion.div>
        </motion.div>

        {/* AI Agentic Flow Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          style={{
            marginTop: '3rem',
            padding: '2rem',
            ...glassStyle
          }}
        >
          <h2 style={{
            color: '#FFD700',
            fontSize: '2rem',
            fontWeight: '700',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            🤖 AI Agentic Multi-Agent Pipeline Workflow
          </h2>

          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 215, 0, 0.2)'
          }}>
            {/* Workflow Description */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              {[
                {
                  step: '1',
                  icon: '👤',
                  title: 'User Registration & Login',
                  description: 'User starts the journey by registering with basic info (Name, Email, Password) and then logs in securely using Phone/Email + Password authentication.',
                  color: '#FF6B6B'
                },
                {
                  step: '2',
                  icon: '📤',
                  title: 'File Upload & Preprocessing',
                  description: 'User uploads legacy files (.cl / .cpy format). The system preprocesses files through chunking and generates orchestrator instructions for the multi-agent pipeline.',
                  color: '#4ECDC4'
                },
                {
                  step: '3',
                  icon: '🔄',
                  title: 'Multi-Agent Processing',
                  description: 'Parser extracts schema & fields. Transformer converts to modern SQL & APIs. Validator checks correctness & confidence. If invalid, Repair Agent fixes outputs.',
                  color: '#95E1D3'
                },
                {
                  step: '4',
                  icon: '🎯',
                  title: 'Validation & Quality Check',
                  description: 'System checks correctness and confidence levels. Explainer Agent provides insights. API Layer ensures smooth integration with modern systems.',
                  color: '#F38181'
                },
                {
                  step: '5',
                  icon: '💾',
                  title: 'Database & Results',
                  description: 'Processed data is stored in modern DB schema. Results, reports, and RPG conversions are generated and made available to the user.',
                  color: '#FFA07A'
                },
                {
                  step: '6',
                  icon: '📊',
                  title: 'Dashboard & Analytics',
                  description: 'User accesses comprehensive dashboard with layout files (CSV), modernization reports, RPG conversions, and detailed analytics of the transformation process.',
                  color: '#98D8C8'
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + index * 0.1 }}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: `0 10px 30px ${item.color}40`
                  }}
                  style={{
                    padding: '1.5rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    border: `2px solid ${item.color}40`,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <motion.div
                    style={{
                      position: 'absolute',
                      top: '-50%',
                      right: '-50%',
                      width: '100px',
                      height: '100px',
                      background: `radial-gradient(circle, ${item.color}20, transparent)`,
                      borderRadius: '50%'
                    }}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <motion.div
                      animate={{
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                      style={{
                        fontSize: '2.5rem',
                        filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))'
                      }}
                    >
                      {item.icon}
                    </motion.div>
                    <div>
                      <div style={{
                        background: item.color,
                        color: '#000',
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '1rem'
                      }}>
                        {item.step}
                      </div>
                    </div>
                  </div>

                  <h3 style={{
                    color: item.color,
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    marginBottom: '0.75rem'
                  }}>
                    {item.title}
                  </h3>

                  <p style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    margin: 0
                  }}>
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Technical Components */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
              style={{
                marginTop: '2rem',
                padding: '1.5rem',
                background: 'rgba(255, 215, 0, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 215, 0, 0.3)'
              }}
            >
              <h3 style={{
                color: '#FFD700',
                fontSize: '1.3rem',
                fontWeight: '600',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                🔧 Core Technical Components
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                {[
                  { icon: '🔍', name: 'Parser Agent', desc: 'Schema extraction' },
                  { icon: '🔄', name: 'Transformer Agent', desc: 'Code conversion' },
                  { icon: '✅', name: 'Validator Agent', desc: 'Quality assurance' },
                  { icon: '🔧', name: 'Repair Agent', desc: 'Error fixing' },
                  { icon: '💬', name: 'Explainer Agent', desc: 'Insight generation' },
                  { icon: '🌐', name: 'API Layer', desc: 'System integration' },
                  { icon: '💾', name: 'DB Schema', desc: 'Data storage' },
                  { icon: '📈', name: 'Orchestrator', desc: 'Workflow control' }
                ].map((component, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.05, y: -3 }}
                    style={{
                      padding: '1rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 215, 0, 0.2)',
                      textAlign: 'center'
                    }}
                  >
                    <motion.div
                      animate={{
                        rotate: [0, 360],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{
                        duration: 4 + idx * 0.5,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      style={{ fontSize: '2rem', marginBottom: '0.5rem' }}
                    >
                      {component.icon}
                    </motion.div>
                    <h4 style={{
                      color: '#FFD700',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      margin: '0 0 0.25rem 0'
                    }}>
                      {component.name}
                    </h4>
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.75rem',
                      margin: 0
                    }}>
                      {component.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Key Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.6 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginTop: '3rem'
          }}
        >
          {[
            { icon: '🤖', title: 'Multi-Agent AI', desc: 'Collaborative intelligent agents', color: '#FF6B6B' },
            { icon: '⚡', title: 'Automated Pipeline', desc: 'Streamlined transformation', color: '#4ECDC4' },
            { icon: '🛡️', title: 'Quality Assurance', desc: 'Validated & verified output', color: '#95E1D3' },
            { icon: '📊', title: 'Comprehensive Analytics', desc: 'Detailed insights & reports', color: '#FFA07A' }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2 + index * 0.1, duration: 0.5 }}
              whileHover={{
                scale: 1.05,
                y: -5,
                boxShadow: `0 10px 30px ${item.color}40`
              }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                ...glassStyle,
                borderColor: `${item.color}40`,
                transition: 'all 0.3s ease'
              }}
            >
              <motion.div
                whileHover={{
                  rotate: [0, -10, 10, 0],
                  scale: 1.2
                }}
                transition={{ duration: 0.5 }}
                style={{
                  fontSize: '3rem',
                  marginBottom: '1rem',
                  filter: `drop-shadow(0 0 10px ${item.color}80)`
                }}
              >
                {item.icon}
              </motion.div>
              <h4 style={{
                color: item.color,
                fontSize: '1.1rem',
                fontWeight: '600',
                margin: '0 0 0.5rem 0'
              }}>
                {item.title}
              </h4>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.9rem',
                margin: 0
              }}>
                {item.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
