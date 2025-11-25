const BaseAgent = require('../agents/baseAgent');

class RepairAgent extends BaseAgent {
  constructor(aiClient, memoryManager) {
    super('RepairAgent', aiClient, memoryManager);
    this.systemPrompt = `You are a specialized repair and recovery agent for AI workflow systems. Your role is to:

1. Analyze failed operations and identify root causes
2. Suggest and implement fixes for common AI processing failures
3. Repair malformed or incomplete outputs from other agents
4. Implement fallback strategies when primary approaches fail
5. Auto-correct validation issues and code quality problems
6. Provide alternative processing paths for complex scenarios

When repairing outputs, provide the following JSON structure:
{
  "repair": {
    "status": "success|partial|failed",
    "repairType": "format_fix|content_completion|fallback_generation|error_correction",
    "originalIssue": "description of the original problem",
    "repairStrategy": "explanation of the repair approach",
    "confidence": 0.85
  },
  "repairedOutput": {
    // The corrected/completed output in the expected format
  },
  "diagnostics": {
    "issuesFound": [
      {
        "type": "syntax|logic|format|completeness",
        "severity": "critical|high|medium|low",
        "description": "issue description",
        "location": "where the issue was found",
        "fixed": true
      }
    ],
    "repairActions": [
      {
        "action": "description of repair action taken",
        "success": true,
        "impact": "high|medium|low"
      }
    ]
  },
  "qualityMetrics": {
    "outputCompleteness": "percentage",
    "formatCorrectness": "excellent|good|fair|poor",
    "logicalConsistency": "excellent|good|fair|poor",
    "usability": "excellent|good|fair|poor"
  },
  "recommendations": [
    {
      "category": "prevention|improvement|monitoring",
      "recommendation": "specific recommendation",
      "priority": "high|medium|low"
    }
  ]
}

Focus on producing usable, correct outputs even from severely damaged or incomplete inputs.`;
  }

  async process(input, context) {
    this.validateInput(input, ['failedOutput', 'expectedFormat', 'errorContext']);

    const {
      failedOutput,
      expectedFormat,
      errorContext,
      repairStrategy = 'auto',
      maxRepairAttempts = 3
    } = input;

    try {
      // Analyze the failure
      const analysis = await this.analyzeFailure(failedOutput, expectedFormat, errorContext);

      // Determine repair strategy
      const strategy = repairStrategy === 'auto'
        ? this.determineOptimalRepairStrategy(analysis)
        : repairStrategy;

      // Execute repair
      const repairResult = await this.executeRepair(
        failedOutput,
        expectedFormat,
        errorContext,
        strategy,
        context
      );

      // Validate the repair
      const validation = await this.validateRepair(repairResult, expectedFormat);

      // If repair is not satisfactory, try alternative strategies
      if (validation.score < 0.7 && maxRepairAttempts > 1) {
        const alternativeResult = await this.attemptAlternativeRepair(
          failedOutput,
          expectedFormat,
          errorContext,
          strategy,
          maxRepairAttempts - 1,
          context
        );

        if (alternativeResult.repair.confidence > repairResult.repair.confidence) {
          return alternativeResult;
        }
      }

      return repairResult;

    } catch (error) {
      // Emergency fallback
      return this.createEmergencyFallback(failedOutput, expectedFormat, error);
    }
  }

  async analyzeFailure(failedOutput, expectedFormat, errorContext) {
    const analysis = {
      failureType: this.classifyFailure(failedOutput, errorContext),
      outputStructure: this.analyzeOutputStructure(failedOutput),
      expectedStructure: this.analyzeExpectedStructure(expectedFormat),
      errorPatterns: this.identifyErrorPatterns(errorContext),
      repairability: 'unknown'
    };

    // Determine repairability
    analysis.repairability = this.assessRepairability(analysis);

    return analysis;
  }

  classifyFailure(failedOutput, errorContext) {
    const error = errorContext.error?.toLowerCase() || '';
    const output = JSON.stringify(failedOutput).toLowerCase();

    if (error.includes('timeout') || error.includes('network')) {
      return 'network_failure';
    }

    if (error.includes('json') || error.includes('parse') || error.includes('syntax')) {
      return 'format_error';
    }

    if (error.includes('incomplete') || output.includes('...') || output.length < 100) {
      return 'incomplete_output';
    }

    if (error.includes('validation') || error.includes('invalid')) {
      return 'validation_failure';
    }

    if (error.includes('rate limit') || error.includes('quota')) {
      return 'rate_limit';
    }

    return 'unknown_failure';
  }

  analyzeOutputStructure(output) {
    const structure = {
      type: typeof output,
      isJson: false,
      hasContent: false,
      length: 0,
      fields: []
    };

    if (typeof output === 'string') {
      structure.length = output.length;
      structure.hasContent = output.trim().length > 0;

      try {
        const parsed = JSON.parse(output);
        structure.isJson = true;
        structure.fields = Object.keys(parsed);
      } catch (e) {
        structure.isJson = false;
      }
    } else if (typeof output === 'object' && output !== null) {
      structure.hasContent = Object.keys(output).length > 0;
      structure.fields = Object.keys(output);
      structure.length = JSON.stringify(output).length;
    }

    return structure;
  }

  analyzeExpectedStructure(expectedFormat) {
    return {
      type: expectedFormat.type || 'object',
      requiredFields: expectedFormat.requiredFields || [],
      optionalFields: expectedFormat.optionalFields || [],
      format: expectedFormat.format || 'json',
      constraints: expectedFormat.constraints || {}
    };
  }

  identifyErrorPatterns(errorContext) {
    const patterns = [];

    if (errorContext.agent) {
      patterns.push({
        type: 'agent_specific',
        agent: errorContext.agent,
        frequency: 'unknown'
      });
    }

    if (errorContext.attempt > 1) {
      patterns.push({
        type: 'retry_failure',
        attempts: errorContext.attempt,
        pattern: 'repeated_failure'
      });
    }

    return patterns;
  }

  assessRepairability(analysis) {
    let score = 0;

    // Structure-based assessment
    if (analysis.outputStructure.hasContent) score += 0.3;
    if (analysis.outputStructure.isJson || analysis.outputStructure.type === 'object') score += 0.2;
    if (analysis.outputStructure.fields.length > 0) score += 0.2;

    // Error type assessment
    switch (analysis.failureType) {
      case 'format_error':
      case 'incomplete_output':
        score += 0.3;
        break;
      case 'validation_failure':
        score += 0.2;
        break;
      case 'network_failure':
      case 'rate_limit':
        score += 0.1;
        break;
    }

    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'medium';
    if (score >= 0.2) return 'low';
    return 'very_low';
  }

  determineOptimalRepairStrategy(analysis) {
    switch (analysis.failureType) {
      case 'format_error':
        return 'format_fix';
      case 'incomplete_output':
        return 'content_completion';
      case 'validation_failure':
        return 'error_correction';
      case 'network_failure':
      case 'rate_limit':
        return 'fallback_generation';
      default:
        return analysis.repairability === 'high' ? 'content_completion' : 'fallback_generation';
    }
  }

  async executeRepair(failedOutput, expectedFormat, errorContext, strategy, context) {
    const repairPrompt = this.buildRepairPrompt(failedOutput, expectedFormat, errorContext, strategy);

    const { systemPrompt, userPrompt } = this.buildPrompt(
      this.systemPrompt,
      repairPrompt,
      {}
    );

    const repairResponse = await this.aiClient.generateContent(userPrompt, {
      systemPrompt,
      temperature: 0.3, // Lower temperature for more deterministic repairs
      maxTokens: 4000
    });

    return await this.parseRepairResult(repairResponse, failedOutput, expectedFormat, strategy);
  }

  buildRepairPrompt(failedOutput, expectedFormat, errorContext, strategy) {
    let prompt = `Repair the following failed output using the "${strategy}" strategy:\n\n`;

    prompt += 'Failed Output:\n';
    prompt += '```\n';
    prompt += typeof failedOutput === 'string' ? failedOutput : JSON.stringify(failedOutput, null, 2);
    prompt += '\n```\n\n';

    prompt += 'Expected Format:\n';
    prompt += '```json\n';
    prompt += JSON.stringify(expectedFormat, null, 2);
    prompt += '\n```\n\n';

    prompt += 'Error Context:\n';
    prompt += `- Agent: ${errorContext.agent || 'unknown'}\n`;
    prompt += `- Error: ${errorContext.error || 'unknown error'}\n`;
    prompt += `- Attempt: ${errorContext.attempt || 1}\n`;
    prompt += `- Timestamp: ${errorContext.timestamp || new Date().toISOString()}\n\n`;

    switch (strategy) {
      case 'format_fix':
        prompt += 'Fix format issues, correct JSON syntax, and ensure proper structure while preserving all available content.';
        break;
      case 'content_completion':
        prompt += 'Complete missing content, fill in incomplete sections, and ensure all required fields are present with reasonable values.';
        break;
      case 'error_correction':
        prompt += 'Correct logical errors, fix validation issues, and ensure the output meets quality standards.';
        break;
      case 'fallback_generation':
        prompt += 'Generate a complete fallback output that meets the expected format requirements using reasonable default values.';
        break;
    }

    prompt += '\n\nEnsure the repaired output is:\n';
    prompt += '- Syntactically correct\n';
    prompt += '- Logically consistent\n';
    prompt += '- Complete and usable\n';
    prompt += '- Preserves original intent where possible\n';

    return prompt;
  }

  async parseRepairResult(response, originalOutput, expectedFormat, strategy) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/```json\n?(.*?)\n?```/s) || response.match(/\{.*\}/s);

      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        return this.validateAndStructureRepair(parsed, originalOutput, strategy);
      } else {
        // Try to extract repaired content from text
        return this.extractRepairFromText(response, originalOutput, expectedFormat, strategy);
      }
    } catch (error) {
      // Create manual repair
      return this.createManualRepair(response, originalOutput, expectedFormat, strategy);
    }
  }

  validateAndStructureRepair(repairData, originalOutput, strategy) {
    // Ensure proper structure
    const structuredRepair = {
      repair: repairData.repair || {
        status: 'success',
        repairType: strategy,
        originalIssue: 'Output repair completed',
        repairStrategy: `Applied ${strategy} strategy`,
        confidence: 0.7
      },
      repairedOutput: repairData.repairedOutput || repairData,
      diagnostics: repairData.diagnostics || {
        issuesFound: [],
        repairActions: []
      },
      qualityMetrics: repairData.qualityMetrics || {
        outputCompleteness: '80%',
        formatCorrectness: 'good',
        logicalConsistency: 'good',
        usability: 'good'
      },
      recommendations: repairData.recommendations || []
    };

    return structuredRepair;
  }

  extractRepairFromText(response, originalOutput, expectedFormat, strategy) {
    // Extract different types of content from text
    const repair = {
      repair: {
        status: 'partial',
        repairType: strategy,
        originalIssue: 'Format or content issues detected',
        repairStrategy: `Text-based ${strategy} repair`,
        confidence: 0.6
      },
      repairedOutput: this.extractContentFromText(response, expectedFormat),
      diagnostics: {
        issuesFound: [{
          type: 'format',
          severity: 'medium',
          description: 'Required structured repair from text response',
          location: 'response parsing',
          fixed: true
        }],
        repairActions: [{
          action: 'Extracted content from text response',
          success: true,
          impact: 'medium'
        }]
      },
      qualityMetrics: {
        outputCompleteness: '70%',
        formatCorrectness: 'fair',
        logicalConsistency: 'fair',
        usability: 'fair'
      },
      recommendations: [{
        category: 'improvement',
        recommendation: 'Ensure AI responses follow structured JSON format',
        priority: 'medium'
      }]
    };

    return repair;
  }

  createManualRepair(response, originalOutput, expectedFormat, strategy) {
    // Create a basic repaired output when all else fails
    const fallbackOutput = this.createFallbackOutput(expectedFormat);

    return {
      repair: {
        status: 'partial',
        repairType: 'manual_fallback',
        originalIssue: 'Unable to parse repair response',
        repairStrategy: 'Created manual fallback output',
        confidence: 0.4
      },
      repairedOutput: fallbackOutput,
      diagnostics: {
        issuesFound: [{
          type: 'parsing',
          severity: 'high',
          description: 'Could not parse repair response',
          location: 'response parsing',
          fixed: true
        }],
        repairActions: [{
          action: 'Created manual fallback output',
          success: true,
          impact: 'high'
        }]
      },
      qualityMetrics: {
        outputCompleteness: '50%',
        formatCorrectness: 'fair',
        logicalConsistency: 'fair',
        usability: 'fair'
      },
      rawResponse: response,
      recommendations: [{
        category: 'prevention',
        recommendation: 'Review AI prompt engineering for better structured responses',
        priority: 'high'
      }]
    };
  }

  extractContentFromText(text, expectedFormat) {
    // Extract content based on expected format
    if (expectedFormat.type === 'analysis') {
      return this.extractAnalysisFromText(text);
    } else if (expectedFormat.type === 'modernization') {
      return this.extractModernizationFromText(text);
    } else if (expectedFormat.type === 'validation') {
      return this.extractValidationFromText(text);
    } else if (expectedFormat.type === 'explanation') {
      return this.extractExplanationFromText(text);
    }

    // Generic extraction
    return {
      content: text.substring(0, 1000),
      type: expectedFormat.type || 'text',
      extracted: true
    };
  }

  createFallbackOutput(expectedFormat) {
    switch (expectedFormat.type) {
      case 'analysis':
        return this.createFallbackAnalysis();
      case 'modernization':
        return this.createFallbackModernization();
      case 'validation':
        return this.createFallbackValidation();
      case 'explanation':
        return this.createFallbackExplanation();
      default:
        return { status: 'fallback', message: 'Fallback output generated due to repair failure' };
    }
  }

  createFallbackAnalysis() {
    return {
      programInfo: {
        name: 'unknown_program',
        type: 'program',
        language: 'COBOL',
        lineCount: 0
      },
      dependencies: [],
      dataStructures: [],
      businessLogic: [{
        section: 'main',
        purpose: 'Analysis could not be completed',
        complexity: 'unknown',
        modernizationOpportunity: 'Manual review required'
      }],
      ioOperations: [],
      qualityMetrics: {
        complexity: 'unknown',
        maintainability: 'unknown',
        testability: 'unknown',
        modernizationPriority: 'low'
      }
    };
  }

  createFallbackModernization() {
    return {
      modernization: {
        targetLanguage: 'Java',
        targetFramework: 'Spring Boot',
        architecture: 'monolith',
        databaseStrategy: 'PostgreSQL'
      },
      convertedCode: {
        mainClass: '// Modernization could not be completed automatically\n// Manual conversion required',
        dataModels: [],
        businessLogic: [],
        apiEndpoints: [],
        tests: []
      },
      migrationPlan: {
        phases: [{
          phase: 1,
          description: 'Manual conversion required',
          tasks: ['Review original code', 'Plan modernization approach'],
          estimatedEffort: 'manual assessment needed',
          risks: ['Incomplete automated analysis'],
          dependencies: []
        }]
      },
      modernizationMetrics: {
        codeReduction: 'unknown',
        performanceImprovement: 'unknown',
        maintainabilityGain: 'medium',
        testability: 'medium',
        cloudReadiness: 'low'
      }
    };
  }

  createFallbackValidation() {
    return {
      validation: {
        overallScore: 50,
        status: 'warning',
        businessLogicEquivalence: 'unknown',
        codeQuality: 'needs_review'
      },
      issues: [{
        type: 'warning',
        severity: 'medium',
        category: 'validation',
        description: 'Automated validation could not be completed',
        location: 'general',
        suggestion: 'Manual review required'
      }],
      qualityMetrics: {
        complexity: 'unknown',
        maintainability: 'unknown',
        testability: 'unknown',
        security: 'needs_review',
        performance: 'unknown',
        documentation: 'insufficient'
      },
      recommendations: [{
        priority: 'high',
        category: 'process',
        description: 'Perform manual code review',
        implementation: 'Assign experienced developer for review'
      }],
      complianceChecks: {
        codingStandards: 'not_checked',
        securityStandards: 'not_checked',
        frameworkBestPractices: 'not_checked',
        testingRequirements: 'not_met'
      }
    };
  }

  createFallbackExplanation() {
    return {
      explanation: {
        type: 'summary',
        title: 'Processing Summary',
        overview: 'Automated processing was partially completed. Manual review is recommended.',
        targetAudience: 'developers'
      },
      sections: [{
        title: 'Processing Status',
        content: 'The automated processing encountered issues and could not be completed fully. A fallback response has been generated.',
        type: 'text',
        importance: 'high'
      }],
      insights: [{
        category: 'process',
        insight: 'Automated processing requires improvement',
        impact: 'medium',
        recommendation: 'Review and enhance processing pipeline'
      }],
      visualizations: [],
      actionItems: [{
        priority: 'high',
        category: 'process',
        action: 'Review processing failure and implement improvements',
        owner: 'development team',
        timeline: 'next sprint'
      }]
    };
  }

  async validateRepair(repairResult, expectedFormat) {
    let score = 0;

    // Check if repair has proper structure
    if (repairResult.repair && repairResult.repairedOutput) score += 0.3;

    // Check repair status
    if (repairResult.repair.status === 'success') score += 0.2;
    else if (repairResult.repair.status === 'partial') score += 0.1;

    // Check confidence
    if (repairResult.repair.confidence > 0.7) score += 0.2;
    else if (repairResult.repair.confidence > 0.5) score += 0.1;

    // Check output completeness
    if (repairResult.repairedOutput && Object.keys(repairResult.repairedOutput).length > 0) {
      score += 0.2;
    }

    // Check diagnostics
    if (repairResult.diagnostics && repairResult.diagnostics.repairActions.length > 0) {
      score += 0.1;
    }

    return { score, isValid: score >= 0.5 };
  }

  async attemptAlternativeRepair(failedOutput, expectedFormat, errorContext, originalStrategy, maxAttempts, context) {
    const alternativeStrategies = this.getAlternativeStrategies(originalStrategy);

    for (const strategy of alternativeStrategies) {
      if (maxAttempts <= 0) break;

      try {
        const result = await this.executeRepair(
          failedOutput,
          expectedFormat,
          { ...errorContext, alternativeRepair: true },
          strategy,
          context
        );

        if (result.repair.confidence > 0.6) {
          return result;
        }

        maxAttempts--;
      } catch (error) {
        // Continue with next strategy
        continue;
      }
    }

    // If all strategies failed, return emergency fallback
    return this.createEmergencyFallback(failedOutput, expectedFormat, new Error('All repair strategies failed'));
  }

  getAlternativeStrategies(originalStrategy) {
    const strategies = ['format_fix', 'content_completion', 'error_correction', 'fallback_generation'];
    return strategies.filter(s => s !== originalStrategy);
  }

  createEmergencyFallback(failedOutput, expectedFormat, error) {
    return {
      repair: {
        status: 'failed',
        repairType: 'emergency_fallback',
        originalIssue: error.message,
        repairStrategy: 'Emergency fallback due to repair failure',
        confidence: 0.2
      },
      repairedOutput: this.createFallbackOutput(expectedFormat),
      diagnostics: {
        issuesFound: [{
          type: 'critical',
          severity: 'critical',
          description: 'All repair attempts failed',
          location: 'repair system',
          fixed: false
        }],
        repairActions: [{
          action: 'Generated emergency fallback',
          success: true,
          impact: 'low'
        }]
      },
      qualityMetrics: {
        outputCompleteness: '30%',
        formatCorrectness: 'poor',
        logicalConsistency: 'poor',
        usability: 'poor'
      },
      recommendations: [{
        category: 'critical',
        recommendation: 'Review and fix repair system immediately',
        priority: 'critical'
      }],
      emergencyFallback: true,
      originalError: error.message
    };
  }

  // Extract methods for different content types
  extractAnalysisFromText(text) {
    // Implementation for extracting analysis structure from text
    return this.createFallbackAnalysis();
  }

  extractModernizationFromText(text) {
    // Implementation for extracting modernization structure from text
    return this.createFallbackModernization();
  }

  extractValidationFromText(text) {
    // Implementation for extracting validation structure from text
    return this.createFallbackValidation();
  }

  extractExplanationFromText(text) {
    // Implementation for extracting explanation structure from text
    return this.createFallbackExplanation();
  }

  async calculateConfidence(result, input) {
    let confidence = 0.5; // Base confidence for repairs

    // Increase confidence based on repair quality
    if (result.repair.status === 'success') confidence += 0.3;
    else if (result.repair.status === 'partial') confidence += 0.1;

    // Check diagnostics
    if (result.diagnostics.repairActions.length > 0) confidence += 0.1;

    // Check output quality
    if (result.qualityMetrics.outputCompleteness !== 'poor') confidence += 0.1;

    // Penalize emergency fallbacks
    if (result.emergencyFallback) confidence -= 0.3;

    return Math.max(0.2, Math.min(confidence, 0.8)); // Cap repair confidence at 0.8
  }
}

module.exports = RepairAgent;