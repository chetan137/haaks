const axios = require('axios');
const logger = require('./utils/logger');

class AIClient {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'gemini';
    this.apiKey = process.env.GEMINI_API_KEY;
    this.maxTokens = 4000;
    this.mockMode = !this.apiKey; // Enable mocking if no API key

    // Gemini API configuration
    this.geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent?key=${this.apiKey}`;

    logger.info('🤖 AI Client initialized', {
      provider: this.provider,
      mockMode: this.mockMode,
      hasApiKey: !!this.apiKey
    });
  }

  async generateContent(prompt, options = {}) {
    const {
      temperature = 0.7,
      maxTokens = this.maxTokens,
      maxOutputTokens = this.maxTokens,
      systemPrompt = '',
      retries = 3
    } = options;

    // Use maxOutputTokens if provided, otherwise fall back to maxTokens
    const effectiveMaxTokens = maxOutputTokens || maxTokens;

    try {
      // ========== AI REQUEST LOGGING ==========
      console.log('\n' + '▼'.repeat(80));
      console.log(`🤖 AI CLIENT - GENERATING CONTENT`);
      console.log('▼'.repeat(80));
      console.log(`🔧 PROVIDER: ${this.provider} ${this.mockMode ? '(MOCK MODE)' : '(LIVE)'}`);
      console.log(`🌡️  TEMPERATURE: ${temperature}`);
      console.log(`📏 MAX TOKENS: ${effectiveMaxTokens}`);
      console.log(`\n📝 SYSTEM PROMPT:`);
      console.log(systemPrompt.substring(0, 300) + (systemPrompt.length > 300 ? '...' : ''));
      console.log(`\n💬 USER PROMPT:`);
      console.log(prompt.substring(0, 500) + (prompt.length > 500 ? '...' : ''));
      console.log('▼'.repeat(80) + '\n');

      logger.info('🤖 Generating AI content', {
        provider: this.provider,
        mockMode: this.mockMode,
        promptLength: prompt.length,
        temperature,
        maxTokens: effectiveMaxTokens
      });

      // Use mock responses if no API key is available
      if (this.mockMode) {
        const response = await this.generateMockResponse(prompt, systemPrompt, options);

        // ========== AI RESPONSE LOGGING ==========
        console.log('\n' + '▲'.repeat(80));
        console.log(`✅ AI CLIENT - RESPONSE RECEIVED (MOCK)`);
        console.log('▲'.repeat(80));
        console.log(`📤 RESPONSE LENGTH: ${response.length} characters`);
        console.log(`\n📄 RESPONSE PREVIEW:`);
        console.log(response.substring(0, 500) + (response.length > 500 ? '...' : ''));
        console.log('▲'.repeat(80) + '\n');

        return response;
      }

      if (this.provider === 'gemini') {
        const response = await this.callGemini(prompt, systemPrompt, temperature, effectiveMaxTokens);

        // ========== AI RESPONSE LOGGING ==========
        console.log('\n' + '▲'.repeat(80));
        console.log(`✅ AI CLIENT - RESPONSE RECEIVED (GEMINI)`);
        console.log('▲'.repeat(80));
        console.log(`📤 RESPONSE LENGTH: ${response.length} characters`);
        console.log(`\n📄 RESPONSE PREVIEW:`);
        console.log(response.substring(0, 500) + (response.length > 500 ? '...' : ''));
        console.log('▲'.repeat(80) + '\n');

        return response;
      } else {
        throw new Error(`Unsupported AI provider: ${this.provider}`);
      }
    } catch (error) {
      console.log('\n' + '❌'.repeat(40));
      console.log(`🚨 AI CLIENT - ERROR`);
      console.log('❌'.repeat(40));
      console.log(`ERROR: ${error.message}`);
      console.log('❌'.repeat(40) + '\n');

      logger.error('❌ AI generation failed', { error: error.message });

      // Fallback to mock response if real API fails
      if (!this.mockMode) {
        logger.warn('🔄 Falling back to mock response due to API failure');
        console.log('🔄 Falling back to MOCK response...\n');
        return await this.generateMockResponse(prompt, systemPrompt, options);
      }

      throw error;
    }
  }

  async callGemini(prompt, systemPrompt, temperature, maxTokens = this.maxTokens) {
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

    const requestBody = {
      contents: [{
        parts: [{ text: fullPrompt }]
      }],
      generationConfig: {
        temperature,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: maxTokens,
      }
    };

    try {
      const response = await axios.post(this.geminiUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 180000 // Increased to 3 minutes for slower models
      });

      if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const content = response.data.candidates[0].content.parts[0].text;
        logger.info('✅ AI content generated successfully', {
          responseLength: content.length
        });
        return content;
      } else {
        throw new Error('Invalid response from Gemini API');
      }
    } catch (error) {
      // Enhanced error handling for different HTTP status codes
      if (error.response) {
        const status = error.response.status;
        const statusText = error.response.statusText;

        switch (status) {
          case 400:
            throw new Error(`Bad Request (400): Invalid request format or parameters - ${statusText}`);
          case 401:
            throw new Error(`Unauthorized (401): Invalid or missing API key - ${statusText}`);
          case 403:
            throw new Error(`Forbidden (403): API key lacks necessary permissions - ${statusText}`);
          case 404:
            throw new Error(`Not Found (404): Incorrect API endpoint URL - ${statusText}`);
          case 429:
            throw new Error(`Rate Limited (429): Too many requests, please try again later - ${statusText}`);
          case 500:
            throw new Error(`Server Error (500): Gemini API internal error - ${statusText}`);
          case 503:
            throw new Error(`Service Unavailable (503): Gemini API temporarily unavailable - ${statusText}`);
          default:
            throw new Error(`HTTP Error (${status}): ${statusText} - ${error.message}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout: Gemini API did not respond within 30 seconds');
      } else if (error.code === 'ENOTFOUND') {
        throw new Error('Network error: Unable to reach Gemini API endpoint');
      } else {
        throw new Error(`API call failed: ${error.message}`);
      }
    }
  }

  async generateEmbedding(text) {
    try {
      // Simple text embedding using TF-IDF-like approach
      // In production, you use a proper embedding model
      const words = text.toLowerCase().match(/\b\w+\b/g) || [];
      const wordFreq = {};

      words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      });

      // Create a consistent 1536-dimensional embedding vector
      const VECTOR_DIMENSION = 1536;
      const embedding = new Array(VECTOR_DIMENSION).fill(0);

      // Distribute word frequencies across the vector space
      const wordEntries = Object.entries(wordFreq);

      for (let i = 0; i < wordEntries.length; i++) {
        const [word, freq] = wordEntries[i];

        // Use hash-like distribution to spread words across dimensions
        for (let j = 0; j < word.length; j++) {
          const charCode = word.charCodeAt(j);
          const dimension = (charCode + i * 37 + j * 23) % VECTOR_DIMENSION;
          embedding[dimension] += (freq / words.length) * 0.1;
        }
      }

      // Normalize the vector to unit length for better similarity calculations
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      if (magnitude > 0) {
        for (let i = 0; i < embedding.length; i++) {
          embedding[i] = embedding[i] / magnitude;
        }
      }

      // Ensure exactly 1536 dimensions
      if (embedding.length !== VECTOR_DIMENSION) {
        throw new Error(`Embedding dimension mismatch: expected ${VECTOR_DIMENSION}, got ${embedding.length}`);
      }

      logger.info('✅ Embedding generated', {
        textLength: text.length,
        vectorLength: embedding.length,
        nonZeroValues: embedding.filter(v => v !== 0).length
      });

      return embedding;
    } catch (error) {
      logger.error('❌ Embedding generation failed', { error: error.message });
      throw error;
    }
  }

  async batchGenerate(prompts, options = {}) {
    const results = [];

    for (let i = 0; i < prompts.length; i++) {
      try {
        const result = await this.generateContent(prompts[i], options);
        results.push({ success: true, data: result, index: i });

        // Rate limiting
        if (i < prompts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        results.push({ success: false, error: error.message, index: i });
      }
    }

    return results;
  }

  // Confidence scoring based on response consistency
  async getConfidenceScore(prompt, iterations = 3) {
    try {
      const responses = await this.batchGenerate(
        Array(iterations).fill(prompt),
        { temperature: 0.3 }
      );

      const successfulResponses = responses.filter(r => r.success);
      if (successfulResponses.length === 0) return 0;

      // Simple confidence based on consistency
      const texts = successfulResponses.map(r => r.data);
      const similarities = [];

      for (let i = 0; i < texts.length; i++) {
        for (let j = i + 1; j < texts.length; j++) {
          const similarity = this.calculateSimilarity(texts[i], texts[j]);
          similarities.push(similarity);
        }
      }

      const avgSimilarity = similarities.length > 0
        ? similarities.reduce((a, b) => a + b, 0) / similarities.length
        : 0;

      return Math.min(avgSimilarity * (successfulResponses.length / iterations), 1);
    } catch (error) {
      logger.error('❌ Confidence scoring failed', { error: error.message });
      return 0;
    }
  }

  calculateSimilarity(text1, text2) {
    const words1 = new Set(text1.toLowerCase().match(/\b\w+\b/g) || []);
    const words2 = new Set(text2.toLowerCase().match(/\b\w+\b/g) || []);

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Generate mock responses for demo purposes when no API key is available
   */
  async generateMockResponse(prompt, systemPrompt = '', options = {}) {
    // Add a small delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    const promptLower = prompt.toLowerCase();
    const systemLower = systemPrompt.toLowerCase();

    logger.info('🎭 Generating mock response', {
      promptType: this.detectPromptType(prompt, systemPrompt),
      promptLength: prompt.length
    });

    // Detect the type of request and return appropriate mock
    if (systemLower.includes('parseragent') || promptLower.includes('cobol') || promptLower.includes('analyze')) {
      return this.getMockParserResponse();
    }

    if (systemLower.includes('modernizeragent') || promptLower.includes('modernize') || promptLower.includes('convert')) {
      return this.getMockModernizerResponse();
    }

    if (systemLower.includes('validatoragent') || promptLower.includes('validate') || promptLower.includes('check')) {
      return this.getMockValidatorResponse();
    }

    if (systemLower.includes('explaineragent') || promptLower.includes('explain') || promptLower.includes('documentation')) {
      return this.getMockExplainerResponse();
    }

    // Default generic response
    return this.getMockGenericResponse();
  }

  detectPromptType(prompt, systemPrompt) {
    const combined = (prompt + ' ' + systemPrompt).toLowerCase();

    if (combined.includes('parse') || combined.includes('analyze')) return 'parser';
    if (combined.includes('modernize') || combined.includes('convert')) return 'modernizer';
    if (combined.includes('validate') || combined.includes('check')) return 'validator';
    if (combined.includes('explain') || combined.includes('document')) return 'explainer';
    return 'generic';
  }

  getMockParserResponse() {
    return JSON.stringify({
      programInfo: {
        name: "SAMPLE_PROGRAM",
        type: "batch_program",
        language: "COBOL",
        lineCount: 450
      },
      dependencies: [
        {
          name: "COPYLIB1",
          type: "COPY",
          location: "line 25"
        },
        {
          name: "SUBPROG1",
          type: "CALL",
          location: "line 180"
        }
      ],
      dataStructures: [
        {
          name: "WS-CUSTOMER-REC",
          type: "01-level",
          fields: ["CUST-ID", "CUST-NAME", "CUST-ADDR"],
          usage: "working-storage"
        },
        {
          name: "CUSTOMER-FILE",
          type: "file",
          fields: ["CUST-RECORD"],
          usage: "file"
        }
      ],
      businessLogic: [
        {
          section: "MAIN-PROCESS",
          purpose: "Process customer records and generate reports",
          complexity: "medium",
          modernizationOpportunity: "Convert to REST API for customer management"
        },
        {
          section: "VALIDATION-ROUTINE",
          purpose: "Validate customer data integrity",
          complexity: "low",
          modernizationOpportunity: "Implement as microservice with validation rules"
        }
      ],
      ioOperations: [
        {
          type: "file",
          operation: "read",
          target: "CUSTOMER-FILE",
          location: "line 120"
        },
        {
          type: "file",
          operation: "write",
          target: "REPORT-FILE",
          location: "line 300"
        }
      ],
      qualityMetrics: {
        complexity: "medium",
        maintainability: "medium",
        testability: "low",
        modernizationPriority: "high"
      }
    }, null, 2);
  }

  getMockModernizerResponse() {
    return JSON.stringify({
      sql: `CREATE TABLE customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id VARCHAR(20) UNIQUE NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE customer_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id VARCHAR(20),
  report_date DATE,
  report_data JSON,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);`,
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
    }, null, 2);
  }

  getMockValidatorResponse() {
    return JSON.stringify({
      validation: {
        valid: true,
        errors: [],
        warnings: [
          "Consider adding indexes for better performance",
          "Some field names could be more descriptive"
        ],
        overallScore: 82,
        details: {
          syntaxScore: 95,
          securityScore: 78,
          performanceScore: 75,
          maintainabilityScore: 80
        }
      },
      recommendations: [
        "Add composite index on (customer_id, report_date)",
        "Implement field-level validation",
        "Consider using UUIDs for better distributed system compatibility"
      ]
    }, null, 2);
  }

  getMockExplainerResponse() {
    return JSON.stringify({
      summary: "This legacy COBOL program processes customer records in batch mode, reading from flat files and generating reports. The modernization approach converts it to a REST API-based microservice architecture with proper database normalization.",
      technicalDetails: {
        originalArchitecture: "Monolithic batch processing with flat file I/O",
        modernArchitecture: "Microservices with REST APIs and relational database",
        keyChanges: [
          "File-based processing → Database transactions",
          "Batch operations → Real-time API calls",
          "Procedural logic → Object-oriented design",
          "Fixed-length records → Flexible JSON data"
        ]
      },
      migrationPlan: [
        {
          phase: "Phase 1 - Data Migration",
          duration: "2-3 weeks",
          tasks: [
            "Set up MySQL database",
            "Create database schema",
            "Migrate existing flat file data",
            "Validate data integrity"
          ]
        },
        {
          phase: "Phase 2 - API Development",
          duration: "4-6 weeks",
          tasks: [
            "Develop Spring Boot microservice",
            "Implement CRUD operations",
            "Add authentication and authorization",
            "Create automated tests"
          ]
        },
        {
          phase: "Phase 3 - Integration",
          duration: "2-3 weeks",
          tasks: [
            "Deploy to staging environment",
            "Perform integration testing",
            "Update client applications",
            "Monitor performance"
          ]
        }
      ],
      risks: [
        "Data loss during migration",
        "Performance degradation during transition",
        "Learning curve for development team",
        "Integration challenges with existing systems"
      ],
      recommendations: [
        "Implement comprehensive testing strategy",
        "Plan for gradual rollout with feature flags",
        "Provide training for development and operations teams",
        "Establish monitoring and alerting for the new system"
      ],
      estimatedEffort: {
        totalWeeks: "8-12 weeks",
        teamSize: "3-4 developers",
        complexity: "Medium",
        confidence: "High"
      }
    }, null, 2);
  }

  getMockGenericResponse() {
    return JSON.stringify({
      status: "completed",
      result: "Analysis completed successfully using mock AI service",
      confidence: 0.75,
      note: "This is a mock response generated for demo purposes. Connect a real AI service for production use.",
      timestamp: new Date().toISOString()
    }, null, 2);
  }
}

module.exports = AIClient;
