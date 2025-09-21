const ChatConversation = require('../models/ChatConversation');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { v4: uuidv4 } = require('uuid');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || 'dummy-key');

class ChatbotController {
  // Send message to AS/400 modernization assistant
  async sendMessage(req, res) {
    try {
      const { message, sessionId } = req.body;
      const userId = req.user?.id || 'anonymous';

      if (!message || !message.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Message content is required'
        });
      }

      // Find or create conversation
      let conversation = await ChatConversation.findOne({ sessionId });
      if (!conversation) {
        conversation = new ChatConversation({
          userId,
          sessionId: sessionId || uuidv4(),
          language: 'en',
          messages: []
        });
      }

      // Add user message
      conversation.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      // Generate AS/400 modernization response
      const assistantResponse = await this.generateAS400Response(message, conversation.messages);

      // Add assistant response
      conversation.messages.push({
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date()
      });

      await conversation.save();

      res.json({
        success: true,
        response: assistantResponse,
        sessionId: conversation.sessionId
      });

    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process message',
        response: 'I apologize, but I\'m having technical difficulties. Please try asking about AS/400 modernization topics like code migration, database updates, or API integration.'
      });
    }
  }

  // Generate contextual AS/400 modernization response
  async generateAS400Response(userMessage, conversationHistory) {
    try {
      const systemPrompt = `You are an expert AS/400 (IBM iSeries) modernization consultant. You help enterprises modernize their legacy AS/400 systems for scalability, efficiency, and long-term sustainability.

Your expertise includes:
- Legacy code migration (RPG, COBOL to modern languages)
- Database modernization (DB2 to cloud databases)
- API development and integration
- Performance optimization
- Modern architecture patterns
- Cloud migration strategies
- DevOps implementation for legacy systems

Provide practical, actionable advice. Keep responses concise but comprehensive. Focus on business value and technical feasibility.

Current conversation context: The user is asking about AS/400 modernization.`;

      // Create context from conversation history
      const context = conversationHistory
        .slice(-10) // Last 10 messages for context
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      const fullPrompt = `${systemPrompt}\n\nConversation history:\n${context}\n\nUser: ${userMessage}\n\nAssistant:`;

      // Try to use Gemini if API key is available
      if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== 'dummy-key') {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        return response.text();
      } else {
        // Fallback to predefined responses
        return this.getFallbackResponse(userMessage);
      }

    } catch (error) {
      console.error('Error generating response:', error);
      return this.getFallbackResponse(userMessage);
    }
  }

  // Fallback responses for when AI service is unavailable
  getFallbackResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('migrate') || lowerMessage.includes('migration')) {
      return `For AS/400 migration, I recommend a phased approach:

1. **Assessment Phase**: Analyze your current RPG/COBOL codebase and identify dependencies
2. **Planning**: Choose target platforms (Java, .NET, cloud services)
3. **Pilot Project**: Start with a small, non-critical module
4. **Gradual Migration**: Move modules incrementally while maintaining business continuity
5. **Integration**: Ensure new systems integrate seamlessly with remaining legacy components

Key tools to consider: IBM Application Discovery, Micro Focus COBOL, or cloud-native solutions like AWS Mainframe Modernization.

Would you like me to elaborate on any specific phase?`;
    }

    if (lowerMessage.includes('database') || lowerMessage.includes('db2')) {
      return `AS/400 database modernization strategies:

**Migration Options:**
- **Cloud Databases**: AWS RDS, Azure SQL, Google Cloud SQL
- **NoSQL Solutions**: For unstructured data and scalability
- **Data Lakes**: For analytics and big data processing

**Implementation Steps:**
1. Data mapping and schema analysis
2. ETL pipeline development
3. Incremental data migration
4. API layer for data access
5. Performance optimization

**Best Practices:**
- Maintain data integrity during migration
- Implement proper backup and recovery
- Use database migration tools like AWS DMS
- Consider hybrid approaches for gradual transition

What specific database challenges are you facing?`;
    }

    if (lowerMessage.includes('api') || lowerMessage.includes('integration')) {
      return `AS/400 API integration approaches:

**Modern Integration Patterns:**
- **REST APIs**: For web and mobile applications
- **GraphQL**: For flexible data querying
- **Message Queues**: For asynchronous processing
- **Microservices**: For modular architecture

**Implementation Strategy:**
1. Identify business processes for external access
2. Create API gateway layer
3. Implement authentication and security
4. Use IBM Connect/Node.js for AS/400 connectivity
5. Monitor API performance and usage

**Tools & Technologies:**
- IBM i Access APIs
- Node.js with odbc or db2 drivers
- API management platforms (Kong, AWS API Gateway)
- Message brokers (Apache Kafka, RabbitMQ)

What type of integration are you planning?`;
    }

    if (lowerMessage.includes('performance') || lowerMessage.includes('optimize')) {
      return `AS/400 performance optimization during modernization:

**Code Optimization:**
- Refactor inefficient RPG/COBOL routines
- Implement modern algorithms and data structures
- Use compiled languages for performance-critical components

**Database Optimization:**
- Index optimization and query tuning
- Implement connection pooling
- Consider read replicas for reporting
- Use caching strategies (Redis, Memcached)

**Infrastructure Modernization:**
- Move to cloud for scalability
- Implement load balancing
- Use CDNs for content delivery
- Monitor with modern APM tools

**Architecture Improvements:**
- Microservices for scalability
- Asynchronous processing
- Event-driven architecture
- API-first design

What performance bottlenecks are you currently experiencing?`;
    }

    if (lowerMessage.includes('cloud') || lowerMessage.includes('aws') || lowerMessage.includes('azure')) {
      return `AS/400 cloud modernization strategies:

**Cloud Migration Approaches:**
- **Rehost**: Lift-and-shift to cloud VMs
- **Refactor**: Modernize applications for cloud-native services
- **Rebuild**: Complete application redesign
- **Replace**: Use SaaS alternatives

**Cloud Platforms:**
- **AWS**: Mainframe Modernization, EC2, RDS
- **Azure**: Virtual Machines, SQL Database, App Services
- **Google Cloud**: Compute Engine, Cloud SQL, App Engine

**Migration Steps:**
1. Cloud readiness assessment
2. Network and security planning
3. Data migration strategy
4. Application modernization
5. Testing and validation
6. Go-live and optimization

**Benefits:**
- Improved scalability and flexibility
- Reduced infrastructure costs
- Access to modern cloud services
- Enhanced disaster recovery

Which cloud platform are you considering?`;
    }

    // Default response
    return `I'm here to help with AS/400 modernization! I can assist you with:

🔧 **Code Migration**: RPG/COBOL to modern languages (Java, Python, .NET)
🗄️ **Database Modernization**: DB2 to cloud databases, data integration
🔗 **API Development**: REST APIs, microservices, system integration
⚡ **Performance Optimization**: Code refactoring, infrastructure scaling
☁️ **Cloud Migration**: AWS, Azure, Google Cloud strategies
🔄 **DevOps Implementation**: CI/CD, automated testing, deployment

**Popular Topics:**
- "How do I migrate RPG code to Java?"
- "What's the best database modernization strategy?"
- "How can I create APIs for my AS/400 system?"
- "What are cloud migration options for AS/400?"

What specific AS/400 modernization challenge would you like to discuss?`;
  }

  // Get conversation history
  async getConversationHistory(req, res) {
    try {
      const { sessionId } = req.params;

      const conversation = await ChatConversation.findOne({ sessionId });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }

      res.json({
        success: true,
        data: {
          sessionId: conversation.sessionId,
          messages: conversation.messages,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt
        }
      });

    } catch (error) {
      console.error('Error fetching conversation history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch conversation history'
      });
    }
  }
}

// Export controller methods
const chatbotController = new ChatbotController();

module.exports = {
  sendMessage: chatbotController.sendMessage.bind(chatbotController),
  getConversationHistory: chatbotController.getConversationHistory.bind(chatbotController)
};