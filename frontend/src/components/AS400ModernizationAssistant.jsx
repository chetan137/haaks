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

  // Download Markdown functionality
  const handleDownloadMarkdown = () => {
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

  // Download PDF functionality
  const handleDownloadPDF = () => {
    if (!results) {
      setError('No results to download. Please run modernization first.');
      return;
    }

    const assets = results.modernizationAssets;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

    // Create HTML content for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>AS/400 Legacy Modernization Results</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #ff8c00;
        }
        .header h1 {
            color: #ff8c00;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        .section h2 {
            color: #ff8c00;
            font-size: 1.5em;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 2px solid #ffd700;
        }
        .code-block {
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            border-left: 4px solid #ff8c00;
            padding: 15px;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            overflow-x: auto;
            white-space: pre-wrap;
        }
        .insight-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .insight-card {
            background-color: #f8f9fa;
            border: 2px solid #ff8c00;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        .insight-card h3 {
            color: #ff8c00;
            margin-bottom: 10px;
        }
        .insight-value {
            font-size: 1.5em;
            font-weight: bold;
            color: #333;
        }
        .json-data {
            background-color: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 15px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            color: #666;
            font-style: italic;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        .page-break {
            page-break-before: always;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>AS/400 Legacy Modernization Results</h1>
        <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Source Files:</strong> ${results.files.copybook}, ${results.files.datafile}</p>
    </div>

    <div class="section">
        <h2>🧠 Insight Engine Analysis</h2>
        <div class="insight-grid">
            <div class="insight-card">
                <h3>Manual Effort</h3>
                <div class="insight-value">${assets.insightEngine.manualEffort.hours} hours</div>
                <p>${assets.insightEngine.manualEffort.timeline}</p>
            </div>
            <div class="insight-card">
                <h3>Manual Cost (USD)</h3>
                <div class="insight-value">${assets.insightEngine.manualEffort.costUSD}</div>
            </div>
            <div class="insight-card">
                <h3>Tool Savings</h3>
                <div class="insight-value">85%</div>
                <p>Time & Cost Reduction</p>
            </div>
        </div>
        <p><strong>Summary:</strong> ${assets.insightEngine.summary}</p>
    </div>

    <div class="section page-break">
        <h2>🗄️ Database Schema</h2>
        <div class="code-block">${assets.dbSchema}</div>
    </div>

    <div class="section page-break">
        <h2>🔗 REST API Implementation</h2>
        <div class="code-block">${assets.restApi}</div>
    </div>

    <div class="section page-break">
        <h2>📊 Sample JSON Data</h2>
        <div class="json-data">${JSON.stringify(assets.jsonData, null, 2)}</div>
    </div>

    <div class="section page-break">
        <h2>🏗️ Microservices Architecture</h2>
        <div class="code-block">${assets.microservices}</div>
    </div>

    <div class="footer">
        <p>Generated by AS/400 Legacy Modernization Assistant</p>
        <p>Timestamp: ${timestamp}</p>
    </div>
</body>
</html>`;

    // Create blob and download as HTML (which can be easily converted to PDF by browser)
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `modernization-results-${timestamp}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Show instruction for PDF conversion
    setTimeout(() => {
      alert('HTML file downloaded! To convert to PDF:\n1. Open the downloaded HTML file in your browser\n2. Press Ctrl+P (or Cmd+P on Mac)\n3. Select "Save as PDF" as destination\n4. Click Save');
    }, 500);
  };

  const tabs = [
    { id: 'db-schema', name: '🗄️ Database Schema', icon: '🗄️' },
    { id: 'rest-api', name: '🔗 REST API', icon: '🔗' },
    { id: 'json-data', name: '📊 JSON Data', icon: '📊' },
    { id: 'microservices', name: '🏗️ Microservices', icon: '🏗️' }
  ];

  // New: Load demo files for accounts
  const loadAccountDemo = () => {
    const accCpyContent = `******************************************************************
      * ACCTREC.cpy - Account Record Layout
      * Extracted from the COBOL Programming Course examples.
      * This defines the structure for a customer account data file.
      ******************************************************************
       01  ACCT-FIELDS.
           05  ACCT-NO            PIC X(8).
           05  ACCT-LIMIT         PIC S9(7)V99 COMP-3.
           05  ACCT-BALANCE       PIC S9(7)V99 COMP-3.
           05  LAST-NAME          PIC X(20).
           05  FIRST-NAME         PIC X(15).
           05  CLIENT-ADDR.
               10  STREET-ADDR    PIC X(25).
               10  CITY-COUNTY    PIC X(20).
               10  USA-STATE      PIC X(15).
           05  RESERVED           PIC X(7).
           05  COMMENTS           PIC X(50).`;
    const accDatContent = `ACCT-NO	ACCT-LIMIT	ACCT-BALANCE	LAST-NAME	FIRST-NAME	STREET-ADDR	CITY-COUNTY	USA-STATE	COMMENTS
A1002003	15000.00	7550.25	Stark	Anthony	10880 Malibu Point	Malibu	California	Primary account holder, high value client.
B4005006	5000.00	1275.80	Rogers	Steven	569 Leaman Place	Brooklyn	New York	Founding member, excellent credit history.
C7008009	500.00	234.51	Banner	Bruce	123 Gamma Labs Street	Dayton	Ohio	Account requires careful monitoring.
D9011012	100000.00	9500.00	Romanoff	Natasha	25 Secret Avenue	Unknown	Unknown	Address on file is a placeholder.`;

    const cpyBlob = new Blob([accCpyContent], { type: 'text/plain' });
    const datBlob = new Blob([accDatContent], { type: 'text/plain' });

    const cpyFile = new File([cpyBlob], "Acc.cpy");
    const datFile = new File([datBlob], "Acc.dat");

    setCopybookFile(cpyFile);
    setDataFile(datFile);
    setError('');
  };

  // New: Load demo files for claims
  const loadClaimsDemo = () => {
    const claimsCpyContent = `******************************************************************
      * CLAIMS.cpy - Healthcare Claim Transaction Layout
      ******************************************************************
       01  CLAIM-RECORD.
           05  CLAIM-ID           PIC X(15).
           05  PATIENT-ID         PIC 9(10).
           05  PROVIDER-ID        PIC X(12).
           05  SERVICE-DATE       PIC 9(8).
           05  DIAGNOSIS-CODE     PIC X(10).
           05  PROCEDURE-CODE     PIC X(10).
           05  AMOUNT-BILLED      PIC S9(7)V99.
           05  AMOUNT-PAID        PIC S9(7)V99.
           05  STATUS-CODE        PIC X(1).`;
    const claimsDatContent = `CLM-2025-0000010000123456PROV-XYZ-12320250920ICD-J45.90CPT-99214000055000000047550P
CLM-2025-0000020000456789PROV-ABC-45620250921ICD-M54.5 CPT-97140000030000000025000A
CLM-2025-0000030000987654PROV-XYZ-12320250921ICD-R05   CPT-99203000015000000012500P
CLM-2025-0000040000123456PROV-DEF-78920250922ICD-J02.9 CPT-87880000007500000006500D`;

    const cpyBlob = new Blob([claimsCpyContent], { type: 'text/plain' });
    const datBlob = new Blob([claimsDatContent], { type: 'text/plain' });

    const cpyFile = new File([cpyBlob], "CLAIMS.CPY");
    const datFile = new File([datBlob], "CLAIMS.DAT");

    setCopybookFile(cpyFile);
    setDataFile(datFile);
    setError('');
  };

  return (
    <>
      <style jsx>{`
        .as400-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #374151 50%, #1e293b 75%, #0f172a 100%);
          position: relative;
          overflow-x: hidden;
        }

        .bg-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background:
            radial-gradient(ellipse at top left, rgba(255, 140, 0, 0.1), transparent 50%),
            radial-gradient(ellipse at bottom right, rgba(255, 215, 0, 0.08), transparent 50%),
            radial-gradient(ellipse at center, rgba(255, 140, 0, 0.05), transparent 70%);
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
          border: 1px solid rgba(255, 140, 0, 0.2);
          border-radius: 1.5rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .glass-card-light {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 140, 0, 0.15);
          border-radius: 1rem;
        }

        .gradient-text {
          background: linear-gradient(135deg, #ff8c00 0%, #ffd700 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .btn-primary {
          background: linear-gradient(135deg, #ff8c00 0%, #ffd700 100%);
          color: #000;
          border: none;
          font-weight: 700;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(255, 140, 0, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(255, 140, 0, 0.4);
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
          border: 2px solid rgba(255, 140, 0, 0.4);
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          background: rgba(255, 140, 0, 0.1);
          border-color: rgba(255, 140, 0, 0.6);
          color: #fff;
        }

        .btn-pdf {
          background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
          color: #fff;
          border: none;
          font-weight: 700;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(220, 38, 38, 0.3);
        }

        .btn-pdf:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(220, 38, 38, 0.4);
        }

        .tab-active {
          background: linear-gradient(135deg, #ff8c00 0%, #ffd700 100%);
          color: #000;
          font-weight: 700;
        }

        .tab-inactive {
          background: transparent;
          color: #cbd5e1;
          border: 1px solid rgba(255, 140, 0, 0.3);
        }

        .tab-inactive:hover {
          background: rgba(255, 140, 0, 0.1);
          color: #fff;
        }

        .code-block {
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255, 140, 0, 0.2);
          border-radius: 0.75rem;
          padding: 1.5rem;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.875rem;
          line-height: 1.6;
          overflow-x: auto;
        }

        .service-node {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(8px);
          border: 2px solid;
          border-radius: 1rem;
          padding: 1rem;
          min-width: 120px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .service-node:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 25px rgba(255, 140, 0, 0.3);
        }

        .pulse {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .rotate {
          animation: rotate 2s linear infinite;
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .floating {
          animation: floating 3s ease-in-out infinite;
        }

        @keyframes floating {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
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

        .grid-2 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          width: 100%;
        }

        .grid-3 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          width: 100%;
        }

        .download-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .content-wrapper {
            padding: 0 0.5rem;
          }

          .grid-2,
          .grid-3 {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .section-spacing {
            margin-bottom: 2rem;
          }

          .download-buttons {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>

      <div className="as400-container">
        <div className="bg-overlay"></div>

        {/* Hidden file inputs */}
        <input
          ref={copybookInputRef}
          type="file"
          accept=".cpy"
          onChange={handleCopybookSelect}
          style={{ display: 'none' }}
        />
        <input
          ref={dataInputRef}
          type="file"
          accept=".dat"
          onChange={handleDataSelect}
          style={{ display: 'none' }}
        />

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
            <motion.h1
              className="gradient-text"
              variants={slideIn}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{
                fontSize: 'clamp(3rem, 8vw, 6rem)',
                fontWeight: 900,
                marginBottom: '1rem',
                lineHeight: 1
              }}
            >
              AS/400
            </motion.h1>
            <motion.h2
              style={{
                fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '1.5rem'
              }}
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Legacy Modernization
            </motion.h2>
            <motion.div
              style={{
                width: '100px',
                height: '4px',
                background: 'linear-gradient(90deg, #ff8c00, #ffd700)',
                borderRadius: '2px',
                marginBottom: '2rem'
              }}
              initial={{ width: 0 }}
              animate={{ width: 100 }}
              transition={{ delay: 0.8, duration: 1 }}
            />
            <motion.p
              style={{
                fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                color: '#cbd5e1',
                maxWidth: '600px',
                lineHeight: 1.6
              }}
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              Transform your COBOL legacy systems into modern web applications with AI-powered analysis
            </motion.p>
          </motion.header>

          {/* New: Problem Context Section */}
          <motion.section
            className="section-spacing"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="glass-card" style={{ padding: '3rem' }}>
              <div className="center-container" style={{ marginBottom: '3rem' }}>
                <motion.h2
                  className="gradient-text"
                  variants={scaleIn}
                  style={{
                    fontSize: 'clamp(2rem, 5vw, 3rem)',
                    fontWeight: 800,
                    marginBottom: '1rem'
                  }}
                >
                  AI-Powered Legacy Modernization Assistant
                </motion.h2>
                <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '2rem' }}>
                  Many enterprises still rely on IBM AS/400 (iSeries) systems for critical operations. While these platforms are stable and reliable, they pose serious challenges today:
                </p>
                <ul style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: '1.8', maxWidth: '800px' }}>
                  <li>Outdated green-screen interfaces that are difficult to use.</li>
                  <li>Flat files and DB2 databases that are tightly coupled, making integration painful.</li>
                  <li>Locked-in data and business logic buried in legacy workflows.</li>
                  <li>High cost and risk associated with migration or modernization.</li>
                </ul>
                <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginTop: '2rem' }}>
                  These challenges prevent organizations from adopting modern platforms, APIs, and cloud-native architectures. This AI agent solves this by automating the modernization of AS/400 workloads into a modern ecosystem, converting legacy COBOL copybooks and data files into SQL schemas, REST APIs, JSON data, and microservices architectures.
                </p>
              </div>
            </div>
          </motion.section>

          {/* New: System Diagram Section */}
          <motion.section
            className="section-spacing"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="glass-card" style={{ padding: '3rem' }}>
              <div className="center-container" style={{ marginBottom: '3rem' }}>
                <motion.h2
                  className="gradient-text"
                  variants={scaleIn}
                  style={{
                    fontSize: 'clamp(2rem, 5vw, 3rem)',
                    fontWeight: 800,
                    marginBottom: '1rem'
                  }}
                >
                  System Flow Diagram
                </motion.h2>
                <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '2rem' }}>
                  The following diagram illustrates the multi-agent pipeline process: Starting from user registration/login, it converts SQL & APIs, extracts schema & fields, preprocesses, chunks, orchestrates parsing, transformation, validation, and repair if invalid, finally checking correctness & confidence via an explainer agent and API layer.
                </p>
                <div className="code-block" style={{ whiteSpace: 'pre', fontFamily: 'monospace', textAlign: 'left' }}>
{`                  Phone/Email +
                  Registration       Login
User  ------------> ------------>
Start    Enter Basic Info,       Multi-Agent
         Email, Password (1)      Pipeline
                                 User Upload
Converts SQL &                   /dat /cpy
APIs                             Labeled File
Extracts
Schema & Fields

Preproessing
Chunking
Orchestrator
Parser   Transform   Validator   DB Schema
Repair                   R
If Invalid
Repair Agent
Explainer Agent         Checks &
                        Correctness
                        Confidence
                        API Layer
Outputs Invalid`}
                </div>
              </div>
            </div>
          </motion.section>

          {/* New: Demo Files Section */}
          <motion.section
            className="section-spacing"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="glass-card" style={{ padding: '3rem' }}>
              <div className="center-container" style={{ marginBottom: '3rem' }}>
                <motion.h2
                  className="gradient-text"
                  variants={scaleIn}
                  style={{
                    fontSize: 'clamp(2rem, 5vw, 3rem)',
                    fontWeight: 800,
                    marginBottom: '1rem'
                  }}
                >
                  Try Demo Files
                </motion.h2>
                <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '2rem' }}>
                  Use these pre-loaded demo files to easily test the modernization process and analyze the output without uploading your own files.
                </p>
              </div>
              <div className="grid-2">
                <motion.div
                  className="glass-card-light"
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  style={{ padding: '2rem' }}
                >
                  <div className="center-container">
                    <h3 style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#fff',
                      marginBottom: '0.5rem'
                    }}>
                      Account Demo
                    </h3>
                    <p style={{
                      color: '#94a3b8',
                      marginBottom: '2rem',
                      lineHeight: 1.5
                    }}>
                      Loads Acc.cpy (copybook) and Acc.dat (data) for customer accounts.
                    </p>
                    <motion.button
                      onClick={loadAccountDemo}
                      className="btn-primary"
                      style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.75rem',
                        fontSize: '1rem',
                        width: '100%',
                        maxWidth: '250px'
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Load Account Demo
                    </motion.button>
                  </div>
                </motion.div>
                <motion.div
                  className="glass-card-light"
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  style={{ padding: '2rem' }}
                >
                  <div className="center-container">
                    <h3 style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#fff',
                      marginBottom: '0.5rem'
                    }}>
                      Claims Demo
                    </h3>
                    <p style={{
                      color: '#94a3b8',
                      marginBottom: '2rem',
                      lineHeight: 1.5
                    }}>
                      Loads CLAIMS.CPY (copybook) and CLAIMS.DAT (data) for healthcare claims.
                    </p>
                    <motion.button
                      onClick={loadClaimsDemo}
                      className="btn-primary"
                      style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.75rem',
                        fontSize: '1rem',
                        width: '100%',
                        maxWidth: '250px'
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Load Claims Demo
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.section>

          {/* Upload Section */}
          <motion.section
            className="section-spacing"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="glass-card" style={{ padding: '3rem' }}>
              <div className="center-container" style={{ marginBottom: '3rem' }}>
                <motion.h2
                  className="gradient-text"
                  variants={scaleIn}
                  style={{
                    fontSize: 'clamp(2rem, 5vw, 3rem)',
                    fontWeight: 800,
                    marginBottom: '1rem'
                  }}
                >
                  🚀 Upload Your Legacy Files
                </motion.h2>
                <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>
                  Begin your modernization journey by uploading your legacy system files
                </p>
              </div>

              <div className="grid-2" style={{ marginBottom: '3rem' }}>
                {/* Copybook File */}
                <motion.div
                  className="glass-card-light"
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  style={{ padding: '2rem' }}
                >
                  <div className="center-container">
                    <motion.div
                      style={{ fontSize: '4rem', marginBottom: '1rem' }}
                      className="floating"
                    >
                      📋
                    </motion.div>
                    <h3 style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#fff',
                      marginBottom: '0.5rem'
                    }}>
                      COBOL Copybook
                    </h3>
                    <p style={{
                      color: '#94a3b8',
                      marginBottom: '2rem',
                      lineHeight: 1.5
                    }}>
                      Upload your <span style={{ color: '#ff8c00', fontWeight: 600 }}>.cpy</span> file containing the data structure definitions
                    </p>

                    <motion.button
                      onClick={() => copybookInputRef.current?.click()}
                      className={copybookFile ? 'btn-primary' : 'btn-secondary'}
                      style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.75rem',
                        fontSize: '1rem',
                        width: '100%',
                        maxWidth: '250px'
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {copybookFile ? `✅ ${copybookFile.name}` : 'Select Copybook (.cpy)'}
                    </motion.button>

                    <AnimatePresence>
                      {copybookFile && (
                        <motion.div
                          style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            background: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            borderRadius: '0.5rem',
                            color: '#4ade80'
                          }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <div style={{ fontWeight: 600 }}>✅ File Selected Successfully</div>
                          <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                            {copybookFile.name} • {(copybookFile.size / 1024).toFixed(1)} KB
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Data File */}
                <motion.div
                  className="glass-card-light"
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  style={{ padding: '2rem' }}
                >
                  <div className="center-container">
                    <motion.div
                      style={{ fontSize: '4rem', marginBottom: '1rem' }}
                      className="floating"
                      transition={{ delay: 0.5 }}
                    >
                      💾
                    </motion.div>
                    <h3 style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#fff',
                      marginBottom: '0.5rem'
                    }}>
                      Legacy Data
                    </h3>
                    <p style={{
                      color: '#94a3b8',
                      marginBottom: '2rem',
                      lineHeight: 1.5
                    }}>
                      Upload your <span style={{ color: '#ff8c00', fontWeight: 600 }}>.dat</span> file containing the actual data records
                    </p>

                    <motion.button
                      onClick={() => dataInputRef.current?.click()}
                      className={dataFile ? 'btn-primary' : 'btn-secondary'}
                      style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.75rem',
                        fontSize: '1rem',
                        width: '100%',
                        maxWidth: '250px'
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {dataFile ? `✅ ${dataFile.name}` : 'Select Data (.dat)'}
                    </motion.button>

                    <AnimatePresence>
                      {dataFile && (
                        <motion.div
                          style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            background: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            borderRadius: '0.5rem',
                            color: '#4ade80'
                          }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <div style={{ fontWeight: 600 }}>✅ File Selected Successfully</div>
                          <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                            {dataFile.name} • {(dataFile.size / 1024).toFixed(1)} KB
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>

              {/* Action Button */}
              <div className="center-container">
                <motion.button
                  onClick={handleModernize}
                  disabled={!copybookFile || !dataFile || isLoading}
                  className="btn-primary"
                  style={{
                    padding: '1rem 3rem',
                    borderRadius: '1rem',
                    fontSize: '1.25rem',
                    fontWeight: 800
                  }}
                  whileHover={copybookFile && dataFile && !isLoading ? { scale: 1.05, y: -2 } : {}}
                  whileTap={copybookFile && dataFile && !isLoading ? { scale: 0.95 } : {}}
                >
                  {isLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="rotate">🔄</span>
                      Processing...
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🔥 Ignite Modernization ✨
                    </span>
                  )}
                </motion.button>

                {/* Loading State */}
                <AnimatePresence>
                  {isLoading && (
                    <motion.div
                      style={{ marginTop: '2rem', textAlign: 'center' }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1rem',
                        marginBottom: '0.5rem'
                      }}>
                        <div className="rotate" style={{
                          width: '32px',
                          height: '32px',
                          border: '3px solid rgba(255, 140, 0, 0.3)',
                          borderTop: '3px solid #ff8c00',
                          borderRadius: '50%'
                        }}></div>
                        <span style={{ fontSize: '1.1rem', color: '#ff8c00', fontWeight: 600 }}>
                          Analyzing and modernizing your legacy files...
                        </span>
                      </div>
                      <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                        Please wait while we transform your legacy systems
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '0.75rem',
                        color: '#fca5a5'
                      }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>⚠️</span>
                        <span style={{ fontWeight: 600 }}>{error}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.section>

          {/* Results Section */}
          <AnimatePresence>
            {results && (
              <motion.section
                className="section-spacing"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.6 }}
              >
                <div className="glass-card" style={{ padding: '3rem' }}>
                  <div className="center-container" style={{ marginBottom: '3rem' }}>
                    <motion.h2
                      className="gradient-text"
                      variants={scaleIn}
                      style={{
                        fontSize: 'clamp(2rem, 5vw, 3rem)',
                        fontWeight: 800,
                        marginBottom: '1rem'
                      }}
                    >
                      ✨ Modernization Results
                    </motion.h2>
                    <motion.div
                      style={{
                        width: '120px',
                        height: '4px',
                        background: 'linear-gradient(90deg, #ff8c00, #ffd700)',
                        borderRadius: '2px'
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: 120 }}
                      transition={{ delay: 0.3, duration: 1 }}
                    />
                  </div>

                  {/* Insight Engine */}
                  <motion.div
                    className="glass-card-light"
                    style={{
                      padding: '2rem',
                      marginBottom: '3rem',
                      border: '2px solid rgba(251, 191, 36, 0.4)'
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="center-container" style={{ marginBottom: '2rem' }}>
                      <h3 className="gradient-text" style={{
                        fontSize: '2rem',
                        fontWeight: 800,
                        marginBottom: '0.5rem'
                      }}>
                        🧠 The Insight Engine
                      </h3>
                    </div>

                    <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
                      <motion.div
                        className="glass-card-light"
                        style={{ padding: '1.5rem', textAlign: 'center' }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <p style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.5rem' }}>
                          MANUAL EFFORT
                        </p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>
                          {results.modernizationAssets.insightEngine.manualEffort.hours}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                          {results.modernizationAssets.insightEngine.manualEffort.timeline}
                        </p>
                      </motion.div>

                      <motion.div
                        className="glass-card-light"
                        style={{ padding: '1.5rem', textAlign: 'center' }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <p style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.5rem' }}>
                          ESTIMATED COST (USD)
                        </p>
                        <p style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444', marginBottom: '0.25rem' }}>
                          {results.modernizationAssets.insightEngine.manualEffort.costUSD}
                        </p>
                      </motion.div>

                      <motion.div
                        className="glass-card-light"
                        style={{ padding: '1.5rem', textAlign: 'center' }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <p style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.5rem' }}>
                          SAVINGS w/ OUR TOOL
                        </p>
                        <p style={{ fontSize: '2rem', fontWeight: 800, color: '#22c55e', marginBottom: '0.25rem' }}>
                          85%
                        </p>
                      </motion.div>
                    </div>

                    <div className="center-container">
                      <p style={{ color: '#94a3b8', lineHeight: 1.6, maxWidth: '600px' }}>
                        {results.modernizationAssets.insightEngine.summary}
                      </p>
                    </div>
                  </motion.div>

                  {/* Tab Navigation */}
                  <div className="center-container" style={{ marginBottom: '2rem' }}>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      gap: '1rem'
                    }}>
                      {tabs.map((tab, index) => (
                        <motion.button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={activeTab === tab.id ? 'tab-active' : 'tab-inactive'}
                          style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.75rem',
                            fontSize: '1rem',
                            fontWeight: 600,
                            transition: 'all 0.3s ease'
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                        >
                          {tab.name}
                        </motion.button>
                      ))}
                    </div>
                  </div>

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
                          <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{
                              fontSize: '1.5rem',
                              fontWeight: 700,
                              color: '#fff',
                              marginBottom: '0.5rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              🗄️ PostgreSQL Database Schema
                            </h3>
                            <p style={{ color: '#94a3b8' }}>
                              Auto-generated database structure for your legacy data
                            </p>
                          </div>
                          <div className="code-block" style={{ color: '#4ade80' }}>
                            <pre style={{ margin: 0 }}>
                              <code>{results.modernizationAssets.dbSchema}</code>
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* REST API Tab */}
                      {activeTab === 'rest-api' && (
                        <div>
                          <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{
                              fontSize: '1.5rem',
                              fontWeight: 700,
                              color: '#fff',
                              marginBottom: '0.5rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              🔗 Node.js Express REST API
                            </h3>
                            <p style={{ color: '#94a3b8' }}>
                              Modern API endpoints for your legacy data
                            </p>
                          </div>
                          <div className="code-block" style={{ color: '#60a5fa' }}>
                            <pre style={{ margin: 0 }}>
                              <code>{results.modernizationAssets.restApi}</code>
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* JSON Data Tab */}
                      {activeTab === 'json-data' && (
                        <div>
                          <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{
                              fontSize: '1.5rem',
                              fontWeight: 700,
                              color: '#fff',
                              marginBottom: '0.5rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              📊 Converted JSON Data
                            </h3>
                            <p style={{ color: '#94a3b8' }}>
                              Your legacy data transformed to modern format
                            </p>
                          </div>
                          <div className="code-block" style={{ color: '#fbbf24' }}>
                            <pre style={{ margin: 0 }}>
                              <code>{JSON.stringify(results.modernizationAssets.jsonData, null, 2)}</code>
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Microservices Tab */}
                      {activeTab === 'microservices' && (
                        <div>
                          <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{
                              fontSize: '1.5rem',
                              fontWeight: 700,
                              color: '#fff',
                              marginBottom: '0.5rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              🏗️ Microservices Architecture
                            </h3>
                            <p style={{ color: '#94a3b8' }}>
                              Modern, scalable system architecture design
                            </p>
                          </div>

                          {/* View Toggle */}
                          <div className="center-container" style={{ marginBottom: '2rem' }}>
                            <div className="glass-card-light" style={{
                              padding: '0.5rem',
                              display: 'inline-flex',
                              gap: '0.5rem'
                            }}>
                              <motion.button
                                onClick={() => setMicroservicesView('diagram')}
                                className={microservicesView === 'diagram' ? 'tab-active' : 'tab-inactive'}
                                style={{
                                  padding: '0.5rem 1rem',
                                  borderRadius: '0.5rem',
                                  fontSize: '0.875rem',
                                  fontWeight: 600,
                                  border: 'none'
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                🎨 Interactive Diagram
                              </motion.button>
                              <motion.button
                                onClick={() => setMicroservicesView('code')}
                                className={microservicesView === 'code' ? 'tab-active' : 'tab-inactive'}
                                style={{
                                  padding: '0.5rem 1rem',
                                  borderRadius: '0.5rem',
                                  fontSize: '0.875rem',
                                  fontWeight: 600,
                                  border: 'none'
                                }}
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
                                transition={{ duration: 0.5 }}
                              >
                                <div className="glass-card-light" style={{ padding: '2rem' }}>
                                  <div className="center-container" style={{ marginBottom: '1.5rem' }}>
                                    <h4 className="gradient-text" style={{
                                      fontSize: '1.25rem',
                                      fontWeight: 700,
                                      marginBottom: '0.5rem'
                                    }}>
                                      Interactive Microservices Architecture
                                    </h4>
                                    <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                                      🖱️ Click services for details • ✨ Hover for effects
                                    </p>
                                  </div>

                                  {/* Diagram Container */}
                                  <div
                                    ref={diagramContainerRef}
                                    style={{
                                      position: 'relative',
                                      width: '100%',
                                      height: '400px',
                                      background: 'rgba(15, 23, 42, 0.8)',
                                      border: '2px solid rgba(255, 140, 0, 0.2)',
                                      borderRadius: '1rem',
                                      overflow: 'hidden',
                                      marginBottom: '1.5rem'
                                    }}
                                  >
                                    {/* Service nodes */}
                                    {microservicesData.map((service, index) => (
                                      <motion.div
                                        key={service.id}
                                        className="service-node"
                                        style={{
                                          position: 'absolute',
                                          left: `${service.position.x}%`,
                                          top: `${service.position.y}%`,
                                          transform: 'translate(-50%, -50%)',
                                          borderColor: service.color,
                                          background: `linear-gradient(135deg, ${service.color}20, ${service.color}10)`
                                        }}
                                        onClick={() => handleServiceClick(service)}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{
                                          delay: index * 0.1,
                                          type: "spring",
                                          stiffness: 300
                                        }}
                                      >
                                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>
                                          <span style={{ marginRight: '0.25rem' }}>{getServiceIcon(service.type)}</span>
                                          {service.name}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                                          {service.type}
                                        </div>
                                        <div
                                          className="pulse"
                                          style={{
                                            position: 'absolute',
                                            top: '-4px',
                                            right: '-4px',
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            background: service.color
                                          }}
                                        />
                                      </motion.div>
                                    ))}

                                    {/* Connection lines */}
                                    <svg style={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '100%',
                                      pointerEvents: 'none'
                                    }}>
                                      <defs>
                                        <marker
                                          id="arrowhead"
                                          markerWidth="10"
                                          markerHeight="7"
                                          refX="10"
                                          refY="3.5"
                                          orient="auto"
                                        >
                                          <polygon points="0 0, 10 3.5, 0 7" fill="#ff8c00" />
                                        </marker>
                                        <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                          <stop offset="0%" style={{ stopColor: '#ff8c00', stopOpacity: 0.8 }} />
                                          <stop offset="100%" style={{ stopColor: '#ffd700', stopOpacity: 0.8 }} />
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
                                        className="glass-card-light"
                                        style={{ padding: '1.5rem' }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                      >
                                        <div style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          marginBottom: '1rem'
                                        }}>
                                          <h5 style={{
                                            fontSize: '1.25rem',
                                            fontWeight: 700,
                                            color: '#ff8c00',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                          }}>
                                            <span>{getServiceIcon(serviceDetails.type)}</span>
                                            {serviceDetails.name}
                                          </h5>
                                          <motion.button
                                            onClick={() => setServiceDetails(null)}
                                            style={{
                                              background: 'none',
                                              border: 'none',
                                              color: '#94a3b8',
                                              fontSize: '1.25rem',
                                              cursor: 'pointer',
                                              padding: '0.25rem'
                                            }}
                                            whileHover={{ scale: 1.1, color: '#fff' }}
                                            whileTap={{ scale: 0.9 }}
                                          >
                                            ✕
                                          </motion.button>
                                        </div>

                                        <div style={{ display: 'grid', gap: '1rem' }}>
                                          <div>
                                            <div style={{ fontWeight: 700, color: '#ff8c00', marginBottom: '0.5rem' }}>
                                              📋 Description
                                            </div>
                                            <div style={{ color: '#e2e8f0', lineHeight: 1.5 }}>
                                              {serviceDetails.description}
                                            </div>
                                          </div>

                                          <div>
                                            <div style={{ fontWeight: 700, color: '#ff8c00', marginBottom: '0.5rem' }}>
                                              🏷️ Service Type
                                            </div>
                                            <span
                                              style={{
                                                display: 'inline-block',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '1rem',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                background: `${serviceDetails.color}20`,
                                                color: serviceDetails.color,
                                                border: `1px solid ${serviceDetails.color}`
                                              }}
                                            >
                                              {serviceDetails.type.toUpperCase()}
                                            </span>
                                          </div>

                                          <div>
                                            <div style={{ fontWeight: 700, color: '#ff8c00', marginBottom: '0.5rem' }}>
                                              🔗 API Endpoints
                                            </div>
                                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                              {serviceDetails.endpoints.map((endpoint, idx) => (
                                                <span
                                                  key={idx}
                                                  style={{
                                                    display: 'inline-block',
                                                    background: 'rgba(71, 85, 105, 0.5)',
                                                    padding: '0.5rem',
                                                    borderRadius: '0.5rem',
                                                    fontSize: '0.875rem',
                                                    fontFamily: 'monospace',
                                                    color: '#e2e8f0'
                                                  }}
                                                >
                                                  {endpoint}
                                                </span>
                                              ))}
                                            </div>
                                          </div>

                                          <div>
                                            <div style={{ fontWeight: 700, color: '#ff8c00', marginBottom: '0.5rem' }}>
                                              🛠️ Technologies
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                              {serviceDetails.technologies.map((tech, idx) => (
                                                <span
                                                  key={idx}
                                                  style={{
                                                    display: 'inline-block',
                                                    background: '#3b82f6',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '0.5rem',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    color: '#fff'
                                                  }}
                                                >
                                                  {tech}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>

                                  {/* Architecture Legend */}
                                  <div className="glass-card-light" style={{ padding: '1rem' }}>
                                    <h5 style={{
                                      fontSize: '1rem',
                                      fontWeight: 700,
                                      color: '#e2e8f0',
                                      marginBottom: '1rem',
                                      textAlign: 'center'
                                    }}>
                                      🏗️ Architecture Legend
                                    </h5>
                                    <div className="grid-2" style={{ gap: '0.75rem' }}>
                                      {[
                                        { color: '#3B82F6', label: 'API Gateway', icon: '🚪' },
                                        { color: '#10B981', label: 'Core Services', icon: '⚙️' },
                                        { color: '#8B5CF6', label: 'Data Services', icon: '💾' },
                                        { color: '#F59E0B', label: 'External Services', icon: '🌐' }
                                      ].map((item, idx) => (
                                        <div
                                          key={idx}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            fontSize: '0.875rem'
                                          }}
                                        >
                                          <div
                                            style={{
                                              width: '12px',
                                              height: '12px',
                                              borderRadius: '50%',
                                              backgroundColor: item.color
                                            }}
                                          />
                                          <span>{item.icon}</span>
                                          <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{item.label}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ) : (
                              <motion.div
                                key="code"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.5 }}
                              >
                                <div className="code-block" style={{ color: '#e2e8f0' }}>
                                  <pre style={{ margin: 0 }}>
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
                  <div className="center-container" style={{ marginTop: '3rem' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                        Ready to Transform?
                      </h3>
                      <p style={{ color: '#94a3b8', maxWidth: '500px' }}>
                        Download your complete modernization package and begin your journey to the future
                      </p>
                    </div>

                    <div className="download-buttons">
                      <motion.button
                        onClick={handleDownloadMarkdown}
                        className="btn-primary"
                        style={{
                          padding: '1rem 2rem',
                          borderRadius: '1rem',
                          fontSize: '1.1rem',
                          fontWeight: 700,
                          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                          color: '#fff'
                        }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          📝 Download Markdown
                        </span>
                      </motion.button>

                      <motion.button
                        onClick={handleDownloadPDF}
                        className="btn-pdf"
                        style={{
                          padding: '1rem 2rem',
                          borderRadius: '1rem',
                          fontSize: '1.1rem',
                          fontWeight: 700
                        }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          📄 Download PDF Format
                        </span>
                      </motion.button>
                    </div>

                    <p style={{
                      marginTop: '1rem',
                      color: '#64748b',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>
                      Includes: Database Schema • REST API • JSON Data • Architecture Documentation
                    </p>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default AS400ModernizationAssistant;
