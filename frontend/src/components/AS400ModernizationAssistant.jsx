 import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AS400ModernizationAssistant = () => {
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
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Refs
  const copybookInputRef = useRef(null);
  const dataInputRef = useRef(null);
  const diagramContainerRef = useRef(null);

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

## 🏗️ Architecture Overview
This modernized system follows a microservices architecture pattern, breaking down the monolithic AS/400 system into smaller, manageable services.

## 🚪 API Gateway
- **Purpose**: Central entry point for all client requests
- **Responsibilities**: Authentication, rate limiting, routing, load balancing
- **Technology Stack**: Express.js, JWT, Rate Limiting middleware

## ⚙️ Core Business Services

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

## 🗄️ Database Schema
\`\`\`sql
${assets.dbSchema}
\`\`\`

## 🔗 REST API Implementation
\`\`\`javascript
${assets.restApi}
\`\`\`

## 📊 Sample JSON Data
\`\`\`json
${JSON.stringify(assets.jsonData, null, 2)}
\`\`\`

## 🏗️ Microservices Architecture
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
    { id: 'db-schema', name: '🗄️ Database Schema', icon: '🗄️' },
    { id: 'rest-api', name: '🔗 REST API', icon: '🔗' },
    { id: 'json-data', name: '📊 JSON Data', icon: '📊' },
    { id: 'microservices', name: '🏗️ Microservices', icon: '🏗️' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 relative overflow-hidden">
      {/* Background gradients */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black"></div>
      <div className="fixed inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-yellow-500/5"></div>

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

      {/* Main content */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <motion.header
          className="py-8 px-4"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1
              className="text-5xl font-bold mb-4"
              variants={slideIn}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                AS/400
              </span>
              <span className="text-white"> Legacy Modernization</span>
            </motion.h1>
            <motion.p
              className="text-xl text-gray-300 max-w-2xl mx-auto"
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Transform your COBOL legacy systems into modern web applications with AI-powered analysis
            </motion.p>
          </div>
        </motion.header>

        {/* Upload Section */}
        <motion.section
          className="py-12 px-4"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="max-w-4xl mx-auto">
            <motion.div
              className="backdrop-blur-md bg-gray-800/60 border border-orange-500/20 rounded-2xl p-8"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.h2
                className="text-3xl font-bold text-center mb-8"
                variants={scaleIn}
              >
                🚀 <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                  Upload Your Legacy Files
                </span>
              </motion.h2>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Copybook File */}
                <motion.div
                  className="backdrop-blur-md bg-gray-800/60 border border-orange-500/20 rounded-xl p-6"
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="text-center">
                    <motion.div
                      className="text-4xl mb-4"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      📋
                    </motion.div>
                    <h3 className="text-xl font-semibold mb-2">COBOL Copybook</h3>
                    <p className="text-gray-400 mb-4">Upload your .cpy file containing the data structure definitions</p>
                    <motion.button
                      onClick={() => copybookInputRef.current?.click()}
                      className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                        copybookFile
                          ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-black shadow-lg shadow-orange-500/30'
                          : 'bg-transparent border-2 border-orange-500/60 text-gray-300 hover:bg-orange-500/10 hover:border-orange-500/80'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {copybookFile ? `✅ ${copybookFile.name}` : 'Select Copybook (.cpy)'}
                    </motion.button>
                    <AnimatePresence>
                      {copybookFile && (
                        <motion.div
                          className="mt-2 text-sm text-green-400"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          Selected: {copybookFile.name} ({(copybookFile.size / 1024).toFixed(1)} KB)
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Data File */}
                <motion.div
                  className="backdrop-blur-md bg-gray-800/60 border border-orange-500/20 rounded-xl p-6"
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="text-center">
                    <motion.div
                      className="text-4xl mb-4"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      💾
                    </motion.div>
                    <h3 className="text-xl font-semibold mb-2">Legacy Data</h3>
                    <p className="text-gray-400 mb-4">Upload your .dat file containing the actual data records</p>
                    <motion.button
                      onClick={() => dataInputRef.current?.click()}
                      className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                        dataFile
                          ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-black shadow-lg shadow-orange-500/30'
                          : 'bg-transparent border-2 border-orange-500/60 text-gray-300 hover:bg-orange-500/10 hover:border-orange-500/80'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {dataFile ? `✅ ${dataFile.name}` : 'Select Data (.dat)'}
                    </motion.button>
                    <AnimatePresence>
                      {dataFile && (
                        <motion.div
                          className="mt-2 text-sm text-green-400"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          Selected: {dataFile.name} ({(dataFile.size / 1024).toFixed(1)} KB)
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
                  className={`px-12 py-4 rounded-xl text-xl font-bold transition-all duration-300 ${
                    copybookFile && dataFile && !isLoading
                      ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-black shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                  whileHover={copybookFile && dataFile && !isLoading ? { scale: 1.05, y: -2 } : {}}
                  whileTap={copybookFile && dataFile && !isLoading ? { scale: 0.95 } : {}}
                  animate={copybookFile && dataFile && !isLoading ? {
                    boxShadow: ["0 0 20px rgba(255, 140, 0, 0.3)", "0 0 40px rgba(255, 140, 0, 0.6)", "0 0 20px rgba(255, 140, 0, 0.3)"]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {isLoading ? '🔄 Processing...' : '🔥 Ignite Modernization'}
                </motion.button>

                {/* Loading Spinner */}
                <AnimatePresence>
                  {isLoading && (
                    <motion.div
                      className="mt-8 flex items-center justify-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <motion.div
                        className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <span className="ml-3 text-lg">Analyzing and modernizing your legacy files...</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200"
                      initial={{ opacity: 0, scale: 0.9, x: -10 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        x: [0, 5, -5, 0],
                        transition: { x: { duration: 0.5 } }
                      }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      {error}
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
              className="py-12 px-4"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.6 }}
            >
              <div className="max-w-6xl mx-auto">
                <motion.div
                  className="backdrop-blur-md bg-gray-800/60 border border-orange-500/20 rounded-2xl p-8"
                  layoutId="results-container"
                >
                  <motion.h2
                    className="text-3xl font-bold text-center mb-8"
                    variants={scaleIn}
                  >
                    ✨ <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                      Modernization Results
                    </span>
                  </motion.h2>

                  {/* Insight Engine */}
                  <motion.div
                    className="backdrop-blur-md bg-gray-800/60 border-2 border-amber-400 rounded-xl p-6 mb-8"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h3 className="text-2xl font-bold text-center mb-4 bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                      The Insight Engine
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <motion.div whileHover={{ scale: 1.05 }}>
                        <p className="text-sm font-semibold text-gray-400">MANUAL EFFORT</p>
                        <p className="text-xl font-bold">{results.modernizationAssets.insightEngine.manualEffort.hours}</p>
                        <p className="text-sm text-gray-400">{results.modernizationAssets.insightEngine.manualEffort.timeline}</p>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }}>
                        <p className="text-sm font-semibold text-gray-400">ESTIMATED COST (USD)</p>
                        <p className="text-3xl font-bold text-red-500">{results.modernizationAssets.insightEngine.manualEffort.costUSD}</p>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }}>
                        <p className="text-sm font-semibold text-gray-400">SAVINGS w/ OUR TOOL</p>
                        <p className="text-3xl font-bold text-green-500"> 85%</p>
                      </motion.div>
                    </div>
                    <p className="text-center mt-4 text-sm text-gray-400">
                      {results.modernizationAssets.insightEngine.summary}
                    </p>
                  </motion.div>

                  {/* Tab Navigation */}
                  <motion.div
                    className="flex flex-wrap justify-center gap-4 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    {tabs.map((tab, index) => (
                      <motion.button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                          activeTab === tab.id
                            ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-black'
                            : 'bg-transparent border border-orange-500/30 text-gray-300 hover:bg-orange-500/10'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                      >
                        {tab.name}
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
                    >
                      {/* Database Schema Tab */}
                      {activeTab === 'db-schema' && (
                        <div>
                          <h3 className="text-xl font-semibold mb-4">PostgreSQL Database Schema</h3>
                          <div className="backdrop-blur-md bg-gray-900/60 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-sm text-green-400 whitespace-pre-wrap">
                              <code>{results.modernizationAssets.dbSchema}</code>
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* REST API Tab */}
                      {activeTab === 'rest-api' && (
                        <div>
                          <h3 className="text-xl font-semibold mb-4">Node.js Express REST API</h3>
                          <div className="backdrop-blur-md bg-gray-900/60 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-sm text-blue-400 whitespace-pre-wrap">
                              <code>{results.modernizationAssets.restApi}</code>
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* JSON Data Tab */}
                      {activeTab === 'json-data' && (
                        <div>
                          <h3 className="text-xl font-semibold mb-4">Converted JSON Data</h3>
                          <div className="backdrop-blur-md bg-gray-900/60 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-sm text-yellow-400 whitespace-pre-wrap">
                              <code>{JSON.stringify(results.modernizationAssets.jsonData, null, 2)}</code>
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Microservices Tab */}
                      {activeTab === 'microservices' && (
                        <div>
                          <h3 className="text-xl font-semibold mb-4">🏗️ Microservices Architecture</h3>

                          {/* View Toggle */}
                          <div className="flex justify-center mb-6">
                            <div className="backdrop-blur-md bg-gray-800/60 rounded-lg p-1 flex">
                              <motion.button
                                onClick={() => setMicroservicesView('diagram')}
                                className={`px-6 py-2 rounded-md font-medium transition-all ${
                                  microservicesView === 'diagram'
                                    ? 'bg-orange-500 text-black'
                                    : 'text-gray-300 hover:text-white'
                                }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                🎨 Interactive Diagram
                              </motion.button>
                              <motion.button
                                onClick={() => setMicroservicesView('code')}
                                className={`px-6 py-2 rounded-md font-medium transition-all ${
                                  microservicesView === 'code'
                                    ? 'bg-orange-500 text-black'
                                    : 'text-gray-300 hover:text-white'
                                }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                📝 Architecture Code
                              </motion.button>
                            </div>
                          </div>

                          <AnimatePresence mode="wait">
                            {microservicesView === 'diagram' ? (
                              <motion.div
                                key="diagram"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="mb-6"
                              >
                                <div className="backdrop-blur-md bg-gray-900/60 rounded-lg p-6">
                                  <div className="text-center mb-4">
                                    <h4 className="text-lg font-semibold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                                      Interactive Microservices Architecture
                                    </h4>
                                    <p className="text-gray-400 text-sm mt-1">
                                      🖱️ Click services for details • ✨ Hover for effects
                                    </p>
                                  </div>

                                  {/* Diagram Container */}
                                  <div
                                    ref={diagramContainerRef}
                                    className="relative w-full h-96 border border-gray-700 rounded-lg bg-gray-900 overflow-hidden"
                                    style={{
                                      background: 'radial-gradient(circle at 50% 50%, rgba(255, 140, 0, 0.05) 0%, transparent 70%)'
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
                                          scale: 1.1,
                                          zIndex: 10,
                                          filter: 'brightness(1.2)'
                                        }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleServiceClick(service)}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{
                                          delay: microservicesData.indexOf(service) * 0.1,
                                          type: "spring",
                                          stiffness: 300
                                        }}
                                      >
                                        <div
                                          className="relative p-4 rounded-xl border-2 shadow-lg min-w-[120px] backdrop-blur-sm"
                                          style={{
                                            background: `linear-gradient(135deg, ${service.color}15, ${service.color}25)`,
                                            borderColor: service.color
                                          }}
                                        >
                                          <div className="text-center">
                                            <div className="text-xs font-bold text-white mb-1">
                                              {getServiceIcon(service.type)} {service.name}
                                            </div>
                                            <div className="text-xs text-gray-300">
                                              {service.type}
                                            </div>
                                          </div>
                                          <motion.div
                                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full"
                                            style={{
                                              background: service.color,
                                              boxShadow: `0 0 10px ${service.color}50`
                                            }}
                                            animate={{
                                              scale: [1, 1.2, 1],
                                              opacity: [1, 0.7, 1]
                                            }}
                                            transition={{
                                              duration: 2,
                                              repeat: Infinity
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
                                          markerWidth="10"
                                          markerHeight="7"
                                          refX="10"
                                          refY="3.5"
                                          orient="auto"
                                        >
                                          <polygon points="0 0, 10 3.5, 0 7" fill="#FF8C00" />
                                        </marker>
                                        <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                          <stop offset="0%" style={{ stopColor: '#FF8C00', stopOpacity: 0.8 }} />
                                          <stop offset="100%" style={{ stopColor: '#FFD700', stopOpacity: 0.8 }} />
                                        </linearGradient>
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
                                              strokeWidth="2"
                                              markerEnd="url(#arrowhead)"
                                              opacity="0.7"
                                              initial={{ pathLength: 0 }}
                                              animate={{ pathLength: 1 }}
                                              transition={{
                                                duration: 1,
                                                delay: microservicesData.indexOf(service) * 0.2
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
                                        className="mt-6 p-4 bg-gray-700 rounded-lg border border-orange-500/30"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                      >
                                        <div className="flex items-center justify-between mb-3">
                                          <h5 className="font-semibold text-orange-400">
                                            {getServiceIcon(serviceDetails.type)} {serviceDetails.name}
                                          </h5>
                                          <motion.button
                                            onClick={() => setServiceDetails(null)}
                                            className="text-gray-400 hover:text-white"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                          >
                                            ✕
                                          </motion.button>
                                        </div>
                                        <div className="text-sm text-gray-300 grid gap-4">
                                          <div>
                                            <div className="font-medium text-orange-400 mb-1">📋 Description</div>
                                            <div>{serviceDetails.description}</div>
                                          </div>
                                          <div>
                                            <div className="font-medium text-orange-400 mb-1">🏷️ Service Type</div>
                                            <span
                                              className="inline-block px-3 py-1 rounded-full text-xs font-medium border"
                                              style={{
                                                background: `${serviceDetails.color}20`,
                                                color: serviceDetails.color,
                                                borderColor: serviceDetails.color
                                              }}
                                            >
                                              {serviceDetails.type.toUpperCase()}
                                            </span>
                                          </div>
                                          <div>
                                            <div className="font-medium text-orange-400 mb-2">🔗 API Endpoints</div>
                                            <div className="grid gap-1">
                                              {serviceDetails.endpoints.map((endpoint, idx) => (
                                                <motion.span
                                                  key={idx}
                                                  className="inline-block bg-gray-600 px-3 py-1 rounded text-xs font-mono"
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
                                            <div className="font-medium text-orange-400 mb-2">🛠️ Technologies</div>
                                            <div className="flex flex-wrap gap-1">
                                              {serviceDetails.technologies.map((tech, idx) => (
                                                <motion.span
                                                  key={idx}
                                                  className="inline-block bg-blue-600 px-2 py-1 rounded text-xs"
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
                                      </motion.div>
                                    )}
                                  </AnimatePresence>

                                  {/* Architecture Legend */}
                                  <motion.div
                                    className="mt-4 p-3 bg-gray-800 rounded-lg"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1 }}
                                  >
                                    <h5 className="text-sm font-semibold text-gray-300 mb-2">🏗️ Architecture Legend</h5>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                      {[
                                        { color: '#3B82F6', label: 'API Gateway' },
                                        { color: '#10B981', label: 'Core Services' },
                                        { color: '#8B5CF6', label: 'Data Services' },
                                        { color: '#F59E0B', label: 'External Services' }
                                      ].map((item, idx) => (
                                        <motion.div
                                          key={idx}
                                          className="flex items-center gap-2"
                                          initial={{ opacity: 0, x: -20 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: 1.2 + idx * 0.1 }}
                                        >
                                          <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: item.color }}
                                          />
                                          <span className="text-gray-300">{item.label}</span>
                                        </motion.div>
                                      ))}
                                    </div>
                                  </motion.div>
                                </div>
                              </motion.div>
                            ) : (
                              <motion.div
                                key="code"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="backdrop-blur-md bg-gray-900/60 rounded-lg p-4 overflow-x-auto"
                              >
                                <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                                  <code>{results.modernizationAssets.microservices}</code>
                                </pre>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Download Section */}
                  <motion.div
                    className="mt-8 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <motion.button
                      onClick={handleDownload}
                      className="bg-transparent border-2 border-orange-500/60 text-gray-300 hover:bg-orange-500/10 hover:border-orange-500/80 px-8 py-3 rounded-lg font-medium transition-all duration-300"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      📥 Download All Assets
                    </motion.button>
                  </motion.div>
                </motion.div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AS400ModernizationAssistant;
