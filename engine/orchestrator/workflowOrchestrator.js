const ParserAgent = require('../agents/parserAgent');
const ModernizerAgent = require('../agents/modernizerAgent');
const ValidatorAgent = require('../agents/validatorAgent');
const ExplainerAgent = require('../agents/explainerAgent');
const logger = require('../utils/logger');

class WorkflowOrchestrator {
  constructor(aiClient, memoryManager) {
    this.aiClient = aiClient;
    this.memoryManager = memoryManager;

    // Initialize agents
    this.parser = new ParserAgent(aiClient, memoryManager);
    this.modernizer = new ModernizerAgent(aiClient, memoryManager);
    this.validator = new ValidatorAgent(aiClient, memoryManager);
    this.explainer = new ExplainerAgent(aiClient, memoryManager);

    // Workflow configuration
    this.workflowConfig = {
      enableParallelProcessing: true,
      enableSelfHealing: true,
      confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD) || 0.8,
      maxRetries: parseInt(process.env.MAX_RETRY_ATTEMPTS) || 3,
      enableValidation: true,
      enableExplanation: true
    };

    // Active workflows
    this.activeWorkflows = new Map();
  }

  // Main orchestration method
  async executeWorkflow(input, workflowType = 'full_modernization', options = {}) {
    const workflowId = this.generateWorkflowId();
    const context = {
      workflowId,
      conversationId: options.conversationId || workflowId,
      startTime: Date.now(),
      ...options
    };

    try {
      logger.pipeline.workflow('workflow_started', {
        workflowId,
        workflowType,
        input: typeof input === 'string' ? input.substring(0, 100) : 'object'
      });

      this.activeWorkflows.set(workflowId, {
        type: workflowType,
        status: 'running',
        startTime: Date.now(),
        context
      });

      let result;

      switch (workflowType) {
        case 'parse_only':
          result = await this.executeParseWorkflow(input, context);
          break;
        case 'modernize_only':
          result = await this.executeModernizeWorkflow(input, context);
          break;
        case 'validate_only':
          result = await this.executeValidateWorkflow(input, context);
          break;
        case 'explain_only':
          result = await this.executeExplainWorkflow(input, context);
          break;
        case 'full_modernization':
        default:
          result = await this.executeFullModernizationWorkflow(input, context);
          break;
      }

      // Update workflow status
      this.activeWorkflows.set(workflowId, {
        ...this.activeWorkflows.get(workflowId),
        status: 'completed',
        endTime: Date.now(),
        result
      });

      logger.pipeline.workflow('workflow_completed', {
        workflowId,
        workflowType,
        duration: Date.now() - context.startTime,
        success: result.success
      });

      return {
        workflowId,
        success: true,
        result,
        metadata: {
          workflowType,
          duration: Date.now() - context.startTime,
          agentsUsed: this.getAgentsUsed(result)
        }
      };

    } catch (error) {
      // Update workflow status
      this.activeWorkflows.set(workflowId, {
        ...this.activeWorkflows.get(workflowId),
        status: 'failed',
        endTime: Date.now(),
        error: error.message
      });

      logger.pipeline.workflow('workflow_failed', {
        workflowId,
        workflowType,
        error: error.message,
        duration: Date.now() - context.startTime
      });

      return {
        workflowId,
        success: false,
        error: error.message,
        metadata: {
          workflowType,
          duration: Date.now() - context.startTime
        }
      };
    } finally {
      // Clean up after some time
      setTimeout(() => {
        this.activeWorkflows.delete(workflowId);
      }, 300000); // 5 minutes
    }
  }

  // Full modernization workflow: Parse -> Modernize -> Validate -> Explain
  async executeFullModernizationWorkflow(input, context) {
    const results = {
      parsing: null,
      modernization: null,
      validation: null,
      explanation: null
    };

    try {
      // Step 1: Parse the legacy code
      console.log(`\n[INFO] [${new Date().toLocaleTimeString()}] 🚀 Step 1/4: Starting Parser Agent...`);
      logger.pipeline.workflow('parse_step', { workflowId: context.workflowId });
      results.parsing = await this.executeParseStep(input, context);
      console.log(`[SUCCESS] [${new Date().toLocaleTimeString()}] ✅ Parser Agent completed.`);

      if (!results.parsing.success) {
        throw new Error(`Parsing failed: ${results.parsing.error}`);
      }

      // Step 2: Modernize based on analysis
      console.log(`\n[INFO] [${new Date().toLocaleTimeString()}] 🚀 Step 2/4: Starting Modernizer Agent...`);
      logger.pipeline.workflow('modernize_step', { workflowId: context.workflowId });
      results.modernization = await this.executeModernizeStep(
        {
          analysisResult: results.parsing.data,
          targetLanguage: context.targetLanguage || 'Java',
          targetFramework: context.targetFramework,
          modernizationStyle: context.modernizationStyle || 'gradual',
          originalCode: input.code
        },
        context
      );
      console.log(`[SUCCESS] [${new Date().toLocaleTimeString()}] ✅ Modernizer Agent completed.`);

      if (!results.modernization.success) {
        // Try self-healing
        if (this.workflowConfig.enableSelfHealing) {
          console.log(`[INFO] [${new Date().toLocaleTimeString()}] 🩹 Attempting self-healing for Modernizer...`);
          results.modernization = await this.attemptSelfHealing(
            'modernization',
            results.modernization,
            context
          );
        }

        if (!results.modernization.success) {
          throw new Error(`Modernization failed: ${results.modernization.error}`);
        }
      }

      // Step 3: Validate the modernized code
      if (this.workflowConfig.enableValidation) {
        console.log(`\n[INFO] [${new Date().toLocaleTimeString()}] 🚀 Step 3/4: Starting Validator Agent...`);
        logger.pipeline.workflow('validate_step', { workflowId: context.workflowId });
        results.validation = await this.executeValidateStep(
          {
            modernizedCode: results.modernization.data,
            originalAnalysis: results.parsing.data,
            targetLanguage: context.targetLanguage || 'Java',
            securityLevel: context.securityLevel || 'standard'
          },
          context
        );
        console.log(`[SUCCESS] [${new Date().toLocaleTimeString()}] ✅ Validator Agent completed.`);

        // Check if validation passed
        if (results.validation.success &&
            results.validation.data.validation.overallScore < 70) {
          logger.pipeline.workflow('validation_concerns', {
            workflowId: context.workflowId,
            score: results.validation.data.validation.overallScore
          });
        }
      }

      // Step 4: Generate explanation
      if (this.workflowConfig.enableExplanation) {
        console.log(`\n[INFO] [${new Date().toLocaleTimeString()}] 🚀 Step 4/4: Starting Explainer Agent...`);
        logger.pipeline.workflow('explain_step', { workflowId: context.workflowId });
        results.explanation = await this.executeExplainStep(
          {
            data: {
              parsing: results.parsing.data,
              modernization: results.modernization.data,
              validation: results.validation?.data
            },
            explanationType: context.explanationType || 'technical',
            targetAudience: context.targetAudience || 'developers',
            includeCode: context.includeCode !== false,
            includeMetrics: context.includeMetrics !== false
          },
          context
        );
        console.log(`[SUCCESS] [${new Date().toLocaleTimeString()}] ✅ Explainer Agent completed.`);
      }

      return {
        success: true,
        data: results,
        metadata: {
          confidence: this.calculateOverallConfidence(results),
          processingTime: Date.now() - context.startTime,
          stepsCompleted: Object.keys(results).filter(key => results[key]?.success).length
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: results,
        metadata: {
          confidence: 0,
          processingTime: Date.now() - context.startTime,
          stepsCompleted: Object.keys(results).filter(key => results[key]?.success).length,
          failedAt: this.identifyFailurePoint(results)
        }
      };
    }
  }

  // Individual workflow executions
  async executeParseWorkflow(input, context) {
    const result = await this.executeParseStep(input, context);
    return {
      success: result.success,
      data: { parsing: result },
      metadata: {
        confidence: result.confidence || 0,
        processingTime: Date.now() - context.startTime
      }
    };
  }

  async executeModernizeWorkflow(input, context) {
    const result = await this.executeModernizeStep(input, context);
    return {
      success: result.success,
      data: { modernization: result },
      metadata: {
        confidence: result.confidence || 0,
        processingTime: Date.now() - context.startTime
      }
    };
  }

  async executeValidateWorkflow(input, context) {
    const result = await this.executeValidateStep(input, context);
    return {
      success: result.success,
      data: { validation: result },
      metadata: {
        confidence: result.confidence || 0,
        processingTime: Date.now() - context.startTime
      }
    };
  }

  async executeExplainWorkflow(input, context) {
    const result = await this.executeExplainStep(input, context);
    return {
      success: result.success,
      data: { explanation: result },
      metadata: {
        confidence: result.confidence || 0,
        processingTime: Date.now() - context.startTime
      }
    };
  }

  // Individual step executions
  async executeParseStep(input, context) {
    return await this.parser.execute(input, context);
  }

  async executeModernizeStep(input, context) {
    return await this.modernizer.execute(input, context);
  }

  async executeValidateStep(input, context) {
    return await this.validator.execute(input, context);
  }

  async executeExplainStep(input, context) {
    return await this.explainer.execute(input, context);
  }

  // Self-healing mechanism
  async attemptSelfHealing(stepName, failedResult, context) {
    logger.pipeline.workflow('self_healing_attempt', {
      workflowId: context.workflowId,
      step: stepName,
      error: failedResult.error
    });

    try {
      // Analyze the failure
      const healingStrategy = this.determineHealingStrategy(stepName, failedResult);

      switch (healingStrategy) {
        case 'retry_with_modified_input':
          return await this.retryWithModifiedInput(stepName, failedResult, context);
        case 'fallback_to_simpler_approach':
          return await this.fallbackToSimplerApproach(stepName, failedResult, context);
        case 'partial_processing':
          return await this.attemptPartialProcessing(stepName, failedResult, context);
        default:
          return failedResult; // No healing possible
      }
    } catch (healingError) {
      logger.pipeline.workflow('self_healing_failed', {
        workflowId: context.workflowId,
        step: stepName,
        healingError: healingError.message
      });
      return failedResult;
    }
  }

  determineHealingStrategy(stepName, failedResult) {
    const error = failedResult.error?.toLowerCase() || '';

    if (error.includes('timeout') || error.includes('rate limit')) {
      return 'retry_with_modified_input';
    }

    if (error.includes('complex') || error.includes('too large')) {
      return 'partial_processing';
    }

    if (error.includes('format') || error.includes('syntax')) {
      return 'fallback_to_simpler_approach';
    }

    return 'retry_with_modified_input';
  }

  async retryWithModifiedInput(stepName, failedResult, context) {
    // Implement retry logic with modified parameters
    const modifiedContext = {
      ...context,
      attempt: (context.attempt || 1) + 1,
      selfHealing: true
    };

    // Reduce complexity for retry
    if (stepName === 'modernization') {
      modifiedContext.modernizationStyle = 'conservative';
    }

    // Retry the step
    switch (stepName) {
      case 'modernization':
        return await this.executeModernizeStep(failedResult.input, modifiedContext);
      default:
        return failedResult;
    }
  }

  async fallbackToSimplerApproach(stepName, failedResult, context) {
    // Implement fallback to simpler processing
    const fallbackContext = {
      ...context,
      fallbackMode: true,
      simplifiedProcessing: true
    };

    // Use simpler parameters
    switch (stepName) {
      case 'modernization':
        return await this.executeModernizeStep({
          ...failedResult.input,
          modernizationStyle: 'conservative',
          targetFramework: null // Use default
        }, fallbackContext);
      default:
        return failedResult;
    }
  }

  async attemptPartialProcessing(stepName, failedResult, context) {
    // Break down large inputs into smaller chunks
    logger.pipeline.workflow('partial_processing', {
      workflowId: context.workflowId,
      step: stepName
    });

    // This would implement chunking logic for large inputs
    // For now, return the original failure
    return failedResult;
  }

  // Utility methods
  generateWorkflowId() {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  calculateOverallConfidence(results) {
    const confidences = [];

    if (results.parsing?.confidence) confidences.push(results.parsing.confidence);
    if (results.modernization?.confidence) confidences.push(results.modernization.confidence);
    if (results.validation?.confidence) confidences.push(results.validation.confidence);
    if (results.explanation?.confidence) confidences.push(results.explanation.confidence);

    if (confidences.length === 0) return 0;

    // Weighted average (parsing and modernization are more important)
    const weights = {
      parsing: 0.3,
      modernization: 0.4,
      validation: 0.2,
      explanation: 0.1
    };

    let weightedSum = 0;
    let totalWeight = 0;

    if (results.parsing?.confidence) {
      weightedSum += results.parsing.confidence * weights.parsing;
      totalWeight += weights.parsing;
    }

    if (results.modernization?.confidence) {
      weightedSum += results.modernization.confidence * weights.modernization;
      totalWeight += weights.modernization;
    }

    if (results.validation?.confidence) {
      weightedSum += results.validation.confidence * weights.validation;
      totalWeight += weights.validation;
    }

    if (results.explanation?.confidence) {
      weightedSum += results.explanation.confidence * weights.explanation;
      totalWeight += weights.explanation;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  getAgentsUsed(result) {
    const agents = [];
    if (result.data?.parsing) agents.push('ParserAgent');
    if (result.data?.modernization) agents.push('ModernizerAgent');
    if (result.data?.validation) agents.push('ValidatorAgent');
    if (result.data?.explanation) agents.push('ExplainerAgent');
    return agents;
  }

  identifyFailurePoint(results) {
    if (!results.parsing?.success) return 'parsing';
    if (!results.modernization?.success) return 'modernization';
    if (!results.validation?.success) return 'validation';
    if (!results.explanation?.success) return 'explanation';
    return 'unknown';
  }

  // Workflow monitoring and management
  getWorkflowStatus(workflowId) {
    return this.activeWorkflows.get(workflowId) || null;
  }

  getActiveWorkflows() {
    return Array.from(this.activeWorkflows.entries()).map(([id, workflow]) => ({
      id,
      ...workflow
    }));
  }

  cancelWorkflow(workflowId) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (workflow && workflow.status === 'running') {
      workflow.status = 'cancelled';
      workflow.endTime = Date.now();
      logger.pipeline.workflow('workflow_cancelled', { workflowId });
      return true;
    }
    return false;
  }

  // Configuration management
  updateWorkflowConfig(newConfig) {
    this.workflowConfig = { ...this.workflowConfig, ...newConfig };
    logger.pipeline.workflow('config_updated', { newConfig });
  }

  getWorkflowConfig() {
    return { ...this.workflowConfig };
  }

  // Batch processing
  async executeBatchWorkflow(inputs, workflowType = 'full_modernization', options = {}) {
    const batchId = `batch_${Date.now()}`;
    logger.pipeline.workflow('batch_started', {
      batchId,
      inputCount: inputs.length,
      workflowType
    });

    const results = [];
    const batchOptions = { ...options, batchId };

    // Process in parallel if enabled
    if (this.workflowConfig.enableParallelProcessing && inputs.length <= 5) {
      const promises = inputs.map((input, index) =>
        this.executeWorkflow(input, workflowType, {
          ...batchOptions,
          batchIndex: index
        })
      );

      results.push(...await Promise.allSettled(promises));
    } else {
      // Process sequentially for large batches
      for (let i = 0; i < inputs.length; i++) {
        const result = await this.executeWorkflow(inputs[i], workflowType, {
          ...batchOptions,
          batchIndex: i
        });
        results.push({ status: 'fulfilled', value: result });

        // Rate limiting for large batches
        if (i < inputs.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    logger.pipeline.workflow('batch_completed', {
      batchId,
      successful,
      failed,
      total: results.length
    });

    return {
      batchId,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason }),
      summary: {
        total: results.length,
        successful,
        failed,
        successRate: successful / results.length
      }
    };
  }
}

module.exports = WorkflowOrchestrator;
