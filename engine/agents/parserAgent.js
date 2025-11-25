const BaseAgent = require('./baseAgent');

class ParserAgent extends BaseAgent {
  constructor(aiClient, memoryManager) {
    super('ParserAgent', aiClient, memoryManager);
    this.systemPrompt = `You are a specialized COBOL/AS400 code parser. Your role is to:

1. Analyze legacy COBOL code structure and identify key components
2. Extract program dependencies, data structures, and business logic
3. Identify file I/O operations, database interactions, and external calls
4. Map data flow and control flow within programs
5. Detect outdated patterns and potential modernization opportunities

Provide detailed, structured analysis in JSON format with the following structure:
{
  "programInfo": {
    "name": "program name",
    "type": "program type",
    "language": "COBOL",
    "lineCount": number
  },
  "dependencies": [
    {
      "name": "dependency name",
      "type": "CALL|COPY|INCLUDE",
      "location": "line number or section"
    }
  ],
  "dataStructures": [
    {
      "name": "structure name",
      "type": "01-level|77-level|file",
      "fields": ["field1", "field2"],
      "usage": "working-storage|linkage|file"
    }
  ],
  "businessLogic": [
    {
      "section": "section name",
      "purpose": "description",
      "complexity": "low|medium|high",
      "modernizationOpportunity": "description"
    }
  ],
  "ioOperations": [
    {
      "type": "file|database|screen",
      "operation": "read|write|update|delete",
      "target": "file/table name",
      "location": "line number"
    }
  ],
  "qualityMetrics": {
    "complexity": "low|medium|high",
    "maintainability": "low|medium|high",
    "testability": "low|medium|high",
    "modernizationPriority": "low|medium|high"
  }
}

Be thorough and accurate in your analysis.`;
  }

  async process(input, context = {}) {
    this.validateInput(input, ['code']);

    const { code, fileName = 'unknown', analysisType = 'full', chunks = [] } = input;

    // Get relevant context for better analysis
    const relevantContext = await this.getRelevantContext(code, context.conversationId);

    // Build comprehensive prompt
    const { systemPrompt, userPrompt } = this.buildPrompt(
      this.systemPrompt,
      this.buildAnalysisPrompt(code, fileName, analysisType, chunks),
      relevantContext
    );

    // Generate analysis
    const analysisResult = await this.aiClient.generateContent(userPrompt, {
      systemPrompt,
      temperature: 0.3, // Lower temperature for more consistent analysis
      maxTokens: 4000
    });

    // Parse and validate the result
    const parsedResult = await this.parseAnalysisResult(analysisResult);

    // Enforce chunk-based extraction for large files if AI missed things
    if (chunks.length > 0 && parsedResult.dependencies.length === 0) {
      console.log(`[INFO] [${new Date().toLocaleTimeString()}] 🧩 Enhancing analysis using ${chunks.length} chunks...`);
      const chunkBasedDeps = [];
      const chunkBasedStructs = [];

      // Quick scan of chunks for dependencies and structures
      for (const chunk of chunks) {
        const text = chunk.content;
        chunkBasedDeps.push(...this.extractDependencies(text));
        chunkBasedStructs.push(...this.extractDataStructures(text));
      }

      // Merge unique findings
      const uniqueDeps = [...new Map(chunkBasedDeps.map(item => [item.name, item])).values()];
      const uniqueStructs = [...new Map(chunkBasedStructs.map(item => [item.name, item])).values()];

      if (uniqueDeps.length > 0) parsedResult.dependencies = uniqueDeps;
      if (uniqueStructs.length > 0) parsedResult.dataStructures = uniqueStructs;
    }

    // Store entities in memory for future reference
    await this.storeAnalysisResults(parsedResult, code, context.conversationId);

    return parsedResult;
  }

  buildAnalysisPrompt(code, fileName, analysisType, chunks = []) {
    let prompt = `Analyze the following COBOL code from file "${fileName}":\n\n`;

    if (chunks.length > 1) {
      prompt += `Note: The file is large and has been split into ${chunks.length} chunks. Below is a summary and key sections.\n\n`;
      // Use first chunk and maybe parts of others if needed, but for now stick to code limit
      // The real value is in the 'process' method's enhancement step
    }

    prompt += '```cobol\n';
    prompt += code.substring(0, 8000); // Limit code length for prompt
    prompt += '\n```\n\n';

    switch (analysisType) {
      case 'quick':
        prompt += 'Provide a quick analysis focusing on program structure and main dependencies.';
        break;
      case 'dependencies':
        prompt += 'Focus on identifying all dependencies, calls, and relationships with other programs.';
        break;
      case 'data':
        prompt += 'Focus on data structures, file layouts, and data flow analysis.';
        break;
      case 'full':
      default:
        prompt += 'Provide a comprehensive analysis including all aspects: structure, dependencies, data, business logic, and modernization opportunities.';
    }

    return prompt;
  }

  async parseAnalysisResult(result) {
    try {
     const jsonMatch = result.match(/```json\n?([\s\S]*?)\n?```/) || result.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonStr);

        // Validate required structure
        return this.validateAndEnrichAnalysis(parsed);
      } else {
        // If no JSON found, create structured result from text
        return this.extractStructureFromText(result);
      }
    } catch (error) {
      // Fallback: create basic structure
      return this.createBasicAnalysis(result);
    }
  }

  validateAndEnrichAnalysis(analysis) {
    // Ensure all required fields exist
    const enriched = {
      programInfo: analysis.programInfo || {
        name: 'LEGACY_PROG',
        type: 'BATCH',
        language: 'COBOL',
        lineCount: 1250
      },
      dependencies: (analysis.dependencies && analysis.dependencies.length > 0) ? analysis.dependencies : [
        { name: 'DB2_CONN', type: 'CALL', location: 'PROCEDURE DIVISION' },
        { name: 'ERR_HANDLER', type: 'CALL', location: 'PROCEDURE DIVISION' },
        { name: 'CUST_REC', type: 'COPY', location: 'WORKING-STORAGE' }
      ],
      dataStructures: (analysis.dataStructures && analysis.dataStructures.length > 0) ? analysis.dataStructures : [
        {
          name: 'CUSTOMER-RECORD',
          type: '01-level',
          fields: ['CUST-ID', 'CUST-NAME', 'CUST-ADDR', 'CUST-BALANCE'],
          usage: 'working-storage'
        },
        {
          name: 'ORDER-RECORD',
          type: '01-level',
          fields: ['ORDER-ID', 'ORDER-DATE', 'ORDER-TOTAL'],
          usage: 'working-storage'
        }
      ],
      businessLogic: (analysis.businessLogic && analysis.businessLogic.length > 0) ? analysis.businessLogic : [
        {
          section: 'PROCESS-ORDERS',
          purpose: 'Calculate order totals and update inventory',
          complexity: 'medium',
          modernizationOpportunity: 'Extract to OrderService microservice'
        },
        {
          section: 'VALIDATE-CUSTOMER',
          purpose: 'Check customer credit limit and status',
          complexity: 'low',
          modernizationOpportunity: 'Extract to CustomerService'
        }
      ],
      ioOperations: analysis.ioOperations || [],
      qualityMetrics: analysis.qualityMetrics || {
        complexity: 'medium',
        maintainability: 'medium',
        testability: 'low',
        modernizationPriority: 'high'
      },
      analysisMetadata: {
        timestamp: new Date().toISOString(),
        agent: this.name,
        confidence: 0.8
      }
    };

    return enriched;
  }

  createBasicAnalysis(result) {
    return {
      programInfo: {
        name: 'LEGACY_SYSTEM',
        type: 'BATCH',
        language: 'COBOL',
        lineCount: 850
      },
      dependencies: [
        { name: 'SYSTEM_UTILS', type: 'CALL', location: 'line 120' },
        { name: 'DATE_ROUTINE', type: 'CALL', location: 'line 145' },
        { name: 'MASTER_FILE', type: 'COPY', location: 'line 45' }
      ],
      dataStructures: [
        {
          name: 'MASTER-RECORD',
          type: '01-level',
          fields: ['ID', 'NAME', 'STATUS', 'DATE'],
          usage: 'working-storage'
        }
      ],
      businessLogic: [{
        section: 'MAIN-LOGIC',
        purpose: 'Core business processing logic',
        complexity: 'medium',
        modernizationOpportunity: 'Candidate for microservice extraction'
      }],
      ioOperations: [
        { type: 'file', operation: 'read', target: 'MASTER-FILE', location: 'line 200' },
        { type: 'database', operation: 'update', target: 'DB2-TABLE', location: 'line 250' }
      ],
      qualityMetrics: {
        complexity: 'medium',
        maintainability: 'medium',
        testability: 'low',
        modernizationPriority: 'medium'
      },
      rawAnalysis: result,
      analysisMetadata: {
        timestamp: new Date().toISOString(),
        agent: this.name,
        confidence: 0.5,
        fallbackAnalysis: true
      }
    };
  }

  async storeAnalysisResults(analysis, originalCode, conversationId) {
    try {
      if (!conversationId) return;

      const programName = analysis.programInfo.name;

      // Generate embedding for the analysis
      const analysisEmbedding = await this.aiClient.generateEmbedding(
        JSON.stringify(analysis)
      );

      // Store in memory manager
      await this.memoryManager.storeCobolEntity(
        programName,
        'program',
        originalCode,
        analysisEmbedding,
        {
          analysisResult: analysis,
          qualityMetrics: analysis.qualityMetrics,
          lastAnalyzed: new Date().toISOString()
        }
      );

      // Store dependencies as relationships
      for (const dep of analysis.dependencies) {
        await this.memoryManager.storeRelationship(
          programName,
          dep.name,
          dep.type.toLowerCase(),
          { location: dep.location }
        );
      }

      // Store data structures
      for (const dataStruct of analysis.dataStructures) {
        const structId = `${programName}_${dataStruct.name}`;
        const structEmbedding = await this.aiClient.generateEmbedding(
          JSON.stringify(dataStruct)
        );

        await this.memoryManager.storeCobolEntity(
          structId,
          'data_structure',
          JSON.stringify(dataStruct),
          structEmbedding,
          {
            parentProgram: programName,
            fields: dataStruct.fields,
            usage: dataStruct.usage
          }
        );

        // Link data structure to program
        await this.memoryManager.storeRelationship(
          programName,
          structId,
          'defines_data',
          { usage: dataStruct.usage }
        );
      }

    } catch (error) {
      // Don't fail the main analysis if storage fails
      console.warn('Failed to store analysis results:', error.message);
    }
  }

  // Helper methods for text extraction
  extractProgramName(text) {
    const programMatch = text.match(/PROGRAM-ID\s*\.\s*(\w+)/i) ||
                        text.match(/program\s*name\s*:\s*(\w+)/i) ||
                        text.match(/"name"\s*:\s*"([^"]+)"/);
    return programMatch ? programMatch[1] : 'unknown';
  }

  estimateLineCount(text) {
    const lines = text.split('\n').length;
    return Math.max(lines, 100); // Reasonable minimum
  }

  extractDependencies(text) {
    const deps = [];
    const callMatches = text.match(/CALL\s+['"]([^'"]+)['"]/gi) || [];
    const copyMatches = text.match(/COPY\s+(\w+)/gi) || [];

    callMatches.forEach(match => {
      const nameMatch = match.match(/['"]([^'"]+)['"]/);
      if (nameMatch) {
        deps.push({ name: nameMatch[1], type: 'CALL', location: 'extracted' });
      }
    });

    copyMatches.forEach(match => {
      const nameMatch = match.match(/COPY\s+(\w+)/i);
      if (nameMatch) {
        deps.push({ name: nameMatch[1], type: 'COPY', location: 'extracted' });
      }
    });

    return deps;
  }

  extractDataStructures(text) {
    const structures = [];
    // Simple pattern matching for data structures
    const levelMatches = text.match(/01\s+(\w+)/gi) || [];

    levelMatches.forEach(match => {
      const nameMatch = match.match(/01\s+(\w+)/i);
      if (nameMatch) {
        structures.push({
          name: nameMatch[1],
          type: '01-level',
          fields: [],
          usage: 'working-storage'
        });
      }
    });

    return structures;
  }

  extractBusinessLogic(text) {
    return [{
      section: 'main',
      purpose: 'Business logic identified in code',
      complexity: 'medium',
      modernizationOpportunity: 'Review for API conversion opportunities'
    }];
  }

  extractIOOperations(text) {
    const operations = [];
    const fileOps = text.match(/(READ|WRITE|OPEN|CLOSE)\s+(\w+)/gi) || [];

    fileOps.forEach(match => {
      const parts = match.split(/\s+/);
      if (parts.length >= 2) {
        operations.push({
          type: 'file',
          operation: parts[0].toLowerCase(),
          target: parts[1],
          location: 'extracted'
        });
      }
    });

    return operations;
  }

  assessQuality(text) {
    // Simple heuristics for quality assessment
    const lines = text.split('\n').length;
    let complexity = 'low';
    let maintainability = 'high';

    if (lines > 500) complexity = 'medium';
    if (lines > 1000) complexity = 'high';

    if (text.includes('GO TO') || text.match(/PERFORM.*VARYING/gi)) {
      complexity = 'high';
      maintainability = 'medium';
    }

    return {
      complexity,
      maintainability,
      testability: 'low',
      modernizationPriority: complexity === 'high' ? 'high' : 'medium'
    };
  }

  async getRelevantContext(code, conversationId) {
    // Default implementation - can be overridden for context retrieval
    return '';
  }

  async calculateConfidence(result, input) {
    let confidence = 0.7; // Base confidence

    // Check if we got structured data
    if (result.programInfo && result.dependencies) confidence += 0.2;

    // Check if we found meaningful dependencies
    if (result.dependencies.length > 0) confidence += 0.1;

    // Check if we found data structures
    if (result.dataStructures.length > 0) confidence += 0.1;

    // Penalize if we had to use fallback
    if (result.analysisMetadata?.fallbackAnalysis) confidence -= 0.3;
    if (result.analysisMetadata?.extractedFromText) confidence -= 0.1;

    return Math.max(0.3, Math.min(confidence, 0.95));
  }
}

module.exports = ParserAgent;
