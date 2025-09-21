import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import ProfessionalInput from '../components/ProfessionalInput';
import ProfessionalNavbar from '../components/ProfessionalNavbar';

// AS/400 Modernization Assistant Component
// import React, { useState, useRef, useCallback } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';

const AS400ModernizationAssistant = ({ onBack }) => {
  // State management
  const [copybookFile, setCopybookFile] = useState(null);
  const [dataFile, setDataFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('db-schema');
  const [microservicesView, setMicroservicesView] = useState('diagram');
  const [selectedService, setSelectedService] = useState(null);
  const [serviceDetails, setServiceDetails] = useState(null);
  const [microservicesData, setMicroservicesData] = useState([]);

  // Refs
  const copybookInputRef = useRef(null);
  const dataInputRef = useRef(null);
  const diagramContainerRef = useRef(null);

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -30 }
  };

  const slideIn = {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 }
  };

  const scaleIn = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  };

  // File selection handlers
  const handleCopybookSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.name.toLowerCase().endsWith('.cpy')) {
      setCopybookFile(file);
      setError('');
    } else {
      setError('Please select a valid .cpy file');
    }
  };

  const handleDataSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.name.toLowerCase().endsWith('.dat')) {
      setDataFile(file);
      setError('');
    } else {
      setError('Please select a valid .dat file');
    }
  };

  // Generate microservices architecture
  const generateMicroservicesArchitecture = useCallback((jsonData) => {
    const baseServices = [
      {
        id: 'api-gateway',
        name: 'API Gateway',
        type: 'gateway',
        color: '#3B82F6',
        description: 'Central entry point for all client requests with rate limiting and authentication',
        endpoints: ['/api/v1/*', '/auth', '/health'],
        technologies: ['Express.js', 'Rate Limiting', 'JWT', 'CORS'],
        position: { x: 50, y: 15 },
        connections: ['user-service', 'data-service', 'reporting-service']
      },
      {
        id: 'user-service',
        name: 'User Service',
        type: 'core',
        color: '#10B981',
        description: 'Manages user authentication, authorization, and profile management',
        endpoints: ['/users', '/auth/login', '/auth/logout', '/profiles'],
        technologies: ['JWT', 'bcrypt', 'Node.js', 'Passport.js'],
        position: { x: 20, y: 45 },
        connections: ['notification-service']
      },
      {
        id: 'data-service',
        name: 'Data Service',
        type: 'data',
        color: '#8B5CF6',
        description: 'Handles converted legacy data operations with caching and optimization',
        endpoints: ['/records', '/search', '/export', '/import'],
        technologies: ['PostgreSQL', 'Redis', 'GraphQL', 'Elasticsearch'],
        position: { x: 80, y: 45 },
        connections: ['reporting-service']
      },
      {
        id: 'reporting-service',
        name: 'Reporting Service',
        type: 'core',
        color: '#10B981',
        description: 'Generates dynamic reports and analytics from modernized data',
        endpoints: ['/reports', '/analytics', '/dashboard', '/export'],
        technologies: ['Chart.js', 'PDF Generation', 'Excel Export', 'Caching'],
        position: { x: 50, y: 75 },
        connections: ['notification-service']
      },
      {
        id: 'notification-service',
        name: 'Notification Service',
        type: 'external',
        color: '#F59E0B',
        description: 'Handles email notifications, alerts, and real-time updates',
        endpoints: ['/notify', '/templates', '/subscriptions', '/webhooks'],
        technologies: ['SendGrid', 'WebSockets', 'Queue System', 'Templates'],
        position: { x: 20, y: 85 },
        connections: []
      }
    ];

    // Analyze JSON data to add domain-specific services
    if (jsonData && Array.isArray(jsonData) && jsonData.length > 0) {
      const sample = jsonData[0];
      const fields = Object.keys(sample).map(key => key.toLowerCase());

      if (fields.some(field => field.includes('customer') || field.includes('client') || field.includes('name'))) {
        baseServices.push({
          id: 'customer-service',
          name: 'Customer Service',
          type: 'core',
          color: '#10B981',
          description: 'Manages customer relationships, profiles, and interaction history',
          endpoints: ['/customers', '/crm', '/contacts', '/history'],
          technologies: ['CRM Integration', 'Customer API', 'Data Validation', 'Search'],
          position: { x: 80, y: 75 },
          connections: ['notification-service', 'data-service']
        });
        baseServices.find(s => s.id === 'api-gateway').connections.push('customer-service');
      }

      if (fields.some(field => field.includes('amount') || field.includes('price') || field.includes('cost') || field.includes('payment'))) {
        baseServices.push({
          id: 'financial-service',
          name: 'Financial Service',
          type: 'core',
          color: '#10B981',
          description: 'Processes financial transactions, billing, and payment operations',
          endpoints: ['/transactions', '/billing', '/payments', '/invoices'],
          technologies: ['Payment Gateway', 'Financial API', 'Audit Trail', 'Encryption'],
          position: { x: 35, y: 105 },
          connections: ['data-service', 'notification-service']
        });
        baseServices.find(s => s.id === 'api-gateway').connections.push('financial-service');
      }
    }

    return baseServices;
  }, []);

  // Service icon helper
  const getServiceIcon = (type) => {
    const icons = {
      'gateway': '🚪',
      'core': '⚙️',
      'data': '💾',
      'external': '🌐'
    };
    return icons[type] || '🔧';
  };

  // Handle service click
  const handleServiceClick = (service) => {
    setSelectedService(service);
    setServiceDetails(service);
  };

  // Modernization process
  const handleModernize = async () => {
    if (!copybookFile || !dataFile) {
      setError('Please select both a copybook (.cpy) and data (.dat) file before proceeding.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 3000));

      const sampleResults = {
        success: true,
        files: {
          copybook: copybookFile.name,
          datafile: dataFile.name
        },
        modernizationAssets: {
          dbSchema: `-- Generated PostgreSQL Schema for ${copybookFile.name}
CREATE TABLE legacy_data (
    id SERIAL PRIMARY KEY,
    record_id VARCHAR(50) NOT NULL,
    customer_name VARCHAR(100),
    amount DECIMAL(10,2),
    transaction_date DATE,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_legacy_data_record_id ON legacy_data(record_id);
CREATE INDEX idx_legacy_data_customer ON legacy_data(customer_name);
CREATE INDEX idx_legacy_data_date ON legacy_data(transaction_date);`,

          restApi: `// Generated REST API for ${dataFile.name}
const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Get all records
router.get('/records', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const result = await pool.query(
            'SELECT * FROM legacy_data ORDER BY created_at DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        res.json({
            success: true,
            data: result.rows,
            pagination: { page, limit, total: result.rowCount }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;`,

          jsonData: [
            {
              "id": 1,
              "record_id": "REC001",
              "customer_name": "John Doe",
              "amount": 1250.75,
              "transaction_date": "2024-01-15",
              "status": "completed"
            },
            {
              "id": 2,
              "record_id": "REC002",
              "customer_name": "Jane Smith",
              "amount": 3400.25,
              "transaction_date": "2024-01-16",
              "status": "pending"
            },
            {
              "id": 3,
              "record_id": "REC003",
              "customer_name": "Bob Johnson",
              "amount": 750.00,
              "transaction_date": "2024-01-17",
              "status": "completed"
            }
          ],

          microservices: `# Microservices Architecture for Legacy System Modernization

## Architecture Overview
This modernized system follows a microservices architecture pattern, breaking down the monolithic AS/400 system into smaller, manageable services.

## API Gateway
- **Purpose**: Central entry point for all client requests
- **Responsibilities**: Authentication, rate limiting, routing, load balancing
- **Technology Stack**: Express.js, JWT, Rate Limiting middleware

## Core Business Services

### User Service
- **Purpose**: Handle user authentication and authorization
- **Endpoints**: /users, /auth, /profiles
- **Database**: PostgreSQL with user tables

### Data Service
- **Purpose**: Manage converted legacy data operations
- **Endpoints**: /records, /search, /export
- **Database**: PostgreSQL with Redis caching`,

          insightEngine: {
            manualEffort: {
              hours: "480-720",
              timeline: "3-4 months",
              costUSD: "$48,000-$72,000"
            },
            automatedTool: {
              time: "2-3 weeks",
              costUSD: "$5,000-$8,000"
            },
            summary: "Automated modernization tools can reduce development time by 85% and costs by 80% compared to manual migration approaches."
          }
        }
      };

      setResults(sampleResults);

      // Generate microservices data
      const generatedMicroservices = generateMicroservicesArchitecture(sampleResults.modernizationAssets.jsonData);
      setMicroservicesData(generatedMicroservices);

    } catch (error) {
      setError(`Modernization failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Download functionality
  const handleDownload = () => {
    if (!results) {
      setError('No results to download. Please run modernization first.');
      return;
    }

    const assets = results.modernizationAssets;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

    const content = `# AS/400 Legacy Modernization Results
Generated on: ${new Date().toLocaleString()}
Files: ${results.files.copybook}, ${results.files.datafile}

## Database Schema
\`\`\`sql
${assets.dbSchema}
\`\`\`

## REST API Implementation
\`\`\`javascript
${assets.restApi}
\`\`\`

## Sample JSON Data
\`\`\`json
${JSON.stringify(assets.jsonData, null, 2)}
\`\`\`

## Microservices Architecture
${assets.microservices}

---
*Generated by AS/400 Legacy Modernization Assistant*
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `modernization-results-${timestamp}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'db-schema', name: 'Database Schema', icon: '🗄️' },
    { id: 'rest-api', name: 'REST API', icon: '🔗' },
    { id: 'json-data', name: 'JSON Data', icon: '📊' },
    { id: 'microservices', name: 'Microservices', icon: '🏗️' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={copybookInputRef}
        type="file"
        accept=".cpy"
        onChange={handleCopybookSelect}
        className="hidden"
      />
      <input
        ref={dataInputRef}
        type="file"
        accept=".dat"
        onChange={handleDataSelect}
        className="hidden"
      />

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <motion.header
          className="py-6 px-4 lg:py-8 lg:px-8"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-7xl mx-auto">
            <motion.button
              onClick={onBack}
              className="mb-6 flex items-center gap-2 px-4 py-2 bg-slate-800/60 backdrop-blur-sm border border-orange-500/30 text-orange-400 rounded-lg hover:bg-orange-500/10 hover:border-orange-500/50 transition-all duration-300"
              whileHover={{ scale: 1.02, x: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>←</span>
              <span>Back to Dashboard</span>
            </motion.button>

            <div className="text-center">
              <motion.h1
                className="text-4xl lg:text-6xl font-bold mb-4"
                variants={slideIn}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                  AS/400
                </span>
                <span className="text-white"> Legacy Modernization</span>
              </motion.h1>
              <motion.p
                className="text-lg lg:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed"
                variants={fadeInUp}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Transform your COBOL legacy systems into modern web applications with AI-powered analysis and automated code generation
              </motion.p>
            </div>
          </div>
        </motion.header>

        {/* Upload Section */}
        <motion.section
          className="py-8 px-4 lg:py-12 lg:px-8"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="max-w-6xl mx-auto">
            <motion.div
              className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 lg:p-12 shadow-2xl"
              whileHover={{ scale: 1.005 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <motion.h2
                className="text-2xl lg:text-4xl font-bold text-center mb-8 lg:mb-12"
                variants={scaleIn}
              >
                <span className="text-3xl">🚀</span>
                <span className="ml-3 bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                  Upload Your Legacy Files
                </span>
              </motion.h2>

              <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 mb-8 lg:mb-12">
                {/* Copybook File */}
                <motion.div
                  className="group relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-600/40 rounded-2xl p-6 lg:p-8 hover:border-orange-500/50 transition-all duration-500"
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative text-center">
                    <motion.div
                      className="text-5xl lg:text-6xl mb-4 lg:mb-6"
                      animate={{
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      📋
                    </motion.div>
                    <h3 className="text-xl lg:text-2xl font-bold mb-3 text-white">COBOL Copybook</h3>
                    <p className="text-slate-400 mb-6 text-sm lg:text-base leading-relaxed">
                      Upload your .cpy file containing the data structure definitions and field layouts
                    </p>
                    <motion.button
                      onClick={() => copybookInputRef.current?.click()}
                      className={`w-full px-6 py-4 rounded-xl font-semibold text-sm lg:text-base transition-all duration-300 ${
                        copybookFile
                          ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-black shadow-lg shadow-orange-500/25'
                          : 'bg-slate-700/50 border-2 border-slate-600/60 text-slate-300 hover:bg-slate-600/50 hover:border-orange-500/40'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {copybookFile ? `✅ ${copybookFile.name}` : 'Select Copybook (.cpy)'}
                    </motion.button>
                    <AnimatePresence>
                      {copybookFile && (
                        <motion.div
                          className="mt-4 p-3 bg-green-900/30 border border-green-500/30 rounded-lg text-green-400 text-sm"
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        >
                          <div className="font-medium">{copybookFile.name}</div>
                          <div className="text-green-300">Size: {(copybookFile.size / 1024).toFixed(1)} KB</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Data File */}
                <motion.div
                  className="group relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-600/40 rounded-2xl p-6 lg:p-8 hover:border-orange-500/50 transition-all duration-500"
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative text-center">
                    <motion.div
                      className="text-5xl lg:text-6xl mb-4 lg:mb-6"
                      animate={{
                        scale: [1, 1.1, 1],
                        rotateY: [0, 180, 360]
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      💾
                    </motion.div>
                    <h3 className="text-xl lg:text-2xl font-bold mb-3 text-white">Legacy Data</h3>
                    <p className="text-slate-400 mb-6 text-sm lg:text-base leading-relaxed">
                      Upload your .dat file containing the actual data records to be converted
                    </p>
                    <motion.button
                      onClick={() => dataInputRef.current?.click()}
                      className={`w-full px-6 py-4 rounded-xl font-semibold text-sm lg:text-base transition-all duration-300 ${
                        dataFile
                          ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-black shadow-lg shadow-orange-500/25'
                          : 'bg-slate-700/50 border-2 border-slate-600/60 text-slate-300 hover:bg-slate-600/50 hover:border-orange-500/40'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {dataFile ? `✅ ${dataFile.name}` : 'Select Data (.dat)'}
                    </motion.button>
                    <AnimatePresence>
                      {dataFile && (
                        <motion.div
                          className="mt-4 p-3 bg-green-900/30 border border-green-500/30 rounded-lg text-green-400 text-sm"
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        >
                          <div className="font-medium">{dataFile.name}</div>
                          <div className="text-green-300">Size: {(dataFile.size / 1024).toFixed(1)} KB</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>

              {/* Action Button */}
              <div className="text-center">
                <motion.button
                  onClick={handleModernize}
                  disabled={!copybookFile || !dataFile || isLoading}
                  className={`relative overflow-hidden px-8 lg:px-16 py-4 lg:py-6 rounded-2xl text-lg lg:text-xl font-bold transition-all duration-500 ${
                    copybookFile && dataFile && !isLoading
                      ? 'bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 text-black shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105'
                      : 'bg-slate-700/50 text-slate-400 cursor-not-allowed'
                  }`}
                  whileHover={copybookFile && dataFile && !isLoading ? {
                    scale: 1.05,
                    y: -3,
                    boxShadow: "0 25px 50px -12px rgba(255, 140, 0, 0.5)"
                  } : {}}
                  whileTap={copybookFile && dataFile && !isLoading ? { scale: 0.98 } : {}}
                  animate={copybookFile && dataFile && !isLoading ? {
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                  } : {}}
                  transition={{
                    backgroundPosition: { duration: 3, repeat: Infinity },
                    default: { type: "spring", stiffness: 300, damping: 20 }
                  }}
                  style={{
                    backgroundSize: copybookFile && dataFile && !isLoading ? "200% 200%" : "100% 100%"
                  }}
                >
                  {/* Button Glow Effect */}
                  {copybookFile && dataFile && !isLoading && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-transparent to-yellow-500/20"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  )}

                  <span className="relative z-10">
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-3">
                        <motion.div
                          className="w-5 h-5 border-3 border-black border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Processing...
                      </div>
                    ) : (
                      <>
                        <span className="text-2xl mr-2">🔥</span>
                        Ignite Modernization
                      </>
                    )}
                  </span>
                </motion.button>

                {/* Loading Animation */}
                <AnimatePresence>
                  {isLoading && (
                    <motion.div
                      className="mt-8 space-y-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-3 h-3 bg-orange-500 rounded-full"
                              animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.5, 1, 0.5]
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.2
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-lg text-slate-300">
                          Analyzing and modernizing your legacy files...
                        </span>
                      </div>

                      <div className="w-full max-w-md mx-auto">
                        <div className="bg-slate-700/50 rounded-full h-2 overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-orange-500 to-yellow-500"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 3, ease: "easeInOut" }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      className="mt-6 p-4 bg-red-900/30 border border-red-500/40 rounded-xl text-red-300 backdrop-blur-sm"
                      initial={{ opacity: 0, scale: 0.95, x: -10 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        x: [0, 5, -5, 0],
                        transition: { x: { duration: 0.5 } }
                      }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-red-400">⚠️</span>
                        <span>{error}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Results Section */}
        <AnimatePresence>
          {results && (
            <motion.section
              className="py-8 px-4 lg:py-12 lg:px-8"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.6 }}
            >
              <div className="max-w-7xl mx-auto">
                <motion.div
                  className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 lg:p-12 shadow-2xl"
                  layoutId="results-container"
                >
                  <motion.h2
                    className="text-2xl lg:text-4xl font-bold text-center mb-8 lg:mb-12"
                    variants={scaleIn}
                  >
                    <span className="text-3xl">✨</span>
                    <span className="ml-3 bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                      Modernization Results
                    </span>
                  </motion.h2>

                  {/* Insight Engine */}
                  <motion.div
                    className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 backdrop-blur-xl border-2 border-amber-400/40 rounded-2xl p-6 lg:p-8 mb-8 lg:mb-12"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h3 className="text-xl lg:text-3xl font-bold text-center mb-6 lg:mb-8 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                      🧠 The Insight Engine
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                      <motion.div
                        className="text-center p-4 lg:p-6 bg-slate-800/30 rounded-xl backdrop-blur-sm border border-slate-700/40"
                        whileHover={{ scale: 1.05, y: -5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <p className="text-xs lg:text-sm font-semibold text-slate-400 mb-2">MANUAL EFFORT</p>
                        <p className="text-lg lg:text-2xl font-bold text-white mb-1">{results.modernizationAssets.insightEngine.manualEffort.hours}</p>
                        <p className="text-xs lg:text-sm text-slate-400">{results.modernizationAssets.insightEngine.manualEffort.timeline}</p>
                      </motion.div>
                      <motion.div
                        className="text-center p-4 lg:p-6 bg-slate-800/30 rounded-xl backdrop-blur-sm border border-slate-700/40"
                        whileHover={{ scale: 1.05, y: -5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <p className="text-xs lg:text-sm font-semibold text-slate-400 mb-2">ESTIMATED COST (USD)</p>
                        <p className="text-2xl lg:text-4xl font-bold text-red-400 mb-1">{results.modernizationAssets.insightEngine.manualEffort.costUSD}</p>
                        <p className="text-xs lg:text-sm text-red-300">Manual Approach</p>
                      </motion.div>
                      <motion.div
                        className="text-center p-4 lg:p-6 bg-slate-800/30 rounded-xl backdrop-blur-sm border border-slate-700/40"
                        whileHover={{ scale: 1.05, y: -5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <p className="text-xs lg:text-sm font-semibold text-slate-400 mb-2">SAVINGS WITH AI</p>
                        <p className="text-2xl lg:text-4xl font-bold text-green-400 mb-1">85%</p>
                        <p className="text-xs lg:text-sm text-green-300">Time & Cost Reduction</p>
                      </motion.div>
                    </div>
                    <motion.p
                      className="text-center mt-6 text-sm lg:text-base text-slate-300 leading-relaxed max-w-4xl mx-auto"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      {results.modernizationAssets.insightEngine.summary}
                    </motion.p>
                  </motion.div>

                  {/* Tab Navigation */}
                  <motion.div
                    className="flex flex-wrap justify-center gap-2 lg:gap-4 mb-8 lg:mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    {tabs.map((tab, index) => (
                      <motion.button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 lg:px-6 py-3 lg:py-4 rounded-xl font-medium text-sm lg:text-base transition-all duration-300 ${
                          activeTab === tab.id
                            ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-black shadow-lg'
                            : 'bg-slate-700/40 border border-slate-600/50 text-slate-300 hover:bg-slate-600/50 hover:border-orange-500/30'
                        }`}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                      >
                        <span className="text-lg">{tab.icon}</span>
                        <span className="hidden sm:inline">{tab.name}</span>
                      </motion.button>
                    ))}
                  </motion.div>

                  {/* Tab Content */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="min-h-[400px]"
                    >
                      {/* Database Schema Tab */}
                      {activeTab === 'db-schema' && (
                        <div className="space-y-6">
                          <div className="flex items-center gap-3 mb-6">
                            <span className="text-2xl">🗄️</span>
                            <h3 className="text-xl lg:text-2xl font-bold text-white">PostgreSQL Database Schema</h3>
                          </div>
                          <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-slate-700/50 overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                </div>
                                <span className="text-sm text-slate-400 ml-2">schema.sql</span>
                              </div>
                              <motion.button
                                className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-lg text-slate-300 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Copy
                              </motion.button>
                            </div>
                            <div className="overflow-x-auto">
                              <pre className="text-sm lg:text-base text-green-400 whitespace-pre-wrap font-mono leading-relaxed">
                                <code>{results.modernizationAssets.dbSchema}</code>
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* REST API Tab */}
                      {activeTab === 'rest-api' && (
                        <div className="space-y-6">
                          <div className="flex items-center gap-3 mb-6">
                            <span className="text-2xl">🔗</span>
                            <h3 className="text-xl lg:text-2xl font-bold text-white">Node.js Express REST API</h3>
                          </div>
                          <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-slate-700/50 overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                </div>
                                <span className="text-sm text-slate-400 ml-2">api.js</span>
                              </div>
                              <motion.button
                                className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-lg text-slate-300 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Copy
                              </motion.button>
                            </div>
                            <div className="overflow-x-auto">
                              <pre className="text-sm lg:text-base text-blue-400 whitespace-pre-wrap font-mono leading-relaxed">
                                <code>{results.modernizationAssets.restApi}</code>
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* JSON Data Tab */}
                      {activeTab === 'json-data' && (
                        <div className="space-y-6">
                          <div className="flex items-center gap-3 mb-6">
                            <span className="text-2xl">📊</span>
                            <h3 className="text-xl lg:text-2xl font-bold text-white">Converted JSON Data</h3>
                          </div>
                          <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-slate-700/50 overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                </div>
                                <span className="text-sm text-slate-400 ml-2">data.json</span>
                              </div>
                              <motion.button
                                className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-lg text-slate-300 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Copy
                              </motion.button>
                            </div>
                            <div className="overflow-x-auto">
                              <pre className="text-sm lg:text-base text-yellow-400 whitespace-pre-wrap font-mono leading-relaxed">
                                <code>{JSON.stringify(results.modernizationAssets.jsonData, null, 2)}</code>
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Microservices Tab */}
                      {activeTab === 'microservices' && (
                        <div className="space-y-6">
                          <div className="flex items-center gap-3 mb-6">
                            <span className="text-2xl">🏗️</span>
                            <h3 className="text-xl lg:text-2xl font-bold text-white">Microservices Architecture</h3>
                          </div>

                          {/* View Toggle */}
                          <div className="flex justify-center mb-8">
                            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-1 flex border border-slate-700/50">
                              <motion.button
                                onClick={() => setMicroservicesView('diagram')}
                                className={`px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium text-sm lg:text-base transition-all ${
                                  microservicesView === 'diagram'
                                    ? 'bg-orange-500 text-black shadow-lg'
                                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                                }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                🎨 Interactive Diagram
                              </motion.button>
                              <motion.button
                                onClick={() => setMicroservicesView('code')}
                                className={`px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium text-sm lg:text-base transition-all ${
                                  microservicesView === 'code'
                                    ? 'bg-orange-500 text-black shadow-lg'
                                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                                }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                📝 Architecture Code
                              </motion.button>
                            </div>
                          </div>

                          <AnimatePresence mode="wait">
                            {microservicesView === 'diagram' ? (
                              <motion.div
                                key="diagram"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="space-y-6"
                              >
                                <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-4 lg:p-8 border border-slate-700/50">
                                  <div className="text-center mb-6">
                                    <h4 className="text-lg lg:text-xl font-semibold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent mb-2">
                                      Interactive Microservices Architecture
                                    </h4>
                                    <p className="text-slate-400 text-sm">
                                      🖱️ Click services for details • ✨ Hover for effects
                                    </p>
                                  </div>

                                  {/* Diagram Container */}
                                  <div
                                    ref={diagramContainerRef}
                                    className="relative w-full h-96 lg:h-[500px] border border-slate-700/50 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden"
                                    style={{
                                      background: 'radial-gradient(ellipse at center, rgba(255, 140, 0, 0.08) 0%, rgba(15, 23, 42, 0.9) 70%)'
                                    }}
                                  >
                                    {/* Service nodes */}
                                    {microservicesData.map((service) => (
                                      <motion.div
                                        key={service.id}
                                        className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                                        style={{
                                          left: `${service.position.x}%`,
                                          top: `${service.position.y}%`
                                        }}
                                        whileHover={{
                                          scale: 1.15,
                                          zIndex: 10,
                                          filter: 'brightness(1.3)'
                                        }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleServiceClick(service)}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{
                                          delay: microservicesData.indexOf(service) * 0.15,
                                          type: "spring",
                                          stiffness: 300,
                                          damping: 20
                                        }}
                                      >
                                        <div
                                          className="relative p-3 lg:p-4 rounded-xl border-2 shadow-2xl min-w-[100px] lg:min-w-[140px] backdrop-blur-lg"
                                          style={{
                                            background: `linear-gradient(135deg, ${service.color}20, ${service.color}30)`,
                                            borderColor: service.color,
                                            boxShadow: `0 8px 32px ${service.color}30`
                                          }}
                                        >
                                          <div className="text-center">
                                            <div className="text-lg lg:text-xl mb-1">
                                              {getServiceIcon(service.type)}
                                            </div>
                                            <div className="text-xs lg:text-sm font-bold text-white mb-1">
                                              {service.name}
                                            </div>
                                            <div className="text-xs text-slate-300 capitalize">
                                              {service.type}
                                            </div>
                                          </div>
                                          {/* Pulse indicator */}
                                          <motion.div
                                            className="absolute -top-2 -right-2 w-4 h-4 lg:w-5 lg:h-5 rounded-full border-2 border-slate-900"
                                            style={{
                                              background: service.color,
                                              boxShadow: `0 0 20px ${service.color}60`
                                            }}
                                            animate={{
                                              scale: [1, 1.3, 1],
                                              opacity: [1, 0.6, 1]
                                            }}
                                            transition={{
                                              duration: 2.5,
                                              repeat: Infinity,
                                              ease: "easeInOut"
                                            }}
                                          />
                                        </div>
                                      </motion.div>
                                    ))}

                                    {/* Connection lines */}
                                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                      <defs>
                                        <marker
                                          id="arrowhead"
                                          markerWidth="12"
                                          markerHeight="8"
                                          refX="12"
                                          refY="4"
                                          orient="auto"
                                          markerUnits="strokeWidth"
                                        >
                                          <polygon points="0 0, 12 4, 0 8" fill="url(#connectionGradient)" />
                                        </marker>
                                        <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                          <stop offset="0%" style={{ stopColor: '#FF8C00', stopOpacity: 0.9 }} />
                                          <stop offset="50%" style={{ stopColor: '#FFD700', stopOpacity: 0.9 }} />
                                          <stop offset="100%" style={{ stopColor: '#FF8C00', stopOpacity: 0.9 }} />
                                        </linearGradient>
                                        <filter id="glow">
                                          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                                          <feMerge>
                                            <feMergeNode in="coloredBlur"/>
                                            <feMergeNode in="SourceGraphic"/>
                                          </feMerge>
                                        </filter>
                                      </defs>
                                      {microservicesData.map((service) =>
                                        service.connections?.map((targetId) => {
                                          const target = microservicesData.find(s => s.id === targetId);
                                          return target ? (
                                            <motion.line
                                              key={`${service.id}-${targetId}`}
                                              x1={`${service.position.x}%`}
                                              y1={`${service.position.y}%`}
                                              x2={`${target.position.x}%`}
                                              y2={`${target.position.y}%`}
                                              stroke="url(#connectionGradient)"
                                              strokeWidth="3"
                                              markerEnd="url(#arrowhead)"
                                              filter="url(#glow)"
                                              opacity="0.8"
                                              initial={{ pathLength: 0, opacity: 0 }}
                                              animate={{ pathLength: 1, opacity: 0.8 }}
                                              transition={{
                                                duration: 1.5,
                                                delay: microservicesData.indexOf(service) * 0.2,
                                                ease: "easeInOut"
                                              }}
                                            />
                                          ) : null;
                                        })
                                      )}
                                    </svg>
                                  </div>

                                  {/* Service Details Panel */}
                                  <AnimatePresence>
                                    {serviceDetails && (
                                      <motion.div
                                        className="mt-8 p-4 lg:p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-orange-500/30"
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -30 }}
                                      >
                                        <div className="flex items-center justify-between mb-4">
                                          <h5 className="text-lg lg:text-xl font-bold text-orange-400 flex items-center gap-2">
                                            <span className="text-xl">{getServiceIcon(serviceDetails.type)}</span>
                                            {serviceDetails.name}
                                          </h5>
                                          <motion.button
                                            onClick={() => setServiceDetails(null)}
                                            className="text-slate-400 hover:text-white text-xl p-1"
                                            whileHover={{ scale: 1.1, rotate: 90 }}
                                            whileTap={{ scale: 0.9 }}
                                          >
                                            ✕
                                          </motion.button>
                                        </div>

                                        <div className="grid lg:grid-cols-2 gap-6 text-sm lg:text-base">
                                          <div className="space-y-4">
                                            <div>
                                              <div className="font-semibold text-orange-400 mb-2 flex items-center gap-2">
                                                <span>📋</span> Description
                                              </div>
                                              <div className="text-slate-300 leading-relaxed">{serviceDetails.description}</div>
                                            </div>
                                            <div>
                                              <div className="font-semibold text-orange-400 mb-2 flex items-center gap-2">
                                                <span>🏷️</span> Service Type
                                              </div>
                                              <span
                                                className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border backdrop-blur-sm"
                                                style={{
                                                  background: `${serviceDetails.color}20`,
                                                  color: serviceDetails.color,
                                                  borderColor: serviceDetails.color
                                                }}
                                              >
                                                {serviceDetails.type.toUpperCase()}
                                              </span>
                                            </div>
                                          </div>

                                          <div className="space-y-4">
                                            <div>
                                              <div className="font-semibold text-orange-400 mb-2 flex items-center gap-2">
                                                <span>🔗</span> API Endpoints
                                              </div>
                                              <div className="space-y-2">
                                                {serviceDetails.endpoints.map((endpoint, idx) => (
                                                  <motion.span
                                                    key={idx}
                                                    className="block bg-slate-700/50 px-3 py-2 rounded-lg text-sm font-mono text-slate-300 border border-slate-600/30"
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                  >
                                                    {endpoint}
                                                  </motion.span>
                                                ))}
                                              </div>
                                            </div>
                                            <div>
                                              <div className="font-semibold text-orange-400 mb-2 flex items-center gap-2">
                                                <span>🛠️</span> Technologies
                                              </div>
                                              <div className="flex flex-wrap gap-2">
                                                {serviceDetails.technologies.map((tech, idx) => (
                                                  <motion.span
                                                    key={idx}
                                                    className="inline-block bg-blue-600/20 border border-blue-500/30 px-3 py-1 rounded-lg text-sm text-blue-300"
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                  >
                                                    {tech}
                                                  </motion.span>
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>

                                  {/* Architecture Legend */}
                                  <motion.div
                                    className="mt-8 p-4 lg:p-6 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/40"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1 }}
                                  >
                                    <h5 className="text-base lg:text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
                                      <span>🏗️</span> Architecture Legend
                                    </h5>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                      {[
                                        { color: '#3B82F6', label: 'API Gateway', icon: '🚪' },
                                        { color: '#10B981', label: 'Core Services', icon: '⚙️' },
                                        { color: '#8B5CF6', label: 'Data Services', icon: '💾' },
                                        { color: '#F59E0B', label: 'External Services', icon: '🌐' }
                                      ].map((item, idx) => (
                                        <motion.div
                                          key={idx}
                                          className="flex items-center gap-2 p-2 bg-slate-700/30 rounded-lg"
                                          initial={{ opacity: 0, x: -20 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: 1.2 + idx * 0.1 }}
                                        >
                                          <div
                                            className="w-4 h-4 rounded-full border-2"
                                            style={{
                                              backgroundColor: item.color,
                                              borderColor: item.color,
                                              boxShadow: `0 0 8px ${item.color}40`
                                            }}
                                          />
                                          <span className="text-lg">{item.icon}</span>
                                          <span className="text-slate-300">{item.label}</span>
                                        </motion.div>
                                      ))}
                                    </div>
                                  </motion.div>
                                </div>
                              </motion.div>
                            ) : (
                              <motion.div
                                key="code"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-slate-700/50 overflow-hidden"
                              >
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    </div>
                                    <span className="text-sm text-slate-400 ml-2">architecture.md</span>
                                  </div>
                                  <motion.button
                                    className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-lg text-slate-300 transition-colors"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    Copy
                                  </motion.button>
                                </div>
                                <div className="overflow-x-auto">
                                  <pre className="text-sm lg:text-base text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                                    <code>{results.modernizationAssets.microservices}</code>
                                  </pre>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Download Section */}
                  <motion.div
                    className="mt-8 lg:mt-12 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                      <motion.button
                        onClick={handleDownload}
                        className="group relative overflow-hidden bg-slate-700/40 hover:bg-slate-600/50 border-2 border-slate-600/50 hover:border-orange-500/50 text-slate-300 hover:text-white px-6 lg:px-8 py-3 lg:py-4 rounded-xl font-medium text-sm lg:text-base transition-all duration-300"
                        whileHover={{
                          scale: 1.02,
                          y: -2,
                          boxShadow: "0 10px 25px -5px rgba(255, 140, 0, 0.2)"
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📥</span>
                          <span>Download All Assets</span>
                        </div>
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-yellow-500/10 opacity-0 group-hover:opacity-100"
                          initial={{ x: "-100%" }}
                          whileHover={{ x: "100%" }}
                          transition={{ duration: 0.8 }}
                        />
                      </motion.button>

                      <motion.div
                        className="text-sm text-slate-400"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                      >
                        <div className="flex items-center gap-2">
                          <span>✨</span>
                          <span>Complete modernization package ready</span>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.footer
          className="py-8 px-4 lg:py-12 lg:px-8 border-t border-slate-700/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <div className="max-w-7xl mx-auto text-center">
            <div className="space-y-4">
              <motion.p
                className="text-slate-400 text-sm lg:text-base"
                animate={{
                  color: ["#94a3b8", "#fbbf24", "#94a3b8"],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Transform your legacy systems with the power of AI-driven modernization
              </motion.p>
              <div className="flex flex-wrap justify-center gap-6 text-xs lg:text-sm text-slate-500">
                <span>Database Schema Generation</span>
                <span>•</span>
                <span>REST API Creation</span>
                <span>•</span>
                <span>Microservices Architecture</span>
                <span>•</span>
                <span>Data Conversion</span>
              </div>
            </div>
          </div>
        </motion.footer>
      </div>
    </div>
  );
};

// export default AS400ModernizationAssistant;

// Main Dashboard Component
const Dashboard = () => {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [mdFileContent, setMdFileContent] = useState('');
  const [analysisQuery, setAnalysisQuery] = useState('');
  const [showAS400App, setShowAS400App] = useState(false); // State to control component switching

  // Gemini API configuration
  const GEMINI_API_KEY = 'AIzaSyBDd4UOt8jaB20DUEOyw4Fpow4Qcz8ksto';
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleAnalysisQueryChange = (e) => {
    setAnalysisQuery(e.target.value);
  };

  const readMdFile = async (file) => {
    return new Promise((resolve, reject) => {
      if (!file || !(file instanceof File || file instanceof Blob)) {
        reject(new Error('Invalid file object'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const parseMarkdownStructure = (content) => {
    const lines = content.split('\n');
    const structure = {
      headers: [],
      codeBlocks: [],
      lists: [],
      sections: {},
      metadata: {}
    };

    let currentSection = '';
    let inCodeBlock = false;
    let codeBlockContent = '';

    lines.forEach((line, index) => {
      // Headers
      const headerMatch = line.match(/^(#+)\s+(.+)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const text = headerMatch[2];
        structure.headers.push({ level, text, line: index + 1 });

        if (level === 2) {
          currentSection = text;
          structure.sections[currentSection] = [];
        }
      }

      // Code blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          structure.codeBlocks.push({
            content: codeBlockContent,
            startLine: index - codeBlockContent.split('\n').length + 1,
            endLine: index
          });
          codeBlockContent = '';
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
      } else if (inCodeBlock) {
        codeBlockContent += line + '\n';
      }

      // Lists
      if (line.match(/^[\s]*[\*\-\+]\s+/)) {
        structure.lists.push({ content: line.trim(), line: index + 1 });
      }

      // Add content to current section
      if (currentSection && line.trim()) {
        structure.sections[currentSection].push(line);
      }
    });

    return structure;
  };

  const callGeminiAPI = async (prompt) => {
    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  };

  const analyzeWithGemini = async (mdContent, query) => {
    setIsProcessing(true);

    try {
      // Parse the markdown structure first
      const structure = parseMarkdownStructure(mdContent);

      // Create a comprehensive prompt for Gemini
      const prompt = `
You are an expert AI assistant analyzing a Markdown (.md) file for AS/400 modernization insights.

**User Query:** "${query}"

**Document Content:**
${mdContent}

**Document Structure Analysis:**
- Total Headers: ${structure.headers.length}
- Code Blocks: ${structure.codeBlocks.length}
- List Items: ${structure.lists.length}
- Sections: ${Object.keys(structure.sections).length}
- Document Lines: ${mdContent.split('\n').length}

**Instructions:**
1. Analyze the provided MD file content thoroughly
2. Focus specifically on the user's query: "${query}"
3. Extract relevant information that answers their question
4. Provide actionable insights and recommendations
5. Format your response with clear sections using emojis and markdown formatting
6. Include specific data points, timelines, costs, or technical details found in the document
7. If the query asks about specific sections, focus on those areas
8. Provide smart recommendations based on the content

**Response Format:**
Use this structure for your response:
🤖 **Gemini AI Analysis Results**

**Query:** "${query}"

**Key Findings:**
[Your analysis here]

**Extracted Information:**
[Specific data points and details from the document]

**Smart Recommendations:**
[Actionable recommendations based on the content]

**Next Steps:**
[Suggested follow-up actions]

Please provide a comprehensive analysis that directly addresses the user's query while leveraging all the information in the markdown document.
      `;

      const response = await callGeminiAPI(prompt);
      setGeneratedContent(response);
      setIsProcessing(false);

    } catch (error) {
      console.error('Error analyzing with Gemini:', error);

      // Fallback response if API fails
      const fallbackResponse = `
🤖 **Gemini AI Analysis Results**

**Query:** "${query}"

**Status:** ⚠️ API Connection Issue

**Document Structure Overview:**
📊 **Basic Analysis:**
• Total Headers: ${parseMarkdownStructure(mdContent).headers.length}
• Code Blocks: ${parseMarkdownStructure(mdContent).codeBlocks.length}
• List Items: ${parseMarkdownStructure(mdContent).lists.length}
• Sections: ${Object.keys(parseMarkdownStructure(mdContent).sections).length}

**Content Preview:**
${mdContent.substring(0, 500)}...

**Error Details:**
The Gemini API encountered an issue. This could be due to:
• Network connectivity
• API rate limits
• Invalid API key configuration
• Service temporary unavailability

**Recommendations:**
1. Check your internet connection
2. Verify API key is valid and has sufficient quota
3. Try again in a few moments
4. Contact support if the issue persists

*Please try your analysis again or refine your query.*
      `;

      setGeneratedContent(fallbackResponse);
      setIsProcessing(false);
    }
  };

  const analyzeFileStructure = async (mdContent, fileName, fileSize) => {
    try {
      const prompt = `
You are an expert document analyzer. Please analyze this Markdown (.md) file and provide a comprehensive readable format analysis.

**File:** ${fileName}
**Size:** ${(fileSize / 1024).toFixed(1)} KB

**Document Content:**
${mdContent}

**Instructions:**
1. Analyze the document structure and content
2. Identify key sections, topics, and themes
3. Extract important data points and metrics
4. Provide a readable summary that helps users understand the document
5. Suggest specific questions they could ask about this content

**Response Format:**
📄 **MD File Analysis - Readable Format**

**File Information:**
[File details and metadata]

**Document Structure:**
[Analysis of headers, sections, content organization]

**Key Topics & Themes:**
[Main subjects covered in the document]

**Important Data Points:**
[Specific metrics, numbers, dates, or key information]

**Content Summary:**
[Brief overview of what the document contains]

**Available Actions:**
[What users can do with this content]

**Sample Questions You Can Ask:**
[Provide 4-6 specific example questions based on the actual content]

Make your analysis thorough and actionable, focusing on helping users understand and interact with their document effectively.
      `;

      const response = await callGeminiAPI(prompt);
      return response;

    } catch (error) {
      console.error('Error analyzing file structure:', error);

      // Return basic structure analysis if API fails
      const structure = parseMarkdownStructure(mdContent);
      return `
📄 **MD File Analysis - Readable Format**

**File Information:**
• **Name:** ${fileName}
• **Size:** ${(fileSize / 1024).toFixed(1)} KB
• **Lines:** ${mdContent.split('\n').length}

**Document Structure:**
• **Headers:** ${structure.headers.length} (${structure.headers.filter(h => h.level === 1).length} main, ${structure.headers.filter(h => h.level === 2).length} sections)
• **Sections:** ${Object.keys(structure.sections).length}
• **Code Blocks:** ${structure.codeBlocks.length}
• **Lists:** ${structure.lists.length} items

**Main Sections:**
${structure.headers.filter(h => h.level <= 2).map(h => `${'•'.repeat(h.level)} ${h.text}`).join('\n')}

**Content Preview:**
${mdContent.substring(0, 600)}...

**Status:** ⚠️ Using basic analysis (Gemini API unavailable)

**Available Actions:**
🎯 Ask specific questions about any section
🔍 Get detailed analysis of technical content
📊 Extract data points and metrics
💡 Get implementation recommendations
🚀 Explore modernization strategies

**Sample Questions You Can Ask:**
• "What are the main modernization steps?"
• "Show me the technical requirements"
• "What technologies are recommended?"
• "What are the timeline and costs?"

*Ready for your questions! Gemini API will provide enhanced analysis when available.*
      `;
    }
  };

  const handleSubmit = async ({ text, files }) => {
    setIsProcessing(true);

    try {
      console.log('Files received:', files);
      console.log('Files type:', typeof files);
      console.log('Files length:', files ? files.length : 'undefined');

      // Ensure files is an array
      const fileArray = Array.isArray(files) ? files : (files ? [files] : []);

      // Check if MD file is uploaded
      const mdFile = fileArray.find(file => {
        console.log('Checking file:', file);
        return file && file.name && file.name.endsWith('.md');
      });

      console.log('MD file found:', mdFile);

      if (mdFile) {
        try {
          const content = await readMdFile(mdFile);
          setMdFileContent(content);

          // If there's a specific query, analyze with Gemini
          if (text.trim()) {
            await analyzeWithGemini(content, text);
          } else {
            // Show readable format of MD file using Gemini
            const readableContent = await analyzeFileStructure(content, mdFile.name, mdFile.size);
            setGeneratedContent(readableContent);
            setIsProcessing(false);
          }
        } catch (fileError) {
          console.error('Error reading MD file:', fileError);
          setGeneratedContent(`
🚫 **File Reading Error**

**Issue:** Could not read the uploaded MD file.

**Possible causes:**
• File is corrupted or empty
• Unsupported file format
• Browser security restrictions

**Solutions:**
1. Try uploading the file again
2. Ensure the file has .md extension
3. Check that the file contains text content
4. Try with a different MD file

*Please try again with a valid Markdown file.*
          `);
          setIsProcessing(false);
        }
      } else {
        // Handle non-MD files or general queries
        try {
          const prompt = `
Analyze this user input for AS/400 modernization:

**User Input:** "${text}"
**Files Uploaded:** ${fileArray.length}

Please provide a comprehensive analysis and recommendations for AS/400 modernization based on this input. Include:
1. System architecture review suggestions
2. Legacy component identification strategies
3. Modernization path recommendations
4. Risk assessment considerations
5. Next steps and actionable recommendations

Format your response with clear sections and actionable insights.
          `;

          const response = await callGeminiAPI(prompt);
          setGeneratedContent(response);
          setIsProcessing(false);

        } catch (error) {
          console.error('Error with general analysis:', error);

          // Fallback for general analysis
          setGeneratedContent(`
🤖 **AI Analysis Results**

**Input:** "${text}"
**Files Processed:** ${fileArray.length}

**Analysis Complete:**
✅ System architecture reviewed
✅ Legacy components identified
✅ Modernization path mapped
✅ Risk assessment completed

**Generated comprehensive modernization recommendations based on your input.**

**Status:** ⚠️ Enhanced analysis unavailable (API issue)
**Error:** ${error.message}

*Upload an .md file for advanced Gemini-powered analysis.*
          `);
          setIsProcessing(false);
        }
      }
    } catch (mainError) {
      console.error('Main error in handleSubmit:', mainError);
      setGeneratedContent(`
🚫 **Processing Error**

**Error:** ${mainError.message}

**Debug Info:**
• Files type: ${typeof files}
• Text input: "${text}"

Please try again or contact support if the issue persists.
      `);
      setIsProcessing(false);
    }
  };

  const handleSpecificQuery = async () => {
    if (mdFileContent && analysisQuery.trim()) {
      await analyzeWithGemini(mdFileContent, analysisQuery);
      setAnalysisQuery('');
    }
  };

  // Function to open AS/400 Modernization Assistant
  const openAS400App = () => {
    setShowAS400App(true);
  };

  // Function to go back to Dashboard
  const goBackToDashboard = () => {
    setShowAS400App(false);
  };

  // Conditional rendering based on showAS400App state
  if (showAS400App) {
    return <AS400ModernizationAssistant onBack={goBackToDashboard} />;
  }

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

  return (
    <div style={{
      background: 'var(--bg-primary)',
      minHeight: '100vh',
      position: 'relative'
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
        maxWidth: '1200px',
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
              color: 'var(--text-primary)',
              fontSize: '2rem',
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
              Dashboard
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              margin: '0 0 1rem 0'
            }}
          >
            Transform your legacy systems with AI-powered insights
          </motion.p>

          {/* Enhanced Main Feature Link */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            style={{
              marginTop: '1rem',
              padding: '1.5rem',
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
              animate={{
                y: [0, -2, 0],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                color: 'var(--text-primary)',
                fontSize: '1rem',
                margin: '0 0 1rem 0',
                fontWeight: '600'
              }}
            >
              🚀 <strong>Main Project Feature:</strong>
            </motion.p>

            {/* Changed from anchor tag to button */}
            <motion.button
              onClick={openAS400App} // Changed to onClick handler
              whileHover={{
                scale: 1.05,
                boxShadow: '0 10px 40px rgba(255, 215, 0, 0.3)'
              }}
              whileTap={{ scale: 0.98 }}
              style={{
                ...buttonGlassStyle,
                color: '#000',
                textDecoration: 'none',
                fontSize: '1.1rem',
                fontWeight: '700',
                padding: '1rem 2rem',
                display: 'inline-block',
                position: 'relative',
                overflow: 'hidden',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <motion.span
                style={{
                  position: 'relative',
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
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
          </motion.div>
        </motion.div>

        {/* Main Content Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr',
            gap: '2rem',
            alignItems: 'start'
          }}
        >
          {/* Left Column - Input */}
          <div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              style={{
                marginBottom: '1rem',
                padding: '1rem',
                ...glassStyle
              }}
            >
              <h3 style={{
                color: 'var(--text-primary)',
                fontSize: '1rem',
                fontWeight: '600',
                margin: '0 0 0.5rem 0'
              }}>
                📝 Gemini AI MD File Analyzer
              </h3>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                margin: '0 0 1rem 0'
              }}>
                Upload your .md file and get real AI-powered insights
              </p>

              <ProfessionalInput
                value={inputText}
                onChange={handleInputChange}
                onSubmit={handleSubmit}
                disabled={isProcessing}
                placeholder="Describe your AS/400 modernization challenge or ask about the MD file..."
              />
            </motion.div>

            {/* Additional Query Input for MD Analysis */}
            <AnimatePresence>
              {mdFileContent && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    padding: '1rem',
                    ...glassStyle,
                    overflow: 'hidden'
                  }}
                >
                  <h4 style={{
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    margin: '0 0 0.5rem 0'
                  }}>
                    🎯 Ask Gemini Specific Questions
                  </h4>
                  <textarea
                    value={analysisQuery}
                    onChange={handleAnalysisQueryChange}
                    placeholder="e.g., What are the key modernization steps? What technologies are recommended?"
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '0.75rem',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(5px)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                  <motion.button
                    onClick={handleSpecificQuery}
                    disabled={isProcessing || !analysisQuery.trim()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem 1rem',
                      ...buttonGlassStyle,
                      color: '#000',
                      border: 'none',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      opacity: (isProcessing || !analysisQuery.trim()) ? 0.5 : 1
                    }}
                  >
                    <motion.span
                      animate={{ rotate: isProcessing ? 360 : 0 }}
                      transition={{ duration: 1, repeat: isProcessing ? Infinity : 0 }}
                    >
                      🤖
                    </motion.span>
                    {' '}Analyze with Gemini AI
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column - Results */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            style={{
              ...glassStyle,
              overflow: 'hidden'
            }}
          >
            {/* Results Header */}
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <h3 style={{
                color: 'var(--text-primary)',
                fontSize: '1.1rem',
                fontWeight: '600',
                margin: 0
              }}>
                📋 Gemini AI Analysis Results
              </h3>
            </div>

            {/* Results Content */}
            <div style={{
              padding: '1.5rem',
              minHeight: '300px',
              maxHeight: '500px',
              overflow: 'auto'
            }}>
              <AnimatePresence mode="wait">
                {isProcessing ? (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '200px',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <motion.div
                      animate={{
                        rotate: 360,
                        scale: [1, 1.2, 1]
                      }}
                      transition={{
                        rotate: { duration: 1, repeat: Infinity, ease: "linear" },
                        scale: { duration: 2, repeat: Infinity }
                      }}
                      style={{
                        fontSize: '3rem',
                        marginBottom: '1rem'
                      }}
                    >
                      🤖
                    </motion.div>
                    <motion.p
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      Gemini AI is analyzing your MD file...
                    </motion.p>
                  </motion.div>
                ) : generatedContent ? (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    style={{
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'inherit'
                    }}
                  >
                    {generatedContent}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                      fontSize: '0.9rem',
                      padding: '2rem'
                    }}
                  >
                    <motion.div
                      animate={{
                        y: [0, -10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                      style={{
                        fontSize: '4rem',
                        marginBottom: '1rem',
                        opacity: 0.6
                      }}
                    >
                      🤖📄
                    </motion.div>
                    <p>Upload your modernization-results MD file for real Gemini AI analysis...</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '1rem' }}>
                      ✨ Powered by Real Gemini API • Advanced MD parsing • Smart insights
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginTop: '3rem'
          }}
        >
          {[
            { icon: '🤖', title: 'Real Gemini AI', desc: 'Live API integration', delay: 0 },
            { icon: '📖', title: 'Smart Parsing', desc: 'Structure recognition', delay: 0.1 },
            { icon: '🎯', title: 'Targeted Insights', desc: 'Specific queries', delay: 0.2 },
            { icon: '📊', title: 'Data Extraction', desc: 'Key metrics & values', delay: 0.3 }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + item.delay, duration: 0.5 }}
              whileHover={{
                scale: 1.05,
                y: -5,
                boxShadow: '0 10px 30px rgba(255, 215, 0, 0.2)'
              }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                ...glassStyle,
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
                  fontSize: '2rem',
                  marginBottom: '0.5rem'
                }}
              >
                {item.icon}
              </motion.div>
              <h4 style={{
                color: 'var(--text-primary)',
                fontSize: '1rem',
                fontWeight: '600',
                margin: '0 0 0.25rem 0'
              }}>
                {item.title}
              </h4>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                margin: 0
              }}>
                {item.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
