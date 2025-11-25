const cosineSimilarity = require('cosine-similarity');
const logger = require('../utils/logger');

class VectorStore {
  constructor() {
    this.vectors = new Map();
    this.metadata = new Map();
    this.dimension = parseInt(process.env.VECTOR_DIMENSION) || 1536;
    this.similarityThreshold = parseFloat(process.env.SIMILARITY_THRESHOLD) || 0.7;
  }

  async store(id, vector, metadata = {}) {
    try {
      logger.info('🔍 Vector store attempting to store', {
        id,
        vectorType: typeof vector,
        isArray: Array.isArray(vector),
        vectorLength: vector ? vector.length : 'undefined',
        expectedDimension: this.dimension,
        firstFewValues: vector ? vector.slice(0, 5) : 'undefined'
      });

      if (!Array.isArray(vector) || vector.length !== this.dimension) {
        throw new Error(`Vector must be array of length ${this.dimension}`);
      }

      this.vectors.set(id, vector);
      this.metadata.set(id, {
        ...metadata,
        timestamp: new Date().toISOString(),
        id
      });

      logger.info('📦 Vector stored', {
        id,
        dimension: vector.length,
        metadata: Object.keys(metadata)
      });

      return true;
    } catch (error) {
      logger.error('❌ Vector storage failed', { id, error: error.message });
      throw error;
    }
  }

  async retrieve(id) {
    const vector = this.vectors.get(id);
    const metadata = this.metadata.get(id);

    if (!vector) {
      return null;
    }

    return {
      id,
      vector,
      metadata,
      similarity: 1.0
    };
  }

  async search(queryVector, options = {}) {
    const {
      limit = 10,
      threshold = this.similarityThreshold,
      filter = {}
    } = options;

    try {
      logger.info('🔍 Vector store search query', {
        vectorType: typeof queryVector,
        isArray: Array.isArray(queryVector),
        vectorLength: queryVector ? queryVector.length : 'undefined',
        expectedDimension: this.dimension,
        firstFewValues: queryVector ? queryVector.slice(0, 5) : 'undefined'
      });

      if (!Array.isArray(queryVector) || queryVector.length !== this.dimension) {
        throw new Error(`Query vector must be array of length ${this.dimension}`);
      }

      const results = [];

      for (const [id, vector] of this.vectors.entries()) {
        const metadata = this.metadata.get(id);

        // Apply filters
        if (this.matchesFilter(metadata, filter)) {
          const similarity = cosineSimilarity(queryVector, vector);

          if (similarity >= threshold) {
            results.push({
              id,
              vector,
              metadata,
              similarity
            });
          }
        }
      }

      // Sort by similarity (highest first) and limit
      results.sort((a, b) => b.similarity - a.similarity);
      const limitedResults = results.slice(0, limit);

      logger.info('🔍 Vector search completed', {
        queryDimension: queryVector.length,
        totalVectors: this.vectors.size,
        resultsFound: limitedResults.length,
        threshold
      });

      return limitedResults;
    } catch (error) {
      logger.error('❌ Vector search failed', { error: error.message });
      throw error;
    }
  }

  matchesFilter(metadata, filter) {
    for (const [key, value] of Object.entries(filter)) {
      if (metadata[key] !== value) {
        return false;
      }
    }
    return true;
  }

  async delete(id) {
    const existed = this.vectors.has(id);
    this.vectors.delete(id);
    this.metadata.delete(id);

    if (existed) {
      logger.info('🗑️ Vector deleted', { id });
    }

    return existed;
  }

  async clear() {
    const count = this.vectors.size;
    this.vectors.clear();
    this.metadata.clear();

    logger.info('🧹 Vector store cleared', { deletedCount: count });
    return count;
  }

  getStats() {
    return {
      totalVectors: this.vectors.size,
      dimension: this.dimension,
      similarityThreshold: this.similarityThreshold,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  estimateMemoryUsage() {
    // Rough estimation in bytes
    const vectorMemory = this.vectors.size * this.dimension * 8; // 8 bytes per float
    const metadataMemory = JSON.stringify([...this.metadata.values()]).length;
    return vectorMemory + metadataMemory;
  }

  // Context-aware storage for conversation memory
  async storeContext(conversationId, messageId, content, embedding, role = 'user') {
    const contextId = `${conversationId}:${messageId}`;
    const metadata = {
      conversationId,
      messageId,
      content: content.substring(0, 500), // Store first 500 chars for reference
      role,
      type: 'context'
    };

    return await this.store(contextId, embedding, metadata);
  }

  // Retrieve relevant context for a conversation
  async getRelevantContext(conversationId, queryEmbedding, limit = 5) {
    const contextResults = await this.search(queryEmbedding, {
      limit,
      filter: { conversationId, type: 'context' }
    });

    return contextResults.map(result => ({
      messageId: result.metadata.messageId,
      content: result.metadata.content,
      role: result.metadata.role,
      similarity: result.similarity
    }));
  }

  // Store code patterns and examples
  async storeCodePattern(patternId, code, embedding, language, pattern, description) {
    const metadata = {
      code: code.substring(0, 1000),
      language,
      pattern,
      description,
      type: 'code_pattern'
    };

    return await this.store(patternId, embedding, metadata);
  }

  // Find similar code patterns
  async findSimilarPatterns(queryEmbedding, language = null, limit = 5) {
    const filter = { type: 'code_pattern' };
    if (language) {
      filter.language = language;
    }

    const results = await this.search(queryEmbedding, { limit, filter });

    return results.map(result => ({
      patternId: result.id,
      code: result.metadata.code,
      language: result.metadata.language,
      pattern: result.metadata.pattern,
      description: result.metadata.description,
      similarity: result.similarity
    }));
  }
}

module.exports = VectorStore;