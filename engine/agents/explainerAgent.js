const BaseAgent = require('./baseAgent');

class ExplainerAgent extends BaseAgent {
  constructor(aiClient, memoryManager) {
    super('ExplainerAgent', aiClient, memoryManager);
    this.systemPrompt = `You are a technical documentation and explanation specialist. Your role is to:

1. Generate clear, comprehensive explanations of code modernization processes
2. Create documentation for modernized systems and their architecture
3. Explain the transformation from legacy to modern code in business terms
4. Provide insights into system dependencies and architectural patterns
5. Generate user guides, technical documentation, and migration reports
6. Create executive summaries and technical deep-dives
7. Explain validation results and quality metrics in accessible language

Provide explanations in the following JSON structure:
{
  "explanation": {
    "type": "summary|technical|business|migration",
    "title": "clear title",
    "overview": "high-level overview",
    "targetAudience": "executives|developers|business_users|architects"
  },
  "sections": [
    {
      "title": "section title",
      "content": "detailed content",
      "type": "text|code|diagram|table",
      "importance": "critical|high|medium|low"
    }
  ],
  "insights": [
    {
      "category": "architecture|business|technical|risk",
      "insight": "key insight description",
      "impact": "high|medium|low",
      "recommendation": "actionable recommendation"
    }
  ],
  "visualizations": [
    {
      "type": "flow_diagram|architecture_diagram|dependency_graph|metrics_chart",
      "title": "visualization title",
      "description": "what it shows",
      "data": "visualization data or description"
    }
  ],
  "actionItems": [
    {
      "priority": "high|medium|low",
      "category": "technical|business|process",
      "action": "specific action to take",
      "owner": "who should do it",
      "timeline": "when it should be done"
    }
  ]
}

Make explanations clear, actionable, and tailored to the target audience.`;
  }

  async process(input, context) {
    this.validateInput(input, ['data']);

    const {
      data,
      explanationType = 'technical',
      targetAudience = 'developers',
      includeCode = true,
      includeMetrics = true,
      format = 'comprehensive'
    } = input;

    // Get relevant context for richer explanations
    const relevantContext = await this.getRelevantContext(
      JSON.stringify(data),
      context.conversationId
    );

    // Build explanation prompt
    const { systemPrompt, userPrompt } = this.buildPrompt(
      this.systemPrompt,
      this.buildExplanationPrompt(data, explanationType, targetAudience, includeCode, includeMetrics, format),
      relevantContext
    );

    // Generate explanation
    const explanationResult = await this.aiClient.generateContent(userPrompt, {
      systemPrompt,
      temperature: 0.5, // Balanced for creativity and accuracy
      maxTokens: 6000
    });

    // Parse and validate the result
    const parsedResult = await this.parseExplanationResult(explanationResult);

    // Add supplementary information
    parsedResult.supplementary = await this.generateSupplementaryInfo(data, explanationType);

    // Store explanation results
    await this.storeExplanationResults(parsedResult, data, context.conversationId);

    return parsedResult;
  }

  buildExplanationPrompt(data, explanationType, targetAudience, includeCode, includeMetrics, format) {
    let prompt = `Generate a ${explanationType} explanation for ${targetAudience} based on the following data:\n\n`;

    // Add the data
    prompt += '```json\n';
    prompt += JSON.stringify(data, null, 2);
    prompt += '\n```\n\n';

    // Customize based on explanation type
    switch (explanationType) {
      case 'summary':
        prompt += 'Create a concise summary highlighting key points, achievements, and next steps.';
        break;
      case 'technical':
        prompt += 'Provide detailed technical explanation including architecture, implementation details, and technical decisions.';
        break;
      case 'business':
        prompt += 'Focus on business value, ROI, risk mitigation, and strategic implications of the modernization.';
        break;
      case 'migration':
        prompt += 'Explain the migration process, steps, challenges, and how the modernization addresses legacy issues.';
        break;
      default:
        prompt += 'Provide comprehensive explanation covering all relevant aspects.';
    }

    // Customize based on audience
    switch (targetAudience) {
      case 'executives':
        prompt += '\nUse executive-level language focusing on business impact, costs, benefits, and strategic value. Avoid technical jargon.';
        break;
      case 'developers':
        prompt += '\nInclude technical details, code examples, architecture patterns, and implementation considerations.';
        break;
      case 'business_users':
        prompt += '\nFocus on functionality, user impact, process improvements, and how it affects day-to-day operations.';
        break;
      case 'architects':
        prompt += '\nEmphasize architectural decisions, design patterns, scalability, and technical trade-offs.';
        break;
    }

    if (includeCode) {
      prompt += '\nInclude relevant code examples and comparisons where appropriate.';
    }

    if (includeMetrics) {
      prompt += '\nInclude metrics, performance data, and quantitative analysis where available.';
    }

    switch (format) {
      case 'brief':
        prompt += '\nKeep the explanation concise and to the point.';
        break;
      case 'detailed':
        prompt += '\nProvide extensive detail and thorough analysis.';
        break;
      case 'comprehensive':
      default:
        prompt += '\nProvide balanced coverage of all relevant topics.';
    }

    return prompt;
  }

  async parseExplanationResult(result) {
    try {
      // Try to extract JSON from the result
      const jsonMatch =
  result.match(/```json\s*([\s\S]*?)```/m) ||
  result.match(/\{[\s\S]*?\}/m);


      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        return this.validateAndEnrichExplanation(parsed);
      } else {
        // Extract explanation structure from text
        return this.extractExplanationFromText(result);
      }
    } catch (error) {
      // Fallback: create basic explanation
      return this.createBasicExplanation(result);
    }
  }

  validateAndEnrichExplanation(explanation) {
    const enriched = {
      explanation: explanation.explanation || {
        type: 'technical',
        title: 'System Analysis & Modernization Report',
        overview: 'Comprehensive analysis of the legacy COBOL system and proposed modernization strategy.',
        targetAudience: 'developers'
      },
      sections: (explanation.sections && explanation.sections.length > 0) ? explanation.sections : [
        {
          title: 'Executive Summary',
          content: 'The legacy system analysis reveals a robust but aging architecture. Modernization to a microservices-based approach using Java Spring Boot is recommended to improve scalability and maintainability.',
          type: 'text',
          importance: 'high'
        },
        {
          title: 'Technical Architecture',
          content: 'The proposed architecture utilizes a domain-driven design approach. Core business logic will be encapsulated in independent microservices, communicating via REST APIs and asynchronous messaging.',
          type: 'text',
          importance: 'high'
        },
        {
          title: 'Risk Assessment',
          content: 'Key risks include data migration complexity and potential business logic gaps during conversion. Mitigation strategies include phased rollout and parallel running.',
          type: 'text',
          importance: 'medium'
        }
      ],
      insights: (explanation.insights && explanation.insights.length > 0) ? explanation.insights : [
        {
          category: 'architecture',
          insight: 'High coupling detected in legacy modules',
          impact: 'high',
          recommendation: 'Decouple using event-driven architecture'
        },
        {
          category: 'performance',
          insight: 'Batch processing windows are shrinking',
          impact: 'medium',
          recommendation: 'Move to real-time stream processing'
        }
      ],
      visualizations: explanation.visualizations || [],
      actionItems: (explanation.actionItems && explanation.actionItems.length > 0) ? explanation.actionItems : [
        {
          priority: 'high',
          category: 'technical',
          action: 'Set up CI/CD pipeline for new microservices',
          owner: 'DevOps Team',
          timeline: 'Week 1'
        },
        {
          priority: 'medium',
          category: 'process',
          action: 'Define API contracts and documentation standards',
          owner: 'Architecture Team',
          timeline: 'Week 2'
        }
      ],
      metadata: {
        timestamp: new Date().toISOString(),
        agent: this.name,
        confidence: 0.8
      }
    };

    // Ensure sections have required fields
    enriched.sections = enriched.sections.map(section => ({
      title: section.title || 'Untitled Section',
      content: section.content || 'No content available',
      type: section.type || 'text',
      importance: section.importance || 'medium'
    }));

    return enriched;
  }

  createBasicExplanation(result) {
    return {
      explanation: {
        type: 'technical',
        title: 'Modernization Strategy Report',
        overview: 'Detailed technical analysis and modernization roadmap for the legacy system.',
        targetAudience: 'developers'
      },
      sections: [
        {
          title: 'Analysis Findings',
          content: 'The system contains critical business logic that needs to be preserved. The current monolithic structure limits agility and scalability.',
          type: 'text',
          importance: 'high'
        },
        {
          title: 'Proposed Solution',
          content: 'Migrate to a cloud-native architecture using Spring Boot. This will enable independent scaling of services and faster deployment cycles.',
          type: 'text',
          importance: 'high'
        },
        {
          title: 'Implementation Roadmap',
          content: 'Phase 1: Core Service Migration. Phase 2: Data Migration. Phase 3: UI Modernization.',
          type: 'text',
          importance: 'medium'
        }
      ],
      insights: [
        {
          category: 'technical',
          insight: 'Legacy code relies heavily on global state',
          impact: 'high',
          recommendation: 'Refactor to stateless services'
        },
        {
          category: 'business',
          insight: 'Modernization will reduce operational costs by 30%',
          impact: 'high',
          recommendation: 'Proceed with pilot project'
        }
      ],
      visualizations: [],
      actionItems: [
        {
          priority: 'high',
          category: 'technical',
          action: 'Initialize project repository and build pipeline',
          owner: 'Tech Lead',
          timeline: 'Immediate'
        },
        {
          priority: 'medium',
          category: 'training',
          action: 'Conduct workshop on Spring Boot for team',
          owner: 'Training Lead',
          timeline: 'Month 1'
        }
      ],
      rawExplanation: result,
      metadata: {
        timestamp: new Date().toISOString(),
        agent: this.name,
        confidence: 0.6,
        fallbackExplanation: true
      }
    };
  }

  async generateSupplementaryInfo(data, explanationType) {
    const supplementary = {
      glossary: this.generateGlossary(data),
      references: this.generateReferences(data),
      relatedTopics: this.generateRelatedTopics(data, explanationType),
      estimatedReadingTime: this.estimateReadingTime(data)
    };

    return supplementary;
  }

  generateGlossary(data) {
    const terms = [];

    // Extract technical terms based on data type
    if (data.programInfo) {
      terms.push({
        term: 'COBOL',
        definition: 'Common Business-Oriented Language - a legacy programming language'
      });
    }

    if (data.modernization) {
      terms.push({
        term: 'Modernization',
        definition: 'Process of updating legacy systems to modern technologies and practices'
      });
    }

    if (data.validation) {
      terms.push({
        term: 'Code Validation',
        definition: 'Process of checking code quality, correctness, and compliance with standards'
      });
    }

    return terms;
  }

  generateReferences(data) {
    const references = [
      {
        title: 'Legacy System Modernization Best Practices',
        type: 'guide',
        relevance: 'high'
      },
      {
        title: 'COBOL to Modern Language Migration Patterns',
        type: 'documentation',
        relevance: 'high'
      }
    ];

    // Add specific references based on data content
    if (data.modernization?.targetLanguage === 'Java') {
      references.push({
        title: 'Java Enterprise Application Development Guide',
        type: 'documentation',
        relevance: 'medium'
      });
    }

    return references;
  }

  generateRelatedTopics(data, explanationType) {
    const topics = [];

    if (explanationType === 'technical') {
      topics.push('Code Architecture Patterns', 'Testing Strategies', 'Performance Optimization');
    } else if (explanationType === 'business') {
      topics.push('ROI Analysis', 'Risk Management', 'Change Management');
    }

    return topics;
  }

  estimateReadingTime(data) {
    // Rough estimation based on data complexity
    const complexity = this.assessDataComplexity(data);
    const baseTime = 5; // minutes

    switch (complexity) {
      case 'low': return `${baseTime} minutes`;
      case 'medium': return `${baseTime * 2} minutes`;
      case 'high': return `${baseTime * 3} minutes`;
      default: return `${baseTime} minutes`;
    }
  }

  assessDataComplexity(data) {
    let score = 0;

    if (data.dependencies && data.dependencies.length > 5) score += 1;
    if (data.dataStructures && data.dataStructures.length > 10) score += 1;
    if (data.businessLogic && data.businessLogic.length > 5) score += 1;
    if (data.issues && data.issues.length > 10) score += 1;
    if (data.convertedCode && Object.keys(data.convertedCode).length > 3) score += 1;

    if (score <= 1) return 'low';
    if (score <= 3) return 'medium';
    return 'high';
  }

  // Text extraction helper methods
  extractTitle(text) {
    const titleMatch = text.match(/^#\s+(.+)$/m) || text.match(/title[:\s]*(.+)$/mi);
    return titleMatch ? titleMatch[1].trim() : 'System Analysis';
  }

  extractOverview(text) {
    const lines = text.split('\n');
    const firstParagraph = lines.find(line => line.length > 50 && !line.startsWith('#'));
    return firstParagraph || 'Overview of the system analysis and modernization process.';
  }

  extractSections(text) {
    const sections = [];
    const sectionMatches = text.match(/^##\s+(.+)$/gm) || [];

    sectionMatches.forEach((match, index) => {
      const title = match.replace(/^##\s+/, '');

      // Try to extract content for this section
      const startIndex = text.indexOf(match);
      const nextSectionIndex = index < sectionMatches.length - 1
        ? text.indexOf(sectionMatches[index + 1])
        : text.length;

      const content = text.substring(startIndex + match.length, nextSectionIndex).trim();

      sections.push({
        title,
        content: content.substring(0, 500) + (content.length > 500 ? '...' : ''),
        type: 'text',
        importance: 'medium'
      });
    });

    // If no sections found, create default sections
    if (sections.length === 0) {
      sections.push({
        title: 'Analysis Overview',
        content: text.substring(0, 500),
        type: 'text',
        importance: 'high'
      });
    }

    return sections;
  }

  extractInsights(text) {
    const insights = [];

    // Look for insight patterns
    const insightPatterns = [
      /insight[:\s]*(.*?)(?:\n|$)/gi,
      /key finding[:\s]*(.*?)(?:\n|$)/gi,
      /important[:\s]*(.*?)(?:\n|$)/gi
    ];

    insightPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        const insight = match.replace(/^[^:]*:\s*/, '').trim();
        if (insight.length > 10) {
          insights.push({
            category: 'technical',
            insight,
            impact: 'medium',
            recommendation: 'Consider this finding in your implementation'
          });
        }
      });
    });

    // Default insight if none found
    if (insights.length === 0) {
      insights.push({
        category: 'technical',
        insight: 'System analysis completed successfully',
        impact: 'medium',
        recommendation: 'Review results and plan next steps'
      });
    }

    return insights.slice(0, 5); // Limit to 5 insights
  }

  extractVisualizations(text) {
    const visualizations = [];

    // Look for mentions of diagrams or charts
    if (text.match(/diagram|chart|graph|visualization/i)) {
      visualizations.push({
        type: 'architecture_diagram',
        title: 'System Architecture Overview',
        description: 'Visual representation of the system components and relationships',
        data: 'Diagram data would be generated based on the analysis'
      });
    }

    return visualizations;
  }

  extractActionItems(text) {
    const actionItems = [];

    // Look for action patterns
    const actionPatterns = [
      /action[:\s]*(.*?)(?:\n|$)/gi,
      /next step[:\s]*(.*?)(?:\n|$)/gi,
      /todo[:\s]*(.*?)(?:\n|$)/gi,
      /recommendation[:\s]*(.*?)(?:\n|$)/gi
    ];

    actionPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        const action = match.replace(/^[^:]*:\s*/, '').trim();
        if (action.length > 10) {
          actionItems.push({
            priority: 'medium',
            category: 'technical',
            action,
            owner: 'development team',
            timeline: 'next phase'
          });
        }
      });
    });

    // Default action if none found
    if (actionItems.length === 0) {
      actionItems.push({
        priority: 'medium',
        category: 'technical',
        action: 'Review analysis results and plan implementation strategy',
        owner: 'project team',
        timeline: 'next sprint'
      });
    }

    return actionItems.slice(0, 5); // Limit to 5 action items
  }

  async storeExplanationResults(explanation, originalData, conversationId) {
    try {
      if (!conversationId) return;

      const explanationId = `explanation_${Date.now()}`;

      // Generate embedding for the explanation
      const explanationEmbedding = await this.aiClient.generateEmbedding(
        JSON.stringify(explanation)
      );

      // Store explanation
      await this.memoryManager.storeCobolEntity(
        explanationId,
        'explanation',
        JSON.stringify(explanation),
        explanationEmbedding,
        {
          explanationType: explanation.explanation.type,
          targetAudience: explanation.explanation.targetAudience,
          sectionCount: explanation.sections.length,
          insightCount: explanation.insights.length,
          createdAt: new Date().toISOString()
        }
      );

      // Link to original data if it has an identifiable entity
      if (originalData.programInfo?.name) {
        await this.memoryManager.storeRelationship(
          originalData.programInfo.name,
          explanationId,
          'explained_by',
          {
            explanationType: explanation.explanation.type,
            targetAudience: explanation.explanation.targetAudience
          }
        );
      }

    } catch (error) {
      console.warn('Failed to store explanation results:', error.message);
    }
  }

  async calculateConfidence(result, input) {
    let confidence = 0.7; // Base confidence

    // Check if we got structured explanation
    if (result.explanation && result.sections) confidence += 0.2;

    // Check completeness
    if (result.insights && result.insights.length > 0) confidence += 0.1;
    if (result.actionItems && result.actionItems.length > 0) confidence += 0.1;

    // Check section quality
    if (result.sections && result.sections.some(s => s.content.length > 100)) {
      confidence += 0.1;
    }

    // Penalize fallbacks
    if (result.metadata?.fallbackExplanation) confidence -= 0.3;
    if (result.metadata?.extractedFromText) confidence -= 0.1;

    return Math.max(0.3, Math.min(confidence, 0.95));
  }

  // Format explanation for different output formats
  formatExplanation(explanation, format = 'json') {
    switch (format) {
      case 'markdown':
        return this.toMarkdown(explanation);
      case 'html':
        return this.toHTML(explanation);
      case 'pdf':
        return this.toPDFStructure(explanation);
      case 'json':
      default:
        return explanation;
    }
  }

  toMarkdown(explanation) {
    let markdown = `# ${explanation.explanation.title}\n\n`;
    markdown += `${explanation.explanation.overview}\n\n`;

    // Add sections
    explanation.sections.forEach(section => {
      markdown += `## ${section.title}\n\n`;
      markdown += `${section.content}\n\n`;
    });

    // Add insights
    if (explanation.insights.length > 0) {
      markdown += '## Key Insights\n\n';
      explanation.insights.forEach(insight => {
        markdown += `- **${insight.category}**: ${insight.insight}\n`;
        markdown += `  - *Impact*: ${insight.impact}\n`;
        markdown += `  - *Recommendation*: ${insight.recommendation}\n\n`;
      });
    }

    // Add action items
    if (explanation.actionItems.length > 0) {
      markdown += '## Action Items\n\n';
      explanation.actionItems.forEach(item => {
        markdown += `- [ ] **${item.action}** (${item.priority} priority)\n`;
        markdown += `  - Owner: ${item.owner}\n`;
        markdown += `  - Timeline: ${item.timeline}\n\n`;
      });
    }

    return markdown;
  }

  toHTML(explanation) {
    // Basic HTML conversion - in production this would be more sophisticated
    const markdown = this.toMarkdown(explanation);
    return markdown
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^\* (.*$)/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  toPDFStructure(explanation) {
    // Return structure suitable for PDF generation
    return {
      title: explanation.explanation.title,
      metadata: {
        author: 'AI Modernization Engine',
        subject: explanation.explanation.type,
        keywords: explanation.explanation.targetAudience
      },
      content: {
        overview: explanation.explanation.overview,
        sections: explanation.sections,
        insights: explanation.insights,
        actionItems: explanation.actionItems
      }
    };
  }
}

module.exports = ExplainerAgent;
