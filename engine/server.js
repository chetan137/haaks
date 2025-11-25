/*
 * AI Modernization Assistant - Backend Server
 *
 * How to run:
 * 1. cp .env.example .env (optional: add LLM_API_KEY if you have one)
 * 2. npm install
 * 3. npm start
 *
 * The server provides three main endpoints:
 * - POST /processFile - Upload and process legacy files
 * - GET /status/:jobId - Check processing status
 * - GET /result/:jobId - Get final results
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Import our modules
const logger = require('./utils/logger');
const AIClient = require('./aiClient');
const VectorStore = require('./memory/vectorStore');
const GraphStore = require('./memory/graphStore');
const MemoryManager = require('./memory/memoryManager');
const WorkflowOrchestrator = require('./orchestrator/workflowOrchestrator');
const chunker = require('./utils/chunker');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size per file
    files: 5 // Max 5 files
  },
  fileFilter: (req, file, cb) => {
    // Accept .dat, .cpy, .csv, .json files
    const allowedExtensions = ['.dat', '.cpy', '.csv', '.json', '.txt', '.cobol', '.cbl'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext) || !ext) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not supported. Allowed: ${allowedExtensions.join(', ')}`));
    }
  }
});

// Initialize AI system
let aiClient, memoryManager, orchestrator;
let jobStore = new Map(); // In-memory job storage

async function initializeAI() {
  try {
    logger.info('🚀 Initializing AI Modernization Assistant...');

    // Initialize AI client
    aiClient = new AIClient();

    // Initialize memory stores
    const vectorStore = new VectorStore();
    const graphStore = new GraphStore();
    memoryManager = new MemoryManager(vectorStore, graphStore);

    // Initialize orchestrator
    orchestrator = new WorkflowOrchestrator(aiClient, memoryManager);

    logger.info('✅ AI system initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize AI system:', error);
    throw error;
  }
}

// Route: Upload and process files (supports multiple files)
app.post('/processFile', upload.fields([
  { name: 'files', maxCount: 5 },
  { name: 'file', maxCount: 1 } // Backward compatibility
]), async (req, res) => {
  try {
    // Check for files in either 'files' array or single 'file'
    const uploadedFiles = req.files?.files || (req.files?.file ? req.files.file : (req.file ? [req.file] : []));

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({
        error: 'No files provided',
        message: 'Please upload at least one file (.cpy, .dat, .csv, .json)'
      });
    }

    const jobId = uuidv4();
    const fileInfos = uploadedFiles.map(file => ({
      path: file.path,
      originalName: file.originalname,
      size: file.size,
      extension: path.extname(file.originalname).toLowerCase()
    }));

    logger.info(`📁 File upload received: ${fileInfos.length} file(s)`);
    fileInfos.forEach(file => {
      logger.info(`  - ${file.originalName} (${file.size} bytes)`);
    });

    // Initialize job in store
    jobStore.set(jobId, {
      id: jobId,
      files: fileInfos,
      status: 'processing',
      logs: [`Job ${jobId}: ${fileInfos.length} file(s) uploaded - ${fileInfos.map(f => f.originalName).join(', ')}`],
      progress: 5,
      startTime: new Date().toISOString(),
      result: null
    });

    // Start processing asynchronously
    processMultipleFilesAsync(jobId, fileInfos);

    res.status(202).json({
      jobId,
      message: `${fileInfos.length} file(s) uploaded successfully. Processing started.`,
      files: fileInfos.map(f => ({ name: f.originalName, size: f.size }))
    });

  } catch (error) {
    logger.error('❌ File upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error.message
    });
  }
});

// Route: Get job status
app.get('/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobStore.get(jobId);

  if (!job) {
    return res.status(404).json({
      error: 'Job not found',
      jobId
    });
  }

  res.json({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    logs: job.logs,
    fileName: job.fileName,
    startTime: job.startTime,
    ...(job.endTime && { endTime: job.endTime })
  });
});

// Route: Get final result
app.get('/result/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobStore.get(jobId);

  if (!job) {
    return res.status(404).json({
      error: 'Job not found',
      jobId
    });
  }

  if (job.status !== 'completed' && job.status !== 'failed') {
    return res.status(202).json({
      message: 'Job still processing',
      status: job.status,
      progress: job.progress
    });
  }

  if (job.status === 'failed') {
    return res.status(500).json({
      error: 'Job failed',
      message: job.error || 'Processing failed',
      logs: job.logs
    });
  }

  res.json({
    jobId: job.id,
    status: job.status,
    result: job.result,
    logs: job.logs,
    processingTime: job.processingTime,
    confidence: job.confidence || 0.8
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    aiSystemReady: !!(aiClient && memoryManager && orchestrator)
  });
});

// Process file asynchronously
async function processFileAsync(jobId, filePath, originalName) {
  const job = jobStore.get(jobId);

  try {
    updateJobProgress(jobId, 10, `Job ${jobId}: Starting file analysis...`);

    // Read and chunk the file
    const chunks = await chunker.splitFileToChunks(filePath, {
      maxChunkSize: parseInt(process.env.CHUNK_SIZE) || 4000,
      overlap: parseInt(process.env.OVERLAP_SIZE) || 200
    });

    updateJobProgress(jobId, 20, `Job ${jobId}: File split into ${chunks.length} chunks`);

    // Process through orchestrator
    updateJobProgress(jobId, 30, `Job ${jobId}: Starting modernization pipeline...`);

    const workflowResult = await orchestrator.executeWorkflow({
      code: await fs.promises.readFile(filePath, 'utf8'),
      fileName: originalName,
      chunks: chunks
    }, 'full_modernization', {
      conversationId: jobId,
      targetLanguage: 'Java',
      targetFramework: 'Spring Boot'
    });

    updateJobProgress(jobId, 80, `Job ${jobId}: Pipeline completed`);

    if (workflowResult.success) {
      // Format final result
      const finalResult = {
        schema: extractSchemaFromResult(workflowResult.result),
        apiDesign: extractAPIDesignFromResult(workflowResult.result),
        dashboardData: extractDashboardDataFromResult(workflowResult.result),
        documentation: extractDocumentationFromResult(workflowResult.result),
        confidence: workflowResult.result.metadata?.confidence || 0.8
      };

      job.result = finalResult;
      job.confidence = finalResult.confidence;
      job.status = 'completed';
      job.endTime = new Date().toISOString();
      job.processingTime = Date.now() - new Date(job.startTime).getTime();

      updateJobProgress(jobId, 100, `Job ${jobId}: Processing completed successfully`);

      logger.info(`✅ Job ${jobId} completed successfully`);
    } else {
      throw new Error(workflowResult.error || 'Workflow execution failed');
    }

  } catch (error) {
    logger.error(`❌ Job ${jobId} failed:`, error);

    job.status = 'failed';
    job.error = error.message;
    job.endTime = new Date().toISOString();

    updateJobProgress(jobId, 0, `Job ${jobId}: Failed - ${error.message}`);
  } finally {
    // Clean up uploaded file after processing
    try {
      await fs.promises.unlink(filePath);
    } catch (cleanupError) {
      logger.warn(`Failed to cleanup file ${filePath}:`, cleanupError.message);
    }
  }
}

// Process multiple files asynchronously
async function processMultipleFilesAsync(jobId, fileInfos) {
  const job = jobStore.get(jobId);

  try {
    updateJobProgress(jobId, 10, `Job ${jobId}: Starting analysis of ${fileInfos.length} files...`);

    // Separate files by type
    const cpyFiles = fileInfos.filter(f => f.extension === '.cpy');
    const datFiles = fileInfos.filter(f => f.extension === '.dat');
    const otherFiles = fileInfos.filter(f => !['.cpy', '.dat'].includes(f.extension));

    logger.info(`📊 File breakdown: ${cpyFiles.length} .cpy, ${datFiles.length} .dat, ${otherFiles.length} other`);

    let combinedCode = '';
    let allChunks = [];
    let progressStep = 20;

    // Process each file and combine content
    for (const fileInfo of fileInfos) {
      updateJobProgress(jobId, progressStep, `Job ${jobId}: Processing ${fileInfo.originalName}...`);

      const fileContent = await fs.promises.readFile(fileInfo.path, 'utf8');
      combinedCode += `\n\n/* === File: ${fileInfo.originalName} === */\n${fileContent}`;

      // Chunk each file
      const chunks = await chunker.splitFileToChunks(fileInfo.path, {
        maxChunkSize: parseInt(process.env.CHUNK_SIZE) || 4000,
        overlap: parseInt(process.env.OVERLAP_SIZE) || 200
      });

      // Add file metadata to chunks
      chunks.forEach(chunk => {
        chunk.metadata = {
          ...chunk.metadata,
          sourceFile: fileInfo.originalName,
          fileType: fileInfo.extension
        };
      });

      allChunks.push(...chunks);
      progressStep += Math.floor(40 / fileInfos.length);
    }

    updateJobProgress(jobId, 60, `Job ${jobId}: Combined ${allChunks.length} chunks from ${fileInfos.length} files`);

    // Process through orchestrator with combined data
    updateJobProgress(jobId, 65, `Job ${jobId}: Starting modernization pipeline...`);

    const workflowInput = {
      code: combinedCode,
      fileName: fileInfos.map(f => f.originalName).join(', '),
      chunks: allChunks,
      fileTypes: {
        copybooks: cpyFiles.map(f => f.originalName),
        dataFiles: datFiles.map(f => f.originalName),
        otherFiles: otherFiles.map(f => f.originalName)
      },
      multiFile: true
    };

    const workflowResult = await orchestrator.executeWorkflow(
      workflowInput,
      'full_modernization',
      {
        conversationId: jobId,
        targetLanguage: 'Java',
        targetFramework: 'Spring Boot',
        multiFile: true
      }
    );

    updateJobProgress(jobId, 85, `Job ${jobId}: Pipeline completed`);

    if (workflowResult.success) {
      // Format final result with enhanced multi-file data
      const finalResult = {
        schema: extractSchemaFromResult(workflowResult.result),
        apiDesign: extractAPIDesignFromResult(workflowResult.result),
        dashboardData: {
          ...extractDashboardDataFromResult(workflowResult.result),
          fileCount: fileInfos.length,
          fileTypes: {
            copybooks: cpyFiles.length,
            dataFiles: datFiles.length,
            otherFiles: otherFiles.length
          },
          totalSize: fileInfos.reduce((sum, f) => sum + f.size, 0)
        },
        documentation: extractDocumentationFromResult(workflowResult.result),
        confidence: workflowResult.result.metadata?.confidence || 0.8,
        processedFiles: fileInfos.map(f => ({
          name: f.originalName,
          type: f.extension,
          size: f.size
        }))
      };

      job.result = finalResult;
      job.confidence = finalResult.confidence;
      job.status = 'completed';
      job.endTime = new Date().toISOString();
      job.processingTime = Date.now() - new Date(job.startTime).getTime();

      updateJobProgress(jobId, 100, `Job ${jobId}: Processing completed successfully`);

      logger.info(`✅ Job ${jobId} completed successfully - processed ${fileInfos.length} files`);
      console.log('\n' + '='.repeat(80));
      console.log('🎉 all agent geting result now we can se the result');
      console.log('='.repeat(80) + '\n');
    } else {
      throw new Error(workflowResult.error || 'Workflow execution failed');
    }

  } catch (error) {
    logger.error(`❌ Job ${jobId} failed:`, error);

    job.status = 'failed';
    job.error = error.message;
    job.endTime = new Date().toISOString();

    updateJobProgress(jobId, 0, `Job ${jobId}: Failed - ${error.message}`);
  } finally {
    // Clean up uploaded files after processing
    for (const fileInfo of fileInfos) {
      try {
        await fs.promises.unlink(fileInfo.path);
      } catch (cleanupError) {
        logger.warn(`Failed to cleanup file ${fileInfo.path}:`, cleanupError.message);
      }
    }
  }
}

function updateJobProgress(jobId, progress, message) {
  const job = jobStore.get(jobId);
  if (job) {
    job.progress = progress;
    job.logs.push(`${new Date().toISOString()}: ${message}`);
    logger.info(message);
  }
}

// Helper functions to extract structured results
function extractSchemaFromResult(result) {
  console.log('\n📊 [EXTRACTION] Extracting schema from result...');

  // Try to parse from modernization SQL
  if (result.data?.modernization?.data) {
    const modernizationData = result.data.modernization.data;
    console.log('✅ Found modernization data:', JSON.stringify(modernizationData).substring(0, 200));

    // Check if data is a JSON string that needs parsing
    let parsedData = modernizationData;
    if (typeof modernizationData === 'string') {
      try {
        parsedData = JSON.parse(modernizationData);
        console.log('✅ Parsed JSON string to object');
      } catch (e) {
        console.log('⚠️  modernization data is string but not JSON, using as is');
      }
    }

    // Extract SQL and parse it to generate schema
    const sql = parsedData.sql || '';
    if (sql) {
      console.log('✅ Found SQL schema:', sql.substring(0, 100) + '...');
      return parseSQLToSchema(sql);
    }
  }

  // Try to parse from parsing data
  if (result.data?.parsing?.data) {
    const parsingData = result.data.parsing.data;
    console.log ('✅ Found parsing data');

    // Check if data is a JSON string
    let parsedData = parsingData;
    if (typeof parsingData === 'string') {
      try {
        parsedData = JSON.parse(parsingData);
      } catch (e) {
        console.log('⚠️  Could not parse parsing data as JSON');
      }
    }

    return {
      tables: parsedData.dataStructures || [],
      relationships: parsedData.dependencies || []
    };
  }

  console.log('❌ No schema data found, returning empty schema');
  return { tables: [], relationships: [] };
}

function extractAPIDesignFromResult(result) {
  console.log('\n🔗 [EXTRACTION] Extracting API design from result...');

  if (result.data?.modernization?.data) {
    console.log('✅ Found modernization data for API extraction');
    const modernizationData = result.data.modernization.data;

    // Check if data is a JSON string that needs parsing
    let parsedData = modernizationData;
    if (typeof modernizationData === 'string') {
      try {
        parsedData = JSON.parse(modernizationData);
        console.log('✅ Parsed modernization JSON string');
      } catch (e) {
        console.log('⚠️  Could not parse modernization data as JSON');
      }
    }

    const apiDesign = {
      endpoints: parsedData.endpoints || [],
      models: parsedData.models || [],
      security: parsedData.security || {},
      architecture: parsedData.architecture || {}
    };

    console.log(`✅ Extracted API design: ${apiDesign.endpoints.length} endpoints, ${apiDesign.models.length} models`);
    return apiDesign;
  }

  console.log('❌ No API design data found, returning empty API design');
  return { endpoints: [], models: [], security: {}, architecture: {} };
}

function extractDashboardDataFromResult(result) {
  console.log('\n📈 [EXTRACTION] Extracting dashboard data from result...');

  const dashboardData = {
    complexity: result.data?.parsing?.data?.qualityMetrics?.complexity || 'medium',
    confidence: result.metadata?.confidence || 0.8,
    linesOfCode: result.data?.parsing?.data?.programInfo?.lineCount || 0,
    dependencies: (result.data?.parsing?.data?.dependencies || []).length,
    validationScore: result.data?.validation?.data?.validation?.overallScore || 75
  };

  console.log('✅ Extracted dashboard data:', JSON.stringify(dashboardData));
  return dashboardData;
}

// Helper function to parse SQL into schema tables
function parseSQLToSchema(sql) {
  console.log('🔍 Parsing SQL to extract tables...');
  const tables = [];

  // Match CREATE TABLE statements
  const tableRegex = /CREATE TABLE (\w+)\s*\((.*?)\);/gis;
  let match;

  while ((match = tableRegex.exec(sql)) !== null) {
    const tableName = match[1];
    const columnsDef = match[2];

    console.log(`  Found table: ${tableName}`);

    // Parse columns
    const columns = [];
    const relationships = [];
    const columnLines = columnsDef.split(',').map(c => c.trim());

    for (const line of columnLines) {
      // Skip FOREIGN KEY constraints for now (we'll parse them separately)
      if (line.toUpperCase().includes('FOREIGN KEY')) {
        // Extract FK relationship
        const fkMatch = line.match(/FOREIGN KEY \((\w+)\) REFERENCES (\w+)\((\w+)\)/i);
        if (fkMatch) {
          relationships.push({
            fromColumn: fkMatch[1],
            toTable: fkMatch[2],
            toColumn: fkMatch[3]
          });
        }
        continue;
      }

      // Parse column definition
      const colMatch = line.match(/(\w+)\s+([A-Z]+[A-Z0-9()\s,]*)/i);
      if (colMatch) {
        const columnName = colMatch[1];
        const columnType = colMatch[2].split(/\s/)[0];

        columns.push({
          name: columnName,
          type: columnType,
          isPrimary: line.toUpperCase().includes('PRIMARY KEY'),
          isNotNull: line.toUpperCase().includes('NOT NULL'),
          isUnique: line.toUpperCase().includes('UNIQUE'),
          hasDefault: line.toUpperCase().includes('DEFAULT')
        });
      }
    }

    tables.push({
      name: tableName,
      columns,
      relationships
    });
  }

  console.log(`✅ Parsed ${tables.length} tables from SQL`);
  return { tables, relationships: [] };
}

function extractDocumentationFromResult(result) {
  if (result.data?.explanation?.data) {
    return {
      summary: result.data.explanation.data.summary || 'Modernization analysis completed',
      technicalDetails: result.data.explanation.data.technicalDetails || 'See detailed analysis',
      migrationPlan: result.data.explanation.data.migrationPlan || 'Review generated API design',
      risks: result.data.explanation.data.risks || []
    };
  }
  return {
    summary: 'File processed successfully',
    technicalDetails: 'Legacy code analyzed and modern alternatives proposed',
    migrationPlan: 'Review the generated schema and API design',
    risks: ['Manual review recommended', 'Test thoroughly before deployment']
  };
}

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('❌ Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    available: [
      'POST /processFile',
      'GET /status/:jobId',
      'GET /result/:jobId',
      'GET /health'
    ]
  });
});

// Start server
async function startServer() {
  try {
    await initializeAI();

    app.listen(PORT, () => {
      logger.info(`🌟 AI Modernization Assistant server running on port ${PORT}`);
      logger.info(`📁 Upload directory: ${uploadDir}`);
      logger.info(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🤖 AI Provider: ${process.env.AI_PROVIDER || 'gemini'}`);
      logger.info(`🔑 API Key configured: ${!!process.env.GEMINI_API_KEY}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('🔄 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('🔄 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

startServer();
