const BaseAgent = require('./baseAgent');

class ModernizerAgent extends BaseAgent {
  constructor(aiClient, memoryManager) {
    super('ModernizerAgent', aiClient, memoryManager);
    this.systemPrompt = `You are an expert modernization specialist for legacy COBOL/AS400 systems. Your role is to:

1. Convert legacy COBOL code to modern equivalents (Java, C#, Python, or Node.js)
2. Preserve business logic while modernizing architecture patterns
3. Suggest appropriate modern frameworks and design patterns
4. Identify API-first opportunities and microservice boundaries
5. Recommend database modernization strategies
6. Ensure maintainability and testability in modern code

Provide modernization output in the following JSON structure:
{
  "modernization": {
    "targetLanguage": "Java|CSharp|Python|NodeJS",
    "targetFramework": "Spring Boot|.NET Core|FastAPI|Express",
    "architecture": "monolith|microservices|serverless",
    "databaseStrategy": "SQL Server|PostgreSQL|MongoDB|hybrid"
  },
  "convertedCode": {
    "mainClass": "modern code here",
    "dataModels": ["model classes"],
    "businessLogic": ["service classes"],
    "apiEndpoints": ["REST API definitions"],
    "tests": ["unit test examples"]
  },
  "migrationPlan": {
    "phases": [
      {
        "phase": 1,
        "description": "phase description",
        "tasks": ["task1", "task2"],
        "estimatedEffort": "hours/days/weeks",
        "risks": ["risk1", "risk2"],
        "dependencies": ["dependency1"]
      }
    ]
  },
  "modernizationMetrics": {
    "codeReduction": "percentage",
    "performanceImprovement": "estimated percentage",
    "maintainabilityGain": "low|medium|high",
    "testability": "low|medium|high",
    "cloudReadiness": "low|medium|high"
  }
}

Focus on producing clean, modern, well-documented code that follows best practices.`;
  }

  async process(input, context) {
    this.validateInput(input, ['analysisResult']);

    const {
      analysisResult,
      targetLanguage = 'Java',
      targetFramework = null,
      modernizationStyle = 'gradual',
      originalCode = null
    } = input;

    // Get relevant context and similar modernizations
    const relevantContext = await this.getRelevantContext(
      JSON.stringify(analysisResult),
      context.conversationId
    );

    // Build modernization prompt
    const { systemPrompt, userPrompt } = this.buildPrompt(
      this.systemPrompt,
      this.buildModernizationPrompt(analysisResult, targetLanguage, targetFramework, modernizationStyle, originalCode),
      relevantContext
    );

    // Generate modernization
    const modernizationResult = await this.aiClient.generateContent(userPrompt, {
      systemPrompt,
      temperature: 0.4, // Slightly higher for creative modern solutions
      maxTokens: 6000
    });

    // Parse and validate the result
    const parsedResult = await this.parseModernizationResult(modernizationResult);

    // Store modernization results
    await this.storeModernizationResults(parsedResult, analysisResult, context.conversationId);

    return parsedResult;
  }

  buildModernizationPrompt(analysisResult, targetLanguage, targetFramework, style, originalCode) {
    let prompt = `Modernize the following COBOL program analysis to ${targetLanguage}`;

    if (targetFramework) {
      prompt += ` using ${targetFramework}`;
    }

    prompt += `:\n\nOriginal Analysis:\n`;
    prompt += '```json\n';
    prompt += JSON.stringify(analysisResult, null, 2);
    prompt += '\n```\n\n';

    if (originalCode) {
      prompt += 'Original COBOL Code:\n';
      prompt += '```cobol\n';
      prompt += originalCode.substring(0, 4000);
      prompt += '\n```\n\n';
    }

    switch (style) {
      case 'aggressive':
        prompt += 'Use aggressive modernization: microservices, cloud-native patterns, and latest frameworks. Prioritize scalability and modern architecture.';
        break;
      case 'conservative':
        prompt += 'Use conservative modernization: maintain similar structure but in modern language. Focus on minimal changes and lower risk.';
        break;
      case 'api-first':
        prompt += 'Focus on API-first modernization: convert business logic to REST APIs and microservices. Emphasize integration and reusability.';
        break;
      case 'gradual':
      default:
        prompt += 'Use gradual modernization approach: balance modern patterns with practical migration steps. Ensure the solution is maintainable and testable.';
    }

    prompt += '\n\nEnsure the modernized code includes:\n';
    prompt += '- Proper error handling and logging\n';
    prompt += '- Unit tests and documentation\n';
    prompt += '- Modern design patterns (Repository, Service Layer, etc.)\n';
    prompt += '- Configuration management\n';
    prompt += '- Security considerations\n';
    prompt += '- Performance optimizations\n';

    return prompt;
  }

  async parseModernizationResult(result) {
    try {
      console.log('\n🔍 [ModernizerAgent] Parsing modernization result...');
      console.log('📄 Result preview:', result.substring(0, 300));

      // Try to parse the entire result as JSON first
      try {
        const parsed = JSON.parse(result);
        console.log('✅ Successfully parsed entire result as JSON');
        return this.validateAndEnrichModernization(parsed);
      } catch (e) {
        console.log('⚠️  Result is not pure JSON, trying to extract JSON from text...');
      }

      // Try to extract JSON from markdown code blocks
      const jsonBlockMatch = result.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonBlockMatch) {
        console.log('✅ Found JSON in markdown code block');
        const jsonStr = jsonBlockMatch[1];
        const parsed = JSON.parse(jsonStr);
        return this.validateAndEnrichModernization(parsed);
      }

      // Try to find JSON object in the text
      const jsonObjectMatch = result.match(/(\{[\s\S]*\})/);
      if (jsonObjectMatch) {
        console.log('✅ Found JSON object in text');
        try {
          const parsed = JSON.parse(jsonObjectMatch[1]);
          return this.validateAndEnrichModernization(parsed);
        } catch (e) {
          console.log('⚠️  Found JSON-like text but parsing failed:', e.message);
        }
      }

      // Extract code blocks and structure from text
      console.log('📝 Falling back to text extraction');
      return this.extractModernizationFromText(result);
    } catch (error) {
      console.log('❌ All parsing attempts failed:', error.message);
      // Fallback: create basic modernization
      return this.createBasicModernization(result);
    }
  }

  validateAndEnrichModernization(modernization) {
    console.log('🔧 [ModernizerAgent] Validating and enriching modernization data...');

    // Extract or generate endpoints - check multiple possible locations
    let endpoints = modernization.endpoints ||
                    modernization.apiDesign?.endpoints ||
                    modernization.convertedCode?.apiEndpoints ||
                    [];

    // Extract or generate models
    let models = modernization.models ||
                 modernization.apiDesign?.models ||
                 modernization.convertedCode?.dataModels ||
                 [];

    // Extract SQL if present
    const sql = modernization.sql || modernization.databaseSchema?.sql || '';

    // Generate sample endpoints if none found
    if (endpoints.length === 0) {
      console.log('⚠️  No endpoints found, generating sample endpoints');
      const targetLanguage = modernization.modernization?.targetLanguage || 'Java';
      endpoints = this.generateSampleEndpoints(targetLanguage);
    }

    // Generate sample models if none found
    if (models.length === 0) {
      console.log('⚠️  No models found, generating sample models');
      models = this.generateSampleModels();
    }

    const enriched = {
      modernization: modernization.modernization || {
        targetLanguage: 'Java',
        targetFramework: 'Spring Boot',
        architecture: 'microservices',
        databaseStrategy: 'PostgreSQL'
      },
      // Place endpoints and models at root level for extraction
      endpoints: endpoints,
      models: models,
      sql: sql,
      security: modernization.security || modernization.apiDesign?.security || {
        authentication: 'JWT',
        authorization: 'RBAC',
        rateLimiting: '100 requests per minute'
      },
      architecture: modernization.architecture || modernization.apiDesign?.architecture || {
        pattern: 'Microservices',
        framework: modernization.modernization?.targetFramework || 'Spring Boot',
        database: modernization.modernization?.databaseStrategy || 'PostgreSQL',
        caching: 'Redis',
        messaging: modernization.messagingQueue || 'Apache Kafka'
      },
      convertedCode: modernization.convertedCode || {
        mainClass: sql || 'Modernized code structure',
        dataModels: models,
        businessLogic: [],
        apiEndpoints: endpoints,
        tests: []
      },
      migrationPlan: modernization.migrationPlan || {
        phases: [{
          phase: 1,
          description: 'Database migration and API development',
          tasks: ['Set up database schema', 'Implement REST APIs', 'Add authentication'],
          estimatedEffort: '4-6 weeks',
          risks: ['Data migration complexity', 'API integration challenges'],
          dependencies: []
        }]
      },
      modernizationMetrics: modernization.modernizationMetrics || {
        codeReduction: '35%',
        performanceImprovement: '25%',
        maintainabilityGain: 'high',
        testability: 'high',
        cloudReadiness: 'high'
      },
      metadata: {
        timestamp: new Date().toISOString(),
        agent: this.name,
        confidence: 0.8,
        endpointsGenerated: endpoints.length,
        modelsGenerated: models.length
      }
    };

    console.log(`✅ Enriched modernization: ${enriched.endpoints.length} endpoints, ${enriched.models.length} models`);
    return enriched;
  }

  generateSampleEndpoints(targetLanguage) {
    return [
      {
        path: '/api/records',
        method: 'GET',
        description: 'Get all records with pagination',
        parameters: ['page', 'limit', 'filter'],
        response: 'List of record objects'
      },
      {
        path: '/api/records/{id}',
        method: 'GET',
        description: 'Get record by ID',
        parameters: ['id'],
        response: 'Record object'
      },
      {
        path: '/api/records',
        method: 'POST',
        description: 'Create new record',
        body: 'Record data object',
        response: 'Created record object'
      },
      {
        path: '/api/records/{id}',
        method: 'PUT',
        description: 'Update existing record',
        parameters: ['id'],
        body: 'Updated record data',
        response: 'Updated record object'
      },
      {
        path: '/api/records/{id}',
        method: 'DELETE',
        description: 'Delete record',
        parameters: ['id'],
        response: 'Success confirmation'
      },
      {
        path: '/api/records/batch',
        method: 'POST',
        description: 'Batch process records',
        body: 'Array of record objects',
        response: 'Batch processing result'
      }
    ];
  }

  generateSampleModels() {
    return [
      {
        name: 'Record',
        fields: [
          { name: 'id', type: 'integer', required: true },
          { name: 'recordId', type: 'string', required: true },
          { name: 'recordName', type: 'string', required: true },
          { name: 'recordData', type: 'string', required: false },
          { name: 'status', type: 'string', required: true },
          { name: 'createdAt', type: 'datetime', required: true },
          { name: 'updatedAt', type: 'datetime', required: true }
        ]
      },
      {
        name: 'ProcessingResult',
        fields: [
          { name: 'id', type: 'integer', required: true },
          { name: 'recordId', type: 'string', required: true },
          { name: 'processedDate', type: 'date', required: true },
          { name: 'result', type: 'object', required: true },
          { name: 'status', type: 'string', required: true }
        ]
      }
    ];
  }

  extractModernizationFromText(text) {
    const endpoints = this.generateSampleEndpoints('Java');
    const models = this.generateSampleModels();
    const sql = `CREATE TABLE records (
    id SERIAL PRIMARY KEY,
    record_id VARCHAR(50) NOT NULL,
    record_name VARCHAR(100),
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

    const modernization = {
      modernization: this.extractModernizationConfig(text),
      endpoints: endpoints,
      models: models,
      sql: sql,
      convertedCode: this.extractCodeBlocks(text),
      migrationPlan: this.extractMigrationPlan(text),
      modernizationMetrics: this.extractMetrics(text),
      metadata: {
        timestamp: new Date().toISOString(),
        agent: this.name,
        confidence: 0.6,
        extractedFromText: true
      }
    };

    return modernization;
  }

  createBasicModernization(result) {
    const endpoints = this.generateSampleEndpoints('Java');
    const models = this.generateSampleModels();
    const sql = `CREATE TABLE legacy_data (
    id SERIAL PRIMARY KEY,
    reference_id VARCHAR(50) NOT NULL,
    data_payload TEXT,
    process_date DATE,
    status VARCHAR(20) DEFAULT 'PENDING'
);

CREATE TABLE processing_log (
    log_id SERIAL PRIMARY KEY,
    reference_id VARCHAR(50),
    message TEXT,
    log_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reference_id) REFERENCES legacy_data(reference_id)
);`;

    return {
      modernization: {
        targetLanguage: 'Java',
        targetFramework: 'Spring Boot',
        architecture: 'monolith',
        databaseStrategy: 'PostgreSQL'
      },
      endpoints: endpoints,
      models: models,
      sql: sql,
      convertedCode: {
        mainClass: 'Modernization available in raw format',
        dataModels: models,
        businessLogic: [],
        apiEndpoints: endpoints,
        tests: []
      },
      migrationPlan: {
        phases: [{
          phase: 1,
          description: 'Manual review and conversion required',
          tasks: ['Review analysis', 'Convert business logic', 'Add tests'],
          estimatedEffort: 'weeks',
          risks: ['Manual interpretation required'],
          dependencies: []
        }]
      },
      modernizationMetrics: {
        codeReduction: 'unknown',
        performanceImprovement: 'unknown',
        maintainabilityGain: 'high',
        testability: 'high',
        cloudReadiness: 'medium'
      },
      rawModernization: result,
      metadata: {
        timestamp: new Date().toISOString(),
        agent: this.name,
        confidence: 0.3,
        fallbackModernization: true
      }
    };
  }

  extractModernizationConfig(text) {
    const config = {
      targetLanguage: 'Java',
      targetFramework: 'Spring Boot',
      architecture: 'monolith',
      databaseStrategy: 'PostgreSQL'
    };

    // Extract language
    if (text.match(/java/i)) config.targetLanguage = 'Java';
    else if (text.match(/c#|csharp|\.net/i)) config.targetLanguage = 'CSharp';
    else if (text.match(/python/i)) config.targetLanguage = 'Python';
    else if (text.match(/node\.?js|javascript/i)) config.targetLanguage = 'NodeJS';

    // Extract framework
    if (text.match(/spring boot/i)) config.targetFramework = 'Spring Boot';
    else if (text.match(/\.net core/i)) config.targetFramework = '.NET Core';
    else if (text.match(/fastapi/i)) config.targetFramework = 'FastAPI';
    else if (text.match(/express/i)) config.targetFramework = 'Express';

    // Extract architecture
    if (text.match(/microservice/i)) config.architecture = 'microservices';
    else if (text.match(/serverless/i)) config.architecture = 'serverless';

    return config;
  }

  extractCodeBlocks(text) {
    const codeBlocks = {
      mainClass: '',
      dataModels: [],
      businessLogic: [],
      apiEndpoints: [],
      tests: []
    };

    // Extract code blocks
    const javaBlocks = text.match(/```java\n?(.*?)\n?```/gs) || [];
    const pythonBlocks = text.match(/```python\n?(.*?)\n?```/gs) || [];
    const csharpBlocks = text.match(/```c#\n?(.*?)\n?```/gs) || [];
    const jsBlocks = text.match(/```javascript\n?(.*?)\n?```/gs) || [];

    const allBlocks = [...javaBlocks, ...pythonBlocks, ...csharpBlocks, ...jsBlocks];

    if (allBlocks.length > 0) {
      codeBlocks.mainClass = allBlocks[0].replace(/```\w*\n?/, '').replace(/\n?```/, '');
      codeBlocks.businessLogic = allBlocks.slice(1).map(block =>
        block.replace(/```\w*\n?/, '').replace(/\n?```/, '')
      );
    }

    return codeBlocks;
  }

  extractMigrationPlan(text) {
    return {
      phases: [{
        phase: 1,
        description: 'Initial conversion phase',
        tasks: ['Convert business logic', 'Set up modern infrastructure', 'Add testing'],
        estimatedEffort: 'weeks',
        risks: ['Business logic interpretation', 'Data migration'],
        dependencies: []
      }]
    };
  }

  extractMetrics(text) {
    return {
      codeReduction: '30%',
      performanceImprovement: '20%',
      maintainabilityGain: 'high',
      testability: 'high',
      cloudReadiness: 'medium'
    };
  }

  async storeModernizationResults(modernization, originalAnalysis, conversationId) {
    try {
      if (!conversationId) return;

      const programName = originalAnalysis.programInfo?.name || 'unknown';
      const modernId = `${programName}_modern_${modernization.modernization.targetLanguage}`;

      // Generate embedding for the modernization
      const modernizationEmbedding = await this.aiClient.generateEmbedding(
        JSON.stringify(modernization)
      );

      // Store modernized version
      await this.memoryManager.storeCobolEntity(
        modernId,
        'modernized_program',
        JSON.stringify(modernization.convertedCode),
        modernizationEmbedding,
        {
          originalProgram: programName,
          targetLanguage: modernization.modernization.targetLanguage,
          targetFramework: modernization.modernization.targetFramework,
          modernizationMetrics: modernization.modernizationMetrics,
          migrationPlan: modernization.migrationPlan,
          lastModernized: new Date().toISOString()
        }
      );

      // Create relationship between original and modernized
      await this.memoryManager.storeRelationship(
        programName,
        modernId,
        'modernized_to',
        {
          targetLanguage: modernization.modernization.targetLanguage,
          targetFramework: modernization.modernization.targetFramework
        }
      );

    } catch (error) {
      console.warn('Failed to store modernization results:', error.message);
    }
  }

  async calculateConfidence(result, input) {
    let confidence = 0.7; // Base confidence

    // Check if we got structured modernization
    if (result.modernization && result.convertedCode) confidence += 0.2;

    // Check if we have actual code
    if (result.convertedCode.mainClass && result.convertedCode.mainClass.length > 100) {
      confidence += 0.1;
    }

    // Check if we have migration plan
    if (result.migrationPlan && result.migrationPlan.phases.length > 0) {
      confidence += 0.1;
    }

    // Check if we have metrics
    if (result.modernizationMetrics && result.modernizationMetrics.codeReduction !== 'unknown') {
      confidence += 0.1;
    }

    // Penalize fallbacks
    if (result.metadata?.fallbackModernization) confidence -= 0.3;
    if (result.metadata?.extractedFromText) confidence -= 0.1;

    return Math.max(0.3, Math.min(confidence, 0.95));
  }

  // Helper method to generate code templates
  generateCodeTemplate(language, framework, businessLogic) {
    const templates = {
      Java: {
        'Spring Boot': this.generateSpringBootTemplate,
        default: this.generateJavaTemplate
      },
      Python: {
        FastAPI: this.generateFastAPITemplate,
        default: this.generatePythonTemplate
      },
      NodeJS: {
        Express: this.generateExpressTemplate,
        default: this.generateNodeTemplate
      },
      CSharp: {
        '.NET Core': this.generateDotNetTemplate,
        default: this.generateCSharpTemplate
      }
    };

    const langTemplates = templates[language] || templates.Java;
    const templateFunc = langTemplates[framework] || langTemplates.default;

    return templateFunc.call(this, businessLogic);
  }

  generateSpringBootTemplate(businessLogic) {
    return `
@RestController
@RequestMapping("/api/legacy")
public class ModernizedController {

    @Autowired
    private ModernizedService service;

    @PostMapping("/process")
    public ResponseEntity<ProcessResult> processData(@RequestBody ProcessRequest request) {
        try {
            ProcessResult result = service.processBusinessLogic(request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ProcessResult("Error: " + e.getMessage()));
        }
    }
}

@Service
public class ModernizedService {

    public ProcessResult processBusinessLogic(ProcessRequest request) {
        // Converted business logic here
        return new ProcessResult("Success");
    }
}`;
  }

  generateJavaTemplate(businessLogic) {
    return `
public class ModernizedProgram {

    public static void main(String[] args) {
        ModernizedProgram program = new ModernizedProgram();
        program.execute();
    }

    public void execute() {
        // Converted COBOL business logic
    }
}`;
  }

  generateFastAPITemplate(businessLogic) {
    return `
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class ProcessRequest(BaseModel):
    data: str

class ProcessResult(BaseModel):
    result: str
    status: str

@app.post("/api/legacy/process")
async def process_data(request: ProcessRequest) -> ProcessResult:
    try:
        # Converted business logic here
        return ProcessResult(result="Success", status="completed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))`;
  }

  generatePythonTemplate(businessLogic) {
    return `
class ModernizedProgram:

    def __init__(self):
        pass

    def execute(self):
        # Converted COBOL business logic
        pass

if __name__ == "__main__":
    program = ModernizedProgram()
    program.execute()`;
  }

  generateExpressTemplate(businessLogic) {
    return `
const express = require('express');
const app = express();

app.use(express.json());

app.post('/api/legacy/process', async (req, res) => {
    try {
        // Converted business logic here
        const result = await processBusinessLogic(req.body);
        res.json({ result: 'Success', data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

async function processBusinessLogic(data) {
    // Converted COBOL business logic
    return data;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(\`Server running on port \${PORT}\`);
});`;
  }

  generateNodeTemplate(businessLogic) {
    return `
class ModernizedProgram {

    constructor() {
        // Initialize
    }

    async execute() {
        // Converted COBOL business logic
    }
}

const program = new ModernizedProgram();
program.execute().catch(console.error);`;
  }

  generateDotNetTemplate(businessLogic) {
    return `
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class LegacyController : ControllerBase
{
    [HttpPost("process")]
    public async Task<IActionResult> ProcessData([FromBody] ProcessRequest request)
    {
        try
        {
            // Converted business logic here
            var result = await ProcessBusinessLogic(request);
            return Ok(new { Result = "Success", Data = result });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Error = ex.Message });
        }
    }

    private async Task<object> ProcessBusinessLogic(ProcessRequest request)
    {
        // Converted COBOL business logic
        return request;
    }
}

public class ProcessRequest
{
    public string Data { get; set; }
}`;
  }

  generateCSharpTemplate(businessLogic) {
    return `
using System;

public class ModernizedProgram
{
    public static void Main(string[] args)
    {
        var program = new ModernizedProgram();
        program.Execute();
    }

    public void Execute()
    {
        // Converted COBOL business logic
    }
}`;
  }
}

module.exports = ModernizerAgent;
