const RepairAgent = require('./repairAgent');
const logger = require('../utils/logger');

class SelfHealingPipeline {
  constructor(aiClient, memoryManager) {
    this.aiClient = aiClient;
    this.memoryManager = memoryManager;
    this.repairAgent = new RepairAgent(aiClient, memoryManager);

    // Healing configuration
    this.config = {
      enableAutoHealing: true,
      maxHealingAttempts: 3,
      healingTimeout: 30000, // 30 seconds
      confidenceThreshold: 0.6,
      enableProactiveHealing: true,
      healingStrategies: [
        'immediate_repair',
        'retry_with_modifications',
        'fallback_generation',
        'partial_processing'
      ]
    };

    // Healing statistics
    this.stats = {
      totalHealingAttempts: 0,
      successfulHealings: 0,
      failedHealings: 0,
      healingsByType: {},
      averageHealingTime: 0
    };

    // Failure patterns tracking
    this.failurePatterns = new Map();
    this.healingHistory = [];
  }

  // Main healing orchestration method
  async healWorkflowFailure(failureContext) {
    if (!this.config.enableAutoHealing) {
      logger.info('🚫 Auto-healing disabled, skipping healing attempt');
      return { healed: false, reason: 'auto_healing_disabled' };
    }

    const healingId = this.generateHealingId();
    const startTime = Date.now();

    try {
      logger.info('🏥 Starting self-healing process', {
        healingId,
        agent: failureContext.agent,
        error: failureContext.error
      });

      this.stats.totalHealingAttempts++;

      // Analyze the failure
      const analysis = await this.analyzeFailure(failureContext);

      // Determine healing strategy
      const strategy = this.selectHealingStrategy(analysis);

      // Execute healing
      const healingResult = await this.executeHealing(
        failureContext,
        strategy,
        healingId
      );

      // Record healing attempt
      this.recordHealingAttempt(healingId, failureContext, strategy, healingResult, startTime);

      if (healingResult.success) {
        this.stats.successfulHealings++;
        logger.info('✅ Self-healing successful', {
          healingId,
          strategy: strategy.type,
          confidence: healingResult.confidence,
          duration: Date.now() - startTime
        });

        // Learn from successful healing
        await this.learnFromHealing(failureContext, strategy, healingResult);

        return {
          healed: true,
          healingId,
          strategy: strategy.type,
          result: healingResult.data,
          confidence: healingResult.confidence,
          metadata: {
            duration: Date.now() - startTime,
            attempts: healingResult.attempts || 1
          }
        };
      } else {
        this.stats.failedHealings++;
        logger.warn('❌ Self-healing failed', {
          healingId,
          strategy: strategy.type,
          error: healingResult.error,
          duration: Date.now() - startTime
        });

        return {
          healed: false,
          healingId,
          strategy: strategy.type,
          error: healingResult.error,
          metadata: {
            duration: Date.now() - startTime,
            attempts: healingResult.attempts || 1
          }
        };
      }

    } catch (error) {
      this.stats.failedHealings++;
      logger.error('💥 Self-healing process failed', {
        healingId,
        error: error.message,
        duration: Date.now() - startTime
      });

      return {
        healed: false,
        healingId,
        error: error.message,
        metadata: {
          duration: Date.now() - startTime,
          systemError: true
        }
      };
    }
  }

  async analyzeFailure(failureContext) {
    const analysis = {
      failureType: this.classifyFailure(failureContext),
      severity: this.assessFailureSeverity(failureContext),
      repairability: 'unknown',
      historicalPattern: this.checkHistoricalPatterns(failureContext),
      agentSpecific: this.getAgentSpecificContext(failureContext),
      systemContext: this.getSystemContext(failureContext)
    };

    // Assess repairability
    analysis.repairability = this.assessRepairability(analysis);

    return analysis;
  }

  classifyFailure(failureContext) {
    const { error, agent, metadata } = failureContext;
    const errorMsg = error?.toLowerCase() || '';

    if (errorMsg.includes('timeout') || errorMsg.includes('network')) {
      return 'network_timeout';
    }

    if (errorMsg.includes('parse') || errorMsg.includes('json') || errorMsg.includes('format')) {
      return 'format_error';
    }

    if (errorMsg.includes('confidence') || errorMsg.includes('quality')) {
      return 'quality_issue';
    }

    if (errorMsg.includes('validation') || errorMsg.includes('invalid')) {
      return 'validation_failure';
    }

    if (errorMsg.includes('rate limit') || errorMsg.includes('quota')) {
      return 'rate_limit';
    }

    if (metadata?.attempt > 1) {
      return 'repeated_failure';
    }

    if (agent) {
      return `${agent.toLowerCase()}_specific`;
    }

    return 'unknown_failure';
  }

  assessFailureSeverity(failureContext) {
    const { error, metadata, agent } = failureContext;

    // Critical if it's a core agent failure
    if (['ParserAgent', 'ModernizerAgent'].includes(agent)) {
      return 'critical';
    }

    // High if multiple attempts failed
    if (metadata?.attempt > 2) {
      return 'high';
    }

    // High if it's a system-level error
    if (error?.includes('system') || error?.includes('memory')) {
      return 'high';
    }

    // Medium for validation and explanation failures
    if (['ValidatorAgent', 'ExplainerAgent'].includes(agent)) {
      return 'medium';
    }

    return 'low';
  }

  checkHistoricalPatterns(failureContext) {
    const pattern = `${failureContext.agent}_${this.classifyFailure(failureContext)}`;
    const history = this.failurePatterns.get(pattern) || { count: 0, lastSeen: null };

    history.count++;
    history.lastSeen = Date.now();
    this.failurePatterns.set(pattern, history);

    return {
      pattern,
      frequency: history.count,
      isRecurring: history.count > 3,
      lastSeen: history.lastSeen
    };
  }

  getAgentSpecificContext(failureContext) {
    const { agent, input, output } = failureContext;

    const context = {
      agent,
      inputType: typeof input,
      outputType: typeof output,
      hasOutput: !!output,
      outputSize: output ? JSON.stringify(output).length : 0
    };

    // Agent-specific analysis
    switch (agent) {
      case 'ParserAgent':
        context.codeComplexity = this.assessCodeComplexity(input);
        break;
      case 'ModernizerAgent':
        context.targetLanguage = input?.targetLanguage || 'unknown';
        context.hasAnalysis = !!input?.analysisResult;
        break;
      case 'ValidatorAgent':
        context.hasModernizedCode = !!input?.modernizedCode;
        context.hasOriginalAnalysis = !!input?.originalAnalysis;
        break;
      case 'ExplainerAgent':
        context.explanationType = input?.explanationType || 'unknown';
        context.hasData = !!input?.data;
        break;
    }

    return context;
  }

  getSystemContext(failureContext) {
    return {
      timestamp: Date.now(),
      memoryUsage: process.memoryUsage(),
      activeWorkflows: this.getActiveWorkflowCount(),
      systemLoad: this.getSystemLoadEstimate(),
      healingHistory: this.healingHistory.length
    };
  }

  assessRepairability(analysis) {
    let score = 0;

    // Base repairability by failure type
    switch (analysis.failureType) {
      case 'format_error':
      case 'validation_failure':
        score += 0.4;
        break;
      case 'quality_issue':
      case 'timeout':
        score += 0.3;
        break;
      case 'network_timeout':
      case 'rate_limit':
        score += 0.2;
        break;
      case 'unknown_failure':
      case 'repeated_failure':
        score += 0.1;
        break;
    }

    // Adjust based on severity
    switch (analysis.severity) {
      case 'low':
        score += 0.3;
        break;
      case 'medium':
        score += 0.2;
        break;
      case 'high':
        score += 0.1;
        break;
      case 'critical':
        score += 0.0;
        break;
    }

    // Historical success factor
    if (analysis.historicalPattern.isRecurring) {
      score += 0.2; 
    }

    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'medium';
    if (score >= 0.2) return 'low';
    return 'very_low';
  }

  selectHealingStrategy(analysis) {
    const strategies = [];

    // Select strategies based on failure type and repairability
    switch (analysis.failureType) {
      case 'format_error':
      case 'validation_failure':
        strategies.push({
          type: 'immediate_repair',
          priority: 1,
          expectedSuccess: 0.8,
          timeoutMs: 15000
        });
        break;

      case 'quality_issue':
        strategies.push({
          type: 'retry_with_modifications',
          priority: 1,
          expectedSuccess: 0.7,
          timeoutMs: 20000
        });
        break;

      case 'network_timeout':
      case 'rate_limit':
        strategies.push({
          type: 'retry_with_modifications',
          priority: 1,
          expectedSuccess: 0.6,
          timeoutMs: 30000,
          delay: 5000
        });
        break;

      case 'repeated_failure':
        strategies.push({
          type: 'fallback_generation',
          priority: 1,
          expectedSuccess: 0.5,
          timeoutMs: 10000
        });
        break;

      default:
        strategies.push({
          type: 'immediate_repair',
          priority: 2,
          expectedSuccess: 0.6,
          timeoutMs: 15000
        });
        strategies.push({
          type: 'fallback_generation',
          priority: 1,
          expectedSuccess: 0.4,
          timeoutMs: 10000
        });
    }

    // Add partial processing for complex failures
    if (analysis.severity === 'high' || analysis.repairability === 'low') {
      strategies.push({
        type: 'partial_processing',
        priority: 3,
        expectedSuccess: 0.3,
        timeoutMs: 25000
      });
    }

    // Sort by priority (lower number = higher priority)
    strategies.sort((a, b) => a.priority - b.priority);

    return strategies[0] || {
      type: 'fallback_generation',
      priority: 99,
      expectedSuccess: 0.2,
      timeoutMs: 5000
    };
  }

  async executeHealing(failureContext, strategy, healingId) {
    const startTime = Date.now();

    try {
      logger.info('🔧 Executing healing strategy', {
        healingId,
        strategy: strategy.type,
        expectedSuccess: strategy.expectedSuccess
      });

      let result;

      switch (strategy.type) {
        case 'immediate_repair':
          result = await this.executeImmediateRepair(failureContext, strategy);
          break;
        case 'retry_with_modifications':
          result = await this.executeRetryWithModifications(failureContext, strategy);
          break;
        case 'fallback_generation':
          result = await this.executeFallbackGeneration(failureContext, strategy);
          break;
        case 'partial_processing':
          result = await this.executePartialProcessing(failureContext, strategy);
          break;
        default:
          throw new Error(`Unknown healing strategy: ${strategy.type}`);
      }

      return {
        success: true,
        data: result,
        confidence: result.confidence || strategy.expectedSuccess,
        strategy: strategy.type,
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        strategy: strategy.type,
        duration: Date.now() - startTime
      };
    }
  }

  async executeImmediateRepair(failureContext, strategy) {
    // Use repair agent to fix the failed output
    const repairInput = {
      failedOutput: failureContext.output || failureContext.error,
      expectedFormat: this.getExpectedFormat(failureContext.agent),
      errorContext: {
        agent: failureContext.agent,
        error: failureContext.error,
        attempt: failureContext.metadata?.attempt || 1,
        timestamp: Date.now()
      }
    };

    const repairResult = await this.repairAgent.execute(repairInput, {
      conversationId: failureContext.conversationId,
      healingAttempt: true
    });

    if (repairResult.success) {
      return repairResult.data.repairedOutput;
    } else {
      throw new Error(`Repair failed: ${repairResult.error}`);
    }
  }

  async executeRetryWithModifications(failureContext, strategy) {
    // Delay if specified
    if (strategy.delay) {
      await this.delay(strategy.delay);
    }

    // Modify the input to increase success chances
    const modifiedInput = this.modifyInputForRetry(failureContext);

    // Get the appropriate agent
    const agent = this.getAgentByName(failureContext.agent);
    if (!agent) {
      throw new Error(`Agent not found: ${failureContext.agent}`);
    }

    // Retry with modified input
    const retryResult = await agent.execute(modifiedInput, {
      ...failureContext.context,
      healingRetry: true,
      simplifiedProcessing: true
    });

    if (retryResult.success) {
      return retryResult.data;
    } else {
      throw new Error(`Retry failed: ${retryResult.error}`);
    }
  }

  async executeFallbackGeneration(failureContext, strategy) {
    // Generate a fallback output using minimal processing
    const expectedFormat = this.getExpectedFormat(failureContext.agent);
    const fallbackOutput = this.generateFallbackOutput(failureContext.agent, expectedFormat);

    return {
      ...fallbackOutput,
      metadata: {
        healingType: 'fallback',
        originalAgent: failureContext.agent,
        confidence: 0.3
      }
    };
  }

  async executePartialProcessing(failureContext, strategy) {
    // Break down the input into smaller, manageable pieces
    const chunks = this.chunkInput(failureContext.input);
    const partialResults = [];

    for (const chunk of chunks) {
      try {
        const agent = this.getAgentByName(failureContext.agent);
        const result = await agent.execute(chunk, {
          ...failureContext.context,
          partialProcessing: true
        });

        if (result.success) {
          partialResults.push(result.data);
        }
      } catch (error) {
        // Continue with other chunks
        continue;
      }
    }

    if (partialResults.length > 0) {
      return this.combinePartialResults(partialResults, failureContext.agent);
    } else {
      throw new Error('All partial processing attempts failed');
    }
  }

  // Helper methods
  getExpectedFormat(agentName) {
    const formats = {
      ParserAgent: {
        type: 'analysis',
        requiredFields: ['programInfo', 'dependencies', 'dataStructures'],
        format: 'json'
      },
      ModernizerAgent: {
        type: 'modernization',
        requiredFields: ['modernization', 'convertedCode', 'migrationPlan'],
        format: 'json'
      },
      ValidatorAgent: {
        type: 'validation',
        requiredFields: ['validation', 'issues', 'qualityMetrics'],
        format: 'json'
      },
      ExplainerAgent: {
        type: 'explanation',
        requiredFields: ['explanation', 'sections', 'insights'],
        format: 'json'
      }
    };

    return formats[agentName] || { type: 'generic', format: 'json' };
  }

  modifyInputForRetry(failureContext) {
    const modified = { ...failureContext.input };

    // Agent-specific modifications
    switch (failureContext.agent) {
      case 'ParserAgent':
        if (modified.code && modified.code.length > 5000) {
          modified.code = modified.code.substring(0, 5000);
        }
        modified.analysisType = 'quick';
        break;

      case 'ModernizerAgent':
        modified.modernizationStyle = 'conservative';
        modified.targetFramework = null; // Use defaults
        break;

      case 'ValidatorAgent':
        modified.validationType = 'basic';
        modified.securityLevel = 'standard';
        break;

      case 'ExplainerAgent':
        modified.format = 'brief';
        modified.includeCode = false;
        break;
    }

    return modified;
  }

  generateFallbackOutput(agentName, expectedFormat) {
    // Generate minimal valid output for each agent type
    switch (agentName) {
      case 'ParserAgent':
        return this.repairAgent.createFallbackAnalysis();
      case 'ModernizerAgent':
        return this.repairAgent.createFallbackModernization();
      case 'ValidatorAgent':
        return this.repairAgent.createFallbackValidation();
      case 'ExplainerAgent':
        return this.repairAgent.createFallbackExplanation();
      default:
        return { status: 'fallback', message: 'Fallback output generated' };
    }
  }

  chunkInput(input) {
    // Simple chunking strategy - in production this would be more sophisticated
    if (input.code && input.code.length > 2000) {
      const chunks = [];
      const codeChunks = this.chunkCode(input.code, 2000);

      codeChunks.forEach((chunk, index) => {
        chunks.push({
          ...input,
          code: chunk,
          chunkIndex: index,
          totalChunks: codeChunks.length
        });
      });

      return chunks;
    }

    return [input]; // No chunking needed
  }

  chunkCode(code, maxLength) {
    const chunks = [];
    let currentChunk = '';

    const lines = code.split('\n');
    for (const line of lines) {
      if (currentChunk.length + line.length > maxLength && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = line;
      } else {
        currentChunk += (currentChunk ? '\n' : '') + line;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  combinePartialResults(partialResults, agentName) {
    // Combine partial results into a single coherent output
    switch (agentName) {
      case 'ParserAgent':
        return this.combineAnalysisResults(partialResults);
      case 'ModernizerAgent':
        return this.combineModernizationResults(partialResults);
      default:
        return partialResults[0]; // Return first successful result
    }
  }

  combineAnalysisResults(results) {
    const combined = {
      programInfo: results[0]?.programInfo || { name: 'combined', type: 'program', language: 'COBOL' },
      dependencies: [],
      dataStructures: [],
      businessLogic: [],
      ioOperations: [],
      qualityMetrics: results[0]?.qualityMetrics || {}
    };

    results.forEach(result => {
      if (result.dependencies) combined.dependencies.push(...result.dependencies);
      if (result.dataStructures) combined.dataStructures.push(...result.dataStructures);
      if (result.businessLogic) combined.businessLogic.push(...result.businessLogic);
      if (result.ioOperations) combined.ioOperations.push(...result.ioOperations);
    });

    return combined;
  }

  combineModernizationResults(results) {
    // Take the most complete modernization result
    return results.reduce((best, current) => {
      const currentScore = this.scoreModernizationCompleteness(current);
      const bestScore = this.scoreModernizationCompleteness(best);
      return currentScore > bestScore ? current : best;
    });
  }

  scoreModernizationCompleteness(result) {
    let score = 0;
    if (result.convertedCode?.mainClass) score += 0.4;
    if (result.migrationPlan?.phases?.length > 0) score += 0.3;
    if (result.modernizationMetrics) score += 0.3;
    return score;
  }

  getAgentByName(agentName) {
    // This would typically be injected or retrieved from a registry
    // For now, return null to indicate agent not directly accessible
    return null;
  }

  // Learning and improvement methods
  async learnFromHealing(failureContext, strategy, healingResult) {
    const learningData = {
      failureType: this.classifyFailure(failureContext),
      strategy: strategy.type,
      success: healingResult.success,
      confidence: healingResult.confidence,
      duration: healingResult.duration,
      timestamp: Date.now()
    };

    // Store learning data for future improvements
    this.healingHistory.push(learningData);

    // Keep only recent history
    if (this.healingHistory.length > 1000) {
      this.healingHistory = this.healingHistory.slice(-1000);
    }

    // Update strategy success rates
    this.updateStrategyMetrics(strategy.type, healingResult.success);
  }

  updateStrategyMetrics(strategyType, success) {
    if (!this.stats.healingsByType[strategyType]) {
      this.stats.healingsByType[strategyType] = {
        attempts: 0,
        successes: 0,
        successRate: 0
      };
    }

    const metrics = this.stats.healingsByType[strategyType];
    metrics.attempts++;
    if (success) metrics.successes++;
    metrics.successRate = metrics.successes / metrics.attempts;
  }

  recordHealingAttempt(healingId, failureContext, strategy, result, startTime) {
    const duration = Date.now() - startTime;

    // Update average healing time
    const totalTime = this.stats.averageHealingTime * (this.stats.totalHealingAttempts - 1) + duration;
    this.stats.averageHealingTime = totalTime / this.stats.totalHealingAttempts;

    logger.info('📊 Healing attempt recorded', {
      healingId,
      agent: failureContext.agent,
      strategy: strategy.type,
      success: result.success,
      duration,
      averageHealingTime: this.stats.averageHealingTime
    });
  }

  // Utility methods
  generateHealingId() {
    return `healing_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  assessCodeComplexity(input) {
    if (!input?.code) return 'unknown';
    const lines = input.code.split('\n').length;
    if (lines > 1000) return 'high';
    if (lines > 500) return 'medium';
    return 'low';
  }

  getActiveWorkflowCount() {
    // This would typically be retrieved from the orchestrator
    return 0;
  }

  getSystemLoadEstimate() {
    // Simple CPU usage estimation
    return process.cpuUsage().user / 1000000; // Convert to seconds
  }

  // Public interface methods
  getHealingStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalHealingAttempts > 0
        ? this.stats.successfulHealings / this.stats.totalHealingAttempts
        : 0,
      failurePatternCount: this.failurePatterns.size,
      recentHealingHistory: this.healingHistory.slice(-10)
    };
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    logger.info('🔧 Self-healing configuration updated', newConfig);
  }

  getConfig() {
    return { ...this.config };
  }

  clearHistory() {
    this.healingHistory = [];
    this.failurePatterns.clear();
    logger.info('🧹 Healing history cleared');
  }
}

module.exports = SelfHealingPipeline;
