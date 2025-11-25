const logger = require('../utils/logger');

class BaseAgent {
  constructor(name, aiClient, memoryManager) {
    this.name = name;
    this.aiClient = aiClient;
    this.memoryManager = memoryManager;
    this.maxRetries = parseInt(process.env.MAX_RETRY_ATTEMPTS) || 3;
    this.confidenceThreshold = parseFloat(process.env.CONFIDENCE_THRESHOLD) || 0.8;
  }

  async execute(input, context = {}) {
    const { attempt = 1, conversationId = null } = context;
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });

    try {
      // ========== AGENT INPUT LOGGING ==========
      console.log(`\n[INFO] [${timestamp}] 🤖 ${this.name}: Starting processing...`);
      console.log(`[LOG]  [${timestamp}] 📥 ${this.name} received input data.`);

      const inputPreview = typeof input === 'string'
        ? input.substring(0, 100)
        : JSON.stringify(input).substring(0, 100);
      console.log(`[LOG]  [${timestamp}] 📄 Input preview: ${inputPreview}...`);

      logger.pipeline.start(this.name, input);

      // Pre-processing
      const processedInput = await this.preProcess(input, context);

      // Main execution
      console.log(`[LOG]  [${timestamp}] ⚙️  ${this.name} sending prompt to AI Client.`);
      const result = await this.process(processedInput, context);
      console.log(`[LOG]  [${timestamp}] 📨 ${this.name} received response from AI Client.`);

      // Post-processing
      const finalResult = await this.postProcess(result, context);

      // Calculate confidence
      const confidence = await this.calculateConfidence(finalResult, processedInput);

      // Store in memory if needed
      if (conversationId && this.shouldStoreResult(finalResult)) {
        await this.storeResult(conversationId, finalResult, confidence);
      }

      logger.pipeline.success(this.name, finalResult, confidence);

      // ========== AGENT OUTPUT LOGGING ==========
      console.log(`[SUCCESS] [${timestamp}] ✅ ${this.name} successfully generated output.`);
      console.log(`[INFO] [${timestamp}] 📊 Confidence Score: ${(confidence * 100).toFixed(2)}%`);

      return {
        success: true,
        data: finalResult,
        confidence,
        agent: this.name,
        metadata: {
          processingTime: Date.now(),
          attempt
        }
      };
    } catch (error) {
      // ========== AGENT ERROR LOGGING ==========
      console.log(`[ERROR] [${timestamp}] ❌ ${this.name} execution failed: ${error.message}`);

      logger.pipeline.error(this.name, error, attempt);

      if (attempt < this.maxRetries) {
        console.log(`[INFO] [${timestamp}] 🔄 ${this.name} Retrying... (Attempt ${attempt + 1}/${this.maxRetries})`);
        logger.pipeline.retry(this.name, attempt + 1, this.maxRetries);
        await this.delay(1000 * attempt); // Exponential backoff
        return this.execute(input, { ...context, attempt: attempt + 1 });
      }

      return {
        success: false,
        error: error.message,
        agent: this.name,
        metadata: {
          finalAttempt: attempt,
          maxRetries: this.maxRetries
        }
      };
    }
  }

  // Abstract methods to be implemented by subclasses
  async preProcess(input, context) {
    return input;
  }

  async process(input, context) {
    throw new Error(`Process method must be implemented by ${this.name}`);
  }

  async postProcess(result, context) {
    return result;
  }

  async calculateConfidence(result, input) {
    // Base confidence calculation - can be overridden
    if (!result || typeof result !== 'string') {
      return 0.5;
    }

    // Simple heuristics for confidence
    let confidence = 0.7; // Base confidence

    // Length check
    if (result.length > 50) confidence += 0.1;
    if (result.length > 200) confidence += 0.1;

    // Structure check (contains code blocks, proper formatting)
    if (result.includes('```') || result.includes('\n')) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  shouldStoreResult(result) {
    // Override in subclasses if needed
    return true;
  }

  async storeResult(conversationId, result, confidence) {
    try {
      const embedding = await this.aiClient.generateEmbedding(JSON.stringify(result));
      await this.memoryManager.storeConversationContext(
        conversationId,
        `${this.name}-${Date.now()}`,
        JSON.stringify(result),
        embedding,
        'assistant'
      );
    } catch (error) {
      logger.error('Failed to store agent result', {
        agent: this.name,
        error: error.message
      });
    }
  }

  async getRelevantContext(input, conversationId) {
    try {
      const inputEmbedding = await this.aiClient.generateEmbedding(input);
      return await this.memoryManager.getRelevantContext(conversationId, inputEmbedding, {
        limit: 5
      });
    } catch (error) {
      logger.error('Failed to get relevant context', {
        agent: this.name,
        error: error.message
      });
      return { conversation: [], codePatterns: [], entities: [] };
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Validation helpers
  validateInput(input, requiredFields = []) {
    if (!input) {
      throw new Error('Input is required');
    }

    for (const field of requiredFields) {
      if (!input[field]) {
        throw new Error(`Required field '${field}' is missing`);
      }
    }
  }

  // Common prompt building
  buildPrompt(systemPrompt, userPrompt, context = {}) {
    let prompt = userPrompt;

    // Add context if available
    if (context.conversation && context.conversation.length > 0) {
      prompt += '\n\nRelevant conversation history:\n';
      context.conversation.forEach(msg => {
        prompt += `${msg.role}: ${msg.content.substring(0, 200)}...\n`;
      });
    }

    if (context.codePatterns && context.codePatterns.length > 0) {
      prompt += '\n\nRelevant code patterns:\n';
      context.codePatterns.forEach(pattern => {
        prompt += `Pattern: ${pattern.pattern}\nCode: ${pattern.code.substring(0, 300)}...\n\n`;
      });
    }

    return { systemPrompt, userPrompt: prompt };
  }

  // Output formatting
  formatOutput(data, format = 'json') {
    switch (format) {
      case 'json':
        return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      case 'markdown':
        if (typeof data === 'object') {
          return this.objectToMarkdown(data);
        }
        return data;
      default:
        return data;
    }
  }

  objectToMarkdown(obj, level = 1) {
    let markdown = '';
    const prefix = '#'.repeat(level);

    for (const [key, value] of Object.entries(obj)) {
      markdown += `${prefix} ${key}\n\n`;

      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => {
            markdown += `- ${typeof item === 'object' ? JSON.stringify(item) : item}\n`;
          });
        } else {
          markdown += this.objectToMarkdown(value, level + 1);
        }
      } else {
        markdown += `${value}\n\n`;
      }
    }

    return markdown;
  }
}

module.exports = BaseAgent;
