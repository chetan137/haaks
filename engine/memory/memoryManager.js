const VectorStore = require('./vectorStore');
const GraphStore = require('./graphStore');
const logger = require('../utils/logger');

class MemoryManager {
  constructor() {
    this.vectorStore = new VectorStore();
    this.graphStore = new GraphStore();
    this.conversationHistory = new Map();
  }

  // Initialize memory systems
  async initialize() {
    try {
      logger.info('🧠 Initializing memory systems');

      // Pre-populate with some common patterns if needed
      await this.loadBaseKnowledge();

      logger.info('✅ Memory systems initialized', {
        vectorStore: this.vectorStore.getStats(),
        graphStore: this.graphStore.getStats()
      });
    } catch (error) {
      logger.error('❌ Memory initialization failed', { error: error.message });
      throw error;
    }
  }

  // Store comprehensive information about COBOL entities
  async storeCobolEntity(entityId, entityType, code, embedding, properties = {}) {
    try {
      // Store in vector store for semantic search
      await this.vectorStore.store(entityId, embedding, {
        entityType,
        code: code.substring(0, 1000),
        language: 'cobol',
        ...properties
      });

      // Store in graph store for relationship tracking
      let graphNode;
      switch (entityType) {
        case 'program':
          graphNode = this.graphStore.addCobolProgram(entityId, {
            code: code.substring(0, 500),
            ...properties
          });
          break;
        case 'data_structure':
          graphNode = this.graphStore.addDataStructure(entityId, {
            definition: code.substring(0, 500),
            ...properties
          });
          break;
        default:
          graphNode = this.graphStore.addNode(entityId, entityType, {
            code: code.substring(0, 500),
            ...properties
          });
      }

      logger.info('💾 COBOL entity stored', {
        entityId,
        entityType,
        codeLength: code.length
      });

      return { vectorStored: true, graphNode };
    } catch (error) {
      logger.error('❌ Failed to store COBOL entity', {
        entityId,
        entityType,
        error: error.message
      });
      throw error;
    }
  }

  // Find semantically similar code
  async findSimilarCode(queryEmbedding, options = {}) {
    const {
      entityType = null,
      language = 'cobol',
      limit = 10,
      threshold = 0.7
    } = options;

    const filter = { language };
    if (entityType) {
      filter.entityType = entityType;
    }

    const results = await this.vectorStore.search(queryEmbedding, {
      limit,
      threshold,
      filter
    });

    // Enrich with graph information
    const enrichedResults = results.map(result => {
      const graphNode = this.graphStore.getNode(result.id);
      return {
        ...result,
        relationships: graphNode ? {
          dependencies: this.graphStore.getProgramDependencies(result.id),
          dependents: this.graphStore.getDependentPrograms(result.id)
        } : null
      };
    });

    return enrichedResults;
  }

  // Store relationships between entities
  async storeRelationship(fromEntity, toEntity, relationType, properties = {}) {
    try {
      const edge = this.graphStore.addEdge(fromEntity, toEntity, relationType, properties);

      logger.info('🔗 Relationship stored', {
        from: fromEntity,
        to: toEntity,
        type: relationType
      });

      return edge;
    } catch (error) {
      logger.error('❌ Failed to store relationship', {
        fromEntity,
        toEntity,
        relationType,
        error: error.message
      });
      throw error;
    }
  }

  // Get entity with all related information
  async getEntityContext(entityId) {
    try {
      // Get from vector store
      const vectorResult = await this.vectorStore.retrieve(entityId);

      // Get from graph store
      const graphNode = this.graphStore.getNode(entityId);

      if (!vectorResult && !graphNode) {
        return null;
      }

      const context = {
        id: entityId,
        vector: vectorResult?.vector,
        metadata: vectorResult?.metadata,
        node: graphNode,
        relationships: {
          incoming: this.graphStore.getIncomingEdges(entityId),
          outgoing: this.graphStore.getOutgoingEdges(entityId),
          neighbors: this.graphStore.getNeighbors(entityId)
        }
      };

      return context;
    } catch (error) {
      logger.error('❌ Failed to get entity context', {
        entityId,
        error: error.message
      });
      throw error;
    }
  }

  // Store conversation context for better continuity
  async storeConversationContext(conversationId, messageId, content, embedding, role) {
    try {
      // Store in vector store for retrieval
      await this.vectorStore.storeContext(conversationId, messageId, content, embedding, role);

      // Store in conversation history
      if (!this.conversationHistory.has(conversationId)) {
        this.conversationHistory.set(conversationId, []);
      }

      this.conversationHistory.get(conversationId).push({
        messageId,
        content,
        role,
        timestamp: new Date().toISOString()
      });

      // Keep only last 100 messages per conversation
      const history = this.conversationHistory.get(conversationId);
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }

      logger.info('💬 Conversation context stored', {
        conversationId,
        messageId,
        role,
        contentLength: content.length
      });

      return true;
    } catch (error) {
      logger.error('❌ Failed to store conversation context', {
        conversationId,
        messageId,
        error: error.message
      });
      throw error;
    }
  }

  // Get relevant context for a query
  async getRelevantContext(conversationId, queryEmbedding, options = {}) {
    const {
      includeConversation = true,
      includeCodePatterns = true,
      limit = 10
    } = options;

    const context = {
      conversation: [],
      codePatterns: [],
      entities: []
    };

    try {
      if (includeConversation) {
        context.conversation = await this.vectorStore.getRelevantContext(
          conversationId,
          queryEmbedding,
          Math.floor(limit / 3)
        );
      }

      if (includeCodePatterns) {
        context.codePatterns = await this.vectorStore.findSimilarPatterns(
          queryEmbedding,
          'cobol',
          Math.floor(limit / 3)
        );
      }

      // Get semantically similar entities
      context.entities = await this.findSimilarCode(queryEmbedding, {
        limit: Math.floor(limit / 3)
      });

      logger.info('🎯 Retrieved relevant context', {
        conversationId,
        conversationItems: context.conversation.length,
        codePatterns: context.codePatterns.length,
        entities: context.entities.length
      });

      return context;
    } catch (error) {
      logger.error('❌ Failed to get relevant context', {
        conversationId,
        error: error.message
      });
      throw error;
    }
  }

  // Analyze system architecture from stored entities
  async analyzeArchitecture() {
    try {
      const stats = this.graphStore.getStats();
      const programs = this.graphStore.getNodesByType('cobol_program');
      const dataStructures = this.graphStore.getNodesByType('data_structure');

      // Find circular dependencies
      const circularDependencies = this.graphStore.findCircularDependencies();

      // Find isolated components
      const isolatedPrograms = programs.filter(program => {
        const neighbors = this.graphStore.getNeighbors(program.id);
        return neighbors.length === 0;
      });

      // Find highly connected programs (potential bottlenecks)
      const highlyConnected = programs
        .map(program => ({
          ...program,
          connectionCount: this.graphStore.getNeighbors(program.id).length
        }))
        .filter(program => program.connectionCount > 5)
        .sort((a, b) => b.connectionCount - a.connectionCount);

      const analysis = {
        overview: {
          totalPrograms: programs.length,
          totalDataStructures: dataStructures.length,
          totalRelationships: stats.edgeCount,
          averageConnections: stats.avgDegree
        },
        issues: {
          circularDependencies: circularDependencies.length,
          isolatedComponents: isolatedPrograms.length,
          highlyConnectedPrograms: highlyConnected.length
        },
        details: {
          circularDependencies,
          isolatedPrograms: isolatedPrograms.map(p => p.id),
          highlyConnectedPrograms: highlyConnected.slice(0, 10)
        }
      };

      logger.info('📊 Architecture analysis completed', analysis.overview);
      return analysis;
    } catch (error) {
      logger.error('❌ Architecture analysis failed', { error: error.message });
      throw error;
    }
  }

  // Load base knowledge patterns
  async loadBaseKnowledge() {
    // This would typically load from a knowledge base file
    // For now, we'll just log that it's ready for base knowledge
    logger.info('📚 Base knowledge system ready');
  }

  // Get comprehensive memory statistics
  getMemoryStats() {
    return {
      vectorStore: this.vectorStore.getStats(),
      graphStore: this.graphStore.getStats(),
      conversationHistory: {
        activeConversations: this.conversationHistory.size,
        totalMessages: Array.from(this.conversationHistory.values())
          .reduce((sum, messages) => sum + messages.length, 0)
      }
    };
  }

  // Clear all memory (use with caution)
  async clearAll() {
    await this.vectorStore.clear();
    this.conversationHistory.clear();

    // Clear graph store
    for (const nodeId of this.graphStore.nodes.keys()) {
      this.graphStore.deleteNode(nodeId);
    }

    logger.info('🧹 All memory cleared');
  }
}

module.exports = MemoryManager;