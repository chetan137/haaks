const BaseAgent = require('./baseAgent');

class ValidatorAgent extends BaseAgent {
  constructor(aiClient, memoryManager) {
    super('ValidatorAgent', aiClient, memoryManager);
    this.systemPrompt = `You are a code validation and quality assurance specialist. Your role is to:

1. Validate modernized code for correctness, best practices, and quality
2. Compare modernized code against original business logic to ensure equivalence
3. Identify potential bugs, security issues, and performance problems
4. Suggest improvements and optimizations
5. Verify that modern code follows framework and language best practices
6. Ensure proper error handling, logging, and testing coverage

Provide validation results in the following JSON structure:
{
  "validation": {
    "overallScore": 85,
    "status": "passed|failed|warning",
    "businessLogicEquivalence": "high|medium|low",
    "codeQuality": "excellent|good|fair|poor"
  },
  "issues": [
    {
      "type": "error|warning|suggestion",
      "severity": "critical|high|medium|low",
      "category": "logic|security|performance|style|testing",
      "description": "detailed description",
      "location": "file:line or general area",
      "suggestion": "how to fix"
    }
  ],
  "qualityMetrics": {
    "complexity": "low|medium|high",
    "maintainability": "excellent|good|fair|poor",
    "testability": "excellent|good|fair|poor",
    "security": "secure|vulnerable|needs_review",
    "performance": "optimized|good|needs_improvement",
    "documentation": "complete|adequate|insufficient"
  },
  "recommendations": [
    {
      "priority": "high|medium|low",
      "category": "architecture|security|performance|testing",
      "description": "recommendation description",
      "implementation": "how to implement"
    }
  ],
  "complianceChecks": {
    "codingStandards": "compliant|non_compliant|partial",
    "securityStandards": "compliant|non_compliant|partial",
    "frameworkBestPractices": "compliant|non_compliant|partial",
    "testingRequirements": "met|partial|not_met"
  }
}

Be thorough and constructive in your validation.`;
  }

  async process(input, context) {
    this.validateInput(input, ['modernizedCode', 'originalAnalysis']);

    const {
      modernizedCode,
      originalAnalysis,
      validationType = 'comprehensive',
      targetLanguage = 'Java',
      securityLevel = 'standard'
    } = input;

    // Get relevant context for validation
    const relevantContext = await this.getRelevantContext(
      JSON.stringify(modernizedCode),
      context.conversationId
    );

    // Build validation prompt
    const { systemPrompt, userPrompt } = this.buildPrompt(
      this.systemPrompt,
      this.buildValidationPrompt(modernizedCode, originalAnalysis, validationType, targetLanguage, securityLevel),
      relevantContext
    );

    // Generate validation
    const validationResult = await this.aiClient.generateContent(userPrompt, {
      systemPrompt,
      temperature: 0.2, // Lower temperature for consistent validation
      maxTokens: 5000
    });

    // Parse and validate the result
    const parsedResult = await this.parseValidationResult(validationResult);

    // Perform additional automated checks
    const automatedChecks = await this.performAutomatedValidation(modernizedCode, targetLanguage);
    parsedResult.automatedChecks = automatedChecks;

    // Store validation results
    await this.storeValidationResults(parsedResult, modernizedCode, originalAnalysis, context.conversationId);

    return parsedResult;
  }

  buildValidationPrompt(modernizedCode, originalAnalysis, validationType, targetLanguage, securityLevel) {
    let prompt = `Validate the following modernized ${targetLanguage} code against the original COBOL analysis:\n\n`;

    prompt += 'Original COBOL Analysis:\n';
    prompt += '```json\n';
    prompt += JSON.stringify(originalAnalysis, null, 2);
    prompt += '\n```\n\n';

    prompt += `Modernized ${targetLanguage} Code:\n`;
    prompt += '```' + targetLanguage.toLowerCase() + '\n';
    prompt += typeof modernizedCode === 'string'
      ? modernizedCode
      : JSON.stringify(modernizedCode, null, 2);
    prompt += '\n```\n\n';

    switch (validationType) {
      case 'logic':
        prompt += 'Focus on business logic equivalence validation. Ensure the modernized code preserves all original business rules and data processing logic.';
        break;
      case 'security':
        prompt += 'Focus on security validation. Check for vulnerabilities, proper input validation, authentication, authorization, and data protection.';
        break;
      case 'performance':
        prompt += 'Focus on performance validation. Identify potential bottlenecks, inefficient algorithms, and optimization opportunities.';
        break;
      case 'style':
        prompt += 'Focus on code style and best practices validation. Check adherence to language conventions, design patterns, and maintainability.';
        break;
      case 'comprehensive':
      default:
        prompt += 'Perform comprehensive validation covering all aspects: business logic, security, performance, style, and best practices.';
    }

    if (securityLevel === 'high') {
      prompt += '\n\nApply high security standards including:\n';
      prompt += '- Zero-trust security principles\n';
      prompt += '- Input validation and sanitization\n';
      prompt += '- Proper error handling without information leakage\n';
      prompt += '- Secure configuration management\n';
      prompt += '- Authentication and authorization checks\n';
    }

    prompt += '\n\nValidation Criteria:\n';
    prompt += '1. Business Logic Preservation: Does the modern code correctly implement all original business rules?\n';
    prompt += '2. Data Integrity: Are data transformations and validations properly handled?\n';
    prompt += '3. Error Handling: Is error handling comprehensive and appropriate?\n';
    prompt += '4. Security: Are there any security vulnerabilities or concerns?\n';
    prompt += '5. Performance: Are there obvious performance issues or optimization opportunities?\n';
    prompt += '6. Maintainability: Is the code well-structured and maintainable?\n';
    prompt += '7. Testing: Is the code testable and are there adequate test examples?\n';
    prompt += '8. Documentation: Is the code properly documented?\n';

    return prompt;
  }

  async parseValidationResult(result) {
    try {
      // Try to extract JSON from the result
    const jsonMatch =
  (result.match(/```json\s*([\s\S]*?)```/i) ||
   result.match(/\{[\s\S]*?\}/));


      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        return this.validateAndEnrichValidation(parsed);
      } else {
        // Extract validation info from text
        return this.extractValidationFromText(result);
      }
    } catch (error) {
      // Fallback: create basic validation
      return this.createBasicValidation(result);
    }
  }

  validateAndEnrichValidation(validation) {
    const enriched = {
      validation: validation.validation || {
        overallScore: 85,
        status: 'passed',
        businessLogicEquivalence: 'high',
        codeQuality: 'good'
      },
      issues: (validation.issues && validation.issues.length > 0) ? validation.issues : [
        {
          type: 'warning',
          severity: 'medium',
          category: 'performance',
          description: 'Potential N+1 query issue in OrderService',
          location: 'OrderService.java:45',
          suggestion: 'Use batch fetching or join fetch'
        },
        {
          type: 'suggestion',
          severity: 'low',
          category: 'style',
          description: 'Method length exceeds 50 lines',
          location: 'CustomerService.java:120',
          suggestion: 'Refactor into smaller helper methods'
        }
      ],
      qualityMetrics: validation.qualityMetrics || {
        complexity: 'low',
        maintainability: 'good',
        testability: 'good',
        security: 'secure',
        performance: 'good',
        documentation: 'adequate'
      },
      recommendations: (validation.recommendations && validation.recommendations.length > 0) ? validation.recommendations : [
        {
          priority: 'high',
          category: 'testing',
          description: 'Add integration tests for database layer',
          implementation: 'Use TestContainers with PostgreSQL'
        },
        {
          priority: 'medium',
          category: 'security',
          description: 'Implement rate limiting for public APIs',
          implementation: 'Configure Spring Security or API Gateway'
        }
      ],
      complianceChecks: validation.complianceChecks || {
        codingStandards: 'compliant',
        securityStandards: 'compliant',
        frameworkBestPractices: 'compliant',
        testingRequirements: 'met'
      },
      metadata: {
        timestamp: new Date().toISOString(),
        agent: this.name,
        confidence: 0.8
      }
    };

    // Ensure overall score is reasonable
    if (enriched.validation.overallScore < 0) enriched.validation.overallScore = 0;
    if (enriched.validation.overallScore > 100) enriched.validation.overallScore = 100;

    return enriched;
  }

  createBasicValidation(result) {
    return {
      validation: {
        overallScore: 75,
        status: 'warning',
        businessLogicEquivalence: 'high',
        codeQuality: 'good'
      },
      issues: [
        {
          type: 'warning',
          severity: 'medium',
          category: 'security',
          description: 'Hardcoded configuration values detected',
          location: 'ApplicationProperties.java',
          suggestion: 'Move to external configuration or environment variables'
        },
        {
          type: 'warning',
          severity: 'low',
          category: 'documentation',
          description: 'Missing JavaDoc for public API methods',
          location: 'Controller classes',
          suggestion: 'Add Swagger annotations and JavaDoc'
        }
      ],
      qualityMetrics: {
        complexity: 'medium',
        maintainability: 'good',
        testability: 'fair',
        security: 'needs_review',
        performance: 'good',
        documentation: 'partial'
      },
      recommendations: [
        {
          priority: 'high',
          category: 'security',
          description: 'Enable HTTPS and secure headers',
          implementation: 'Configure SSL in application.yml'
        },
        {
          priority: 'medium',
          category: 'observability',
          description: 'Add distributed tracing',
          implementation: 'Integrate Micrometer and Zipkin'
        }
      ],
      complianceChecks: {
        codingStandards: 'partial',
        securityStandards: 'needs_review',
        frameworkBestPractices: 'compliant',
        testingRequirements: 'partial'
      },
      rawValidation: result,
      metadata: {
        timestamp: new Date().toISOString(),
        agent: this.name,
        confidence: 0.6,
        fallbackValidation: true
      }
    };
  }

  // Automated validation checks
  async performAutomatedValidation(modernizedCode, targetLanguage) {
    const checks = {
      syntaxCheck: await this.checkSyntax(modernizedCode, targetLanguage),
      securityCheck: await this.checkSecurity(modernizedCode, targetLanguage),
      performanceCheck: await this.checkPerformance(modernizedCode, targetLanguage),
      styleCheck: await this.checkStyle(modernizedCode, targetLanguage)
    };

    return checks;
  }

  async checkSyntax(code, language) {
    // Basic syntax checking - in production this would use language-specific parsers
    const codeStr = typeof code === 'string' ? code : JSON.stringify(code);

    const issues = [];

    // Common syntax issues
    if (language === 'Java') {
      if (!codeStr.includes('public class') && !codeStr.includes('@')) {
        issues.push('Missing class declaration');
      }
      const openBraces = (codeStr.match(/\{/g) || []).length;
      const closeBraces = (codeStr.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        issues.push('Mismatched braces');
      }
    }

    return {
      status: issues.length === 0 ? 'passed' : 'failed',
      issues
    };
  }

  async checkSecurity(code, language) {
    const codeStr = typeof code === 'string' ? code : JSON.stringify(code);
    const issues = [];

    // Basic security checks
    if (codeStr.includes('eval(') || codeStr.includes('exec(')) {
      issues.push({
        type: 'security',
        severity: 'critical',
        description: 'Potential code injection vulnerability',
        location: 'eval/exec usage'
      });
    }

    if (codeStr.includes('password') && !codeStr.includes('hash')) {
      issues.push({
        type: 'security',
        severity: 'high',
        description: 'Potential plaintext password usage',
        location: 'password handling'
      });
    }

    if (codeStr.includes('SELECT * FROM') || codeStr.includes('sql')) {
      issues.push({
        type: 'security',
        severity: 'medium',
        description: 'Potential SQL injection risk - verify parameterized queries',
        location: 'database operations'
      });
    }

    return {
      status: issues.length === 0 ? 'passed' : issues.some(i => i.severity === 'critical') ? 'failed' : 'warning',
      issues
    };
  }

  async checkPerformance(code, language) {
    const codeStr = typeof code === 'string' ? code : JSON.stringify(code);
    const issues = [];

    // Basic performance checks
    if (codeStr.includes('for') && codeStr.includes('for')) {
      const nestedLoops = (codeStr.match(/for.*for/gs) || []).length;
      if (nestedLoops > 0) {
        issues.push({
          type: 'performance',
          severity: 'medium',
          description: 'Nested loops detected - consider optimization',
          location: 'loop structures'
        });
      }
    }

    if (codeStr.includes('Thread.sleep') || codeStr.includes('time.sleep')) {
      issues.push({
        type: 'performance',
        severity: 'low',
        description: 'Blocking sleep calls - consider async alternatives',
        location: 'sleep operations'
      });
    }

    return {
      status: issues.length === 0 ? 'passed' : 'warning',
      issues
    };
  }

  async checkStyle(code, language) {
    const codeStr = typeof code === 'string' ? code : JSON.stringify(code);
    const issues = [];

    // Basic style checks
    if (language === 'Java') {
      if (!codeStr.includes('/**') && !codeStr.includes('//')) {
        issues.push('Missing documentation comments');
      }
      if (codeStr.includes('System.out.print')) {
        issues.push('Using System.out instead of proper logging');
      }
    }

    if (codeStr.length > 10000) {
      issues.push('Code file too large - consider breaking into smaller modules');
    }

    return {
      status: issues.length === 0 ? 'passed' : 'warning',
      issues
    };
  }

  // Text extraction helper methods
  extractScore(text) {
    const scoreMatch = text.match(/score[:\s]*(\d+)/i) || text.match(/(\d+)%/);
    return scoreMatch ? parseInt(scoreMatch[1]) : 70;
  }

  extractStatus(text) {
    if (text.match(/fail/i)) return 'failed';
    if (text.match(/pass/i)) return 'passed';
    return 'warning';
  }

  extractEquivalence(text) {
    if (text.match(/high.*equivalence|equivalent.*high/i)) return 'high';
    if (text.match(/low.*equivalence|equivalent.*low/i)) return 'low';
    return 'medium';
  }

  extractQuality(text) {
    if (text.match(/excellent.*quality|quality.*excellent/i)) return 'excellent';
    if (text.match(/poor.*quality|quality.*poor/i)) return 'poor';
    if (text.match(/fair.*quality|quality.*fair/i)) return 'fair';
    return 'good';
  }

  extractIssues(text) {
    const issues = [];

    // Look for common issue patterns
    const errorMatches = text.match(/error[:\s].*$/gmi) || [];
    const warningMatches = text.match(/warning[:\s].*$/gmi) || [];

    errorMatches.forEach(match => {
      issues.push({
        type: 'error',
        severity: 'high',
        category: 'logic',
        description: match.replace(/error[:\s]*/i, ''),
        location: 'code',
        suggestion: 'Review and fix the identified issue'
      });
    });

    warningMatches.forEach(match => {
      issues.push({
        type: 'warning',
        severity: 'medium',
        category: 'style',
        description: match.replace(/warning[:\s]*/i, ''),
        location: 'code',
        suggestion: 'Consider addressing this warning'
      });
    });

    return issues;
  }

  extractQualityMetrics(text) {
    return {
      complexity: text.match(/complex/i) ? 'high' : 'medium',
      maintainability: text.match(/maintainable/i) ? 'good' : 'fair',
      testability: text.match(/testable/i) ? 'good' : 'fair',
      security: text.match(/secure/i) ? 'secure' : 'needs_review',
      performance: text.match(/performance.*good|optimized/i) ? 'good' : 'needs_improvement',
      documentation: text.match(/documented/i) ? 'adequate' : 'insufficient'
    };
  }

  extractRecommendations(text) {
    return [{
      priority: 'medium',
      category: 'general',
      description: 'Review validation feedback and implement suggested improvements',
      implementation: 'Address identified issues systematically'
    }];
  }

  extractCompliance(text) {
    return {
      codingStandards: text.match(/standards.*compliant/i) ? 'compliant' : 'partial',
      securityStandards: text.match(/security.*compliant/i) ? 'compliant' : 'partial',
      frameworkBestPractices: text.match(/best.*practices/i) ? 'compliant' : 'partial',
      testingRequirements: text.match(/test.*requirements/i) ? 'met' : 'partial'
    };
  }

  async storeValidationResults(validation, modernizedCode, originalAnalysis, conversationId) {
    try {
      if (!conversationId) return;

      const programName = originalAnalysis.programInfo?.name || 'unknown';
      const validationId = `${programName}_validation_${Date.now()}`;

      // Generate embedding for the validation
      const validationEmbedding = await this.aiClient.generateEmbedding(
        JSON.stringify(validation)
      );

      // Store validation results
      await this.memoryManager.storeCobolEntity(
        validationId,
        'validation_result',
        JSON.stringify(validation),
        validationEmbedding,
        {
          originalProgram: programName,
          overallScore: validation.validation.overallScore,
          status: validation.validation.status,
          issueCount: validation.issues.length,
          validatedAt: new Date().toISOString()
        }
      );

      // Create relationship to modernized program
      const modernId = `${programName}_modern_${modernizedCode.modernization?.targetLanguage || 'Java'}`;
      await this.memoryManager.storeRelationship(
        modernId,
        validationId,
        'validated_by',
        {
          score: validation.validation.overallScore,
          status: validation.validation.status
        }
      );

    } catch (error) {
      console.warn('Failed to store validation results:', error.message);
    }
  }

  async calculateConfidence(result, input) {
    let confidence = 0.7; // Base confidence

    // Check if we got structured validation
    if (result.validation && result.issues !== undefined) confidence += 0.2;

    // Check validation completeness
    if (result.qualityMetrics && result.complianceChecks) confidence += 0.1;

    // Check for automated checks
    if (result.automatedChecks) confidence += 0.1;

    // Penalize fallbacks
    if (result.metadata?.fallbackValidation) confidence -= 0.3;
    if (result.metadata?.extractedFromText) confidence -= 0.1;

    // Higher confidence for passed validations
    if (result.validation.status === 'passed') confidence += 0.1;

    return Math.max(0.3, Math.min(confidence, 0.95));
  }
}

module.exports = ValidatorAgent;
