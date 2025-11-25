import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ModernizationDashboard from './modernization/ModernizationDashboard';

const ModernizationApp = () => {
  const [modernizationResults, setModernizationResults] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const slideIn = {
    initial: { opacity: 0, x: -100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 100 }
  };

  const scaleIn = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
  };

  // Handle file upload
  const handleFileUpload = (file) => {
    setCurrentFile(file);
    setIsProcessing(true);
    setModernizationResults(null);
  };

  // Handle processing results
  const handleProcessResults = (results) => {
    setModernizationResults(results);
    setIsProcessing(false);
    setProcessingStatus(null);
  };

  // Demo function to load sample data
  const loadSampleData = () => {
    const sampleResults = {
      schema: {
        tables: [
          {
            name: "customers",
            columns: [
              { name: "id", type: "INT", isPrimary: true, isNotNull: true },
              { name: "customer_id", type: "VARCHAR(20)", isUnique: true, isNotNull: true },
              { name: "customer_name", type: "VARCHAR(100)", isNotNull: true },
              { name: "customer_address", type: "TEXT" },
              { name: "created_at", type: "TIMESTAMP", hasDefault: true },
              { name: "updated_at", type: "TIMESTAMP", hasDefault: true }
            ],
            relationships: []
          },
          {
            name: "customer_reports",
            columns: [
              { name: "id", type: "INT", isPrimary: true, isNotNull: true },
              { name: "customer_id", type: "VARCHAR(20)", isNotNull: true },
              { name: "report_date", type: "DATE", isNotNull: true },
              { name: "report_data", type: "JSON" }
            ],
            relationships: [
              { fromColumn: "customer_id", toTable: "customers", toColumn: "customer_id" }
            ]
          }
        ]
      },
      apiDesign: {
        endpoints: [
          {
            path: "/api/customers",
            method: "GET",
            description: "Get all customers with pagination",
            parameters: ["page", "limit", "search"],
            response: "List of customer objects"
          },
          {
            path: "/api/customers/{id}",
            method: "GET",
            description: "Get customer by ID",
            parameters: ["id"],
            response: "Customer object"
          },
          {
            path: "/api/customers",
            method: "POST",
            description: "Create new customer",
            body: "Customer data object",
            response: "Created customer object"
          },
          {
            path: "/api/customers/{id}",
            method: "PUT",
            description: "Update customer",
            parameters: ["id"],
            body: "Updated customer data",
            response: "Updated customer object"
          },
          {
            path: "/api/customers/{id}",
            method: "DELETE",
            description: "Delete customer",
            parameters: ["id"],
            response: "Success confirmation"
          },
          {
            path: "/api/customers/{id}/reports",
            method: "GET",
            description: "Get customer reports",
            parameters: ["id", "date_from", "date_to"],
            response: "List of report objects"
          }
        ],
        models: [
          {
            name: "Customer",
            fields: [
              { name: "id", type: "integer", required: true },
              { name: "customerId", type: "string", required: true },
              { name: "customerName", type: "string", required: true },
              { name: "customerAddress", type: "string", required: false },
              { name: "createdAt", type: "datetime", required: true },
              { name: "updatedAt", type: "datetime", required: true }
            ]
          },
          {
            name: "CustomerReport",
            fields: [
              { name: "id", type: "integer", required: true },
              { name: "customerId", type: "string", required: true },
              { name: "reportDate", type: "date", required: true },
              { name: "reportData", type: "object", required: true }
            ]
          }
        ],
        security: {
          authentication: "JWT",
          authorization: "RBAC",
          rateLimiting: "100 requests per minute",
          inputValidation: "Joi schema validation",
          sqlInjectionPrevention: "Parameterized queries"
        },
        architecture: {
          pattern: "Microservices",
          framework: "Spring Boot",
          database: "MySQL",
          caching: "Redis",
          messaging: "Apache Kafka"
        }
      },
      dashboardData: {
        complexity: "medium",
        confidence: 0.85,
        linesOfCode: 1250,
        dependencies: 5,
        validationScore: 88
      },
      documentation: {
        summary: "This legacy COBOL program processes customer records in batch mode, reading from flat files and generating reports. The modernization approach converts it to a REST API-based microservice architecture with proper database normalization.",
        technicalDetails: "The original system used fixed-length record formats with COBOL data structures. The modernized version uses relational database tables with proper normalization, RESTful APIs for data access, and microservices for scalability.",
        migrationPlan: "Phase 1: Database setup and data migration (2-3 weeks). Phase 2: API development and testing (4-6 weeks). Phase 3: Integration and deployment (2-3 weeks).",
        risks: [
          "Data loss during migration",
          "Performance impact during transition",
          "Learning curve for development team",
          "Integration challenges with existing systems"
        ]
      },
      confidence: 0.85
    };

    setModernizationResults(sampleResults);
  };

  return (
    <>
      <style jsx>{`
        .modernization-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #374151 50%, #1e293b 75%, #0f172a 100%);
          position: relative;
          overflow-x: hidden;
        }

        .modernization-container-full {
          position: fixed;
          inset: 0;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #374151 50%, #1e293b 75%, #0f172a 100%);
          overflow: hidden;
          z-index: 9999;
        }

        .bg-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background:
            radial-gradient(ellipse at top left, rgba(59, 130, 246, 0.1), transparent 50%),
            radial-gradient(ellipse at bottom right, rgba(139, 92, 246, 0.08), transparent 50%),
            radial-gradient(ellipse at center, rgba(59, 130, 246, 0.05), transparent 70%);
          pointer-events: none;
          z-index: 1;
        }

        .content-wrapper {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .glass-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 1.5rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .glass-card-light {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(59, 130, 246, 0.15);
          border-radius: 1rem;
        }

        .gradient-text {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: #fff;
          border: none;
          font-weight: 700;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(59, 130, 246, 0.4);
        }

        .btn-primary:disabled {
          background: #64748b;
          color: #94a3b8;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .btn-secondary {
          background: transparent;
          color: #e2e8f0;
          border: 2px solid rgba(59, 130, 246, 0.4);
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.6);
          color: #fff;
        }

        .floating {
          animation: floating 3s ease-in-out infinite;
        }

        @keyframes floating {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .rotate {
          animation: rotate 2s linear infinite;
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .pulse {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .section-spacing {
          margin-bottom: 4rem;
        }

        .center-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          width: 100%;
        }

        @media (max-width: 768px) {
          .content-wrapper {
            padding: 0 0.5rem;
          }

          .section-spacing {
            margin-bottom: 2rem;
          }
        }
      `}</style>

      <div className="modernization-container">
        <div className="bg-overlay"></div>

        <div className="content-wrapper">
          {/* Header Section */}
          <motion.header
            className="center-container section-spacing"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            style={{ paddingTop: '3rem', paddingBottom: '2rem' }}
          >
            <motion.div
              className="glass-card-light"
              style={{
                padding: '2rem',
                width: '100%',
                maxWidth: '800px'
              }}
              variants={scaleIn}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <motion.div
                  className="floating"
                  style={{
                    width: '60px',
                    height: '60px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    borderRadius: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem'
                  }}
                >
                  🚀
                </motion.div>
                <div style={{ textAlign: 'left' }}>
                  <motion.h1
                    className="gradient-text"
                    variants={slideIn}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    style={{
                      fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
                      fontWeight: 900,
                      marginBottom: '0.25rem',
                      lineHeight: 1.2
                    }}
                  >
                    AI Modernization Assistant
                  </motion.h1>
                  <motion.p
                    style={{
                      fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                      color: '#94a3b8',
                      margin: 0
                    }}
                    variants={fadeInUp}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    Transform legacy COBOL systems into modern microservices
                  </motion.p>
                </div>
              </div>

              <motion.div
                style={{
                  width: '100px',
                  height: '4px',
                  background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                  borderRadius: '2px',
                  margin: '1.5rem auto'
                }}
                initial={{ width: 0 }}
                animate={{ width: 100 }}
                transition={{ delay: 0.6, duration: 1 }}
              />

              <div style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <motion.button
                  onClick={loadSampleData}
                  className="btn-primary"
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.75rem',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: 0.8 }}
                >
                  <span className="pulse">✨</span>
                  Load Sample Data
                </motion.button>

                {currentFile && (
                  <motion.div
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      borderRadius: '0.75rem',
                      color: '#4ade80',
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    {Array.isArray(currentFile)
                      ? `📁 ${currentFile.length} files: ${currentFile.map(f => f.name).join(', ')}`
                      : `📄 Current: ${currentFile.name}`}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.header>

          {/* Feature Highlights */}
          <motion.section
            className="section-spacing"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="glass-card" style={{ padding: '3rem' }}>
              <div className="center-container" style={{ marginBottom: '2rem' }}>
                <motion.h2
                  className="gradient-text"
                  variants={scaleIn}
                  style={{
                    fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                    fontWeight: 800,
                    marginBottom: '1rem'
                  }}
                >
                  🎯 Key Features
                </motion.h2>
                <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '600px' }}>
                  Comprehensive modernization platform with AI-powered analysis and transformation
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem'
              }}>
                {[
                  {
                    icon: '🗄️',
                    title: 'Database Schema',
                    description: 'Auto-generated modern database structures',
                    color: '#3b82f6',
                    delay: 0
                  },
                  {
                    icon: '🔗',
                    title: 'REST API Design',
                    description: 'Complete API architecture with endpoints',
                    color: '#8b5cf6',
                    delay: 0.1
                  },
                  {
                    icon: '🏗️',
                    title: 'Microservices',
                    description: 'Scalable microservices architecture',
                    color: '#06b6d4',
                    delay: 0.2
                  },
                  {
                    icon: '📊',
                    title: 'Analytics',
                    description: 'Detailed insights and metrics',
                    color: '#10b981',
                    delay: 0.3
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    className="glass-card-light"
                    style={{
                      padding: '2rem',
                      border: `2px solid ${feature.color}40`,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + feature.delay }}
                    whileHover={{
                      scale: 1.03,
                      y: -5,
                      boxShadow: `0 10px 30px ${feature.color}40`
                    }}
                  >
                    <motion.div
                      style={{
                        position: 'absolute',
                        top: '-50%',
                        right: '-50%',
                        width: '100px',
                        height: '100px',
                        background: `radial-gradient(circle, ${feature.color}20, transparent)`,
                        borderRadius: '50%'
                      }}
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />

                    <div className="center-container">
                      <motion.div
                        style={{
                          fontSize: '3rem',
                          marginBottom: '1rem',
                          filter: `drop-shadow(0 0 10px ${feature.color}80)`
                        }}
                        whileHover={{
                          rotate: [0, -10, 10, 0],
                          scale: 1.2
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        {feature.icon}
                      </motion.div>
                      <h3 style={{
                        color: feature.color,
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        marginBottom: '0.5rem'
                      }}>
                        {feature.title}
                      </h3>
                      <p style={{
                        color: '#94a3b8',
                        fontSize: '0.9rem',
                        margin: 0,
                        lineHeight: 1.5
                      }}>
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Processing Status */}
          <AnimatePresence>
            {isProcessing && (
              <motion.section
                className="section-spacing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="glass-card" style={{ padding: '3rem' }}>
                  <div className="center-container">
                    <motion.div
                      className="rotate"
                      style={{
                        width: '60px',
                        height: '60px',
                        border: '4px solid rgba(59, 130, 246, 0.3)',
                        borderTop: '4px solid #3b82f6',
                        borderRadius: '50%',
                        marginBottom: '1.5rem'
                      }}
                    />
                    <h3 style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#3b82f6',
                      marginBottom: '0.5rem'
                    }}>
                      🔄 Processing Your Files
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
                      AI is analyzing and transforming your legacy systems...
                    </p>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Main Dashboard - Full Page */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1000
            }}
          >
            <ModernizationDashboard
              modernizationResults={modernizationResults}
              onFileUpload={handleFileUpload}
              onProcessFile={handleProcessResults}
              isProcessing={isProcessing}
              processingStatus={processingStatus}
            />
          </motion.section>

          {/* Footer Info */}
          <motion.section
            style={{ paddingBottom: '3rem' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            <div className="glass-card-light" style={{ padding: '2rem' }}>
              <div className="center-container">
                <p style={{
                  color: '#64748b',
                  fontSize: '0.875rem',
                  fontStyle: 'italic',
                  margin: 0
                }}>
                  🚀 Powered by AI • Transforming Legacy Systems into Modern Architecture
                </p>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </>
  );
};

export default ModernizationApp;
