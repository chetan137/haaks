const logger = require('../utils/logger');

class GraphStore {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.nodeTypes = new Set();
    this.relationTypes = new Set();
  }

  // Add a node to the graph
  addNode(id, type, properties = {}) {
    try {
      const node = {
        id,
        type,
        properties: {
          ...properties,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        inEdges: new Set(),
        outEdges: new Set()
      };

      this.nodes.set(id, node);
      this.nodeTypes.add(type);

      logger.info('🔗 Node added to graph', {
        id,
        type,
        propertiesCount: Object.keys(properties).length
      });

      return node;
    } catch (error) {
      logger.error('❌ Failed to add node', { id, type, error: error.message });
      throw error;
    }
  }

  // Add an edge (relationship) between nodes
  addEdge(fromId, toId, relationType, properties = {}) {
    try {
      const fromNode = this.nodes.get(fromId);
      const toNode = this.nodes.get(toId);

      if (!fromNode || !toNode) {
        throw new Error(`Source or target node not found: ${fromId} -> ${toId}`);
      }

      const edgeId = `${fromId}-${relationType}->${toId}`;
      const edge = {
        id: edgeId,
        fromId,
        toId,
        type: relationType,
        properties: {
          ...properties,
          createdAt: new Date().toISOString()
        }
      };

      this.edges.set(edgeId, edge);
      fromNode.outEdges.add(edgeId);
      toNode.inEdges.add(edgeId);
      this.relationTypes.add(relationType);

      logger.info('➡️ Edge added to graph', {
        from: fromId,
        to: toId,
        type: relationType
      });

      return edge;
    } catch (error) {
      logger.error('❌ Failed to add edge', { fromId, toId, relationType, error: error.message });
      throw error;
    }
  }

  // Get a node by ID
  getNode(id) {
    return this.nodes.get(id);
  }

  // Get nodes by type
  getNodesByType(type) {
    const nodes = [];
    for (const node of this.nodes.values()) {
      if (node.type === type) {
        nodes.push(node);
      }
    }
    return nodes;
  }

  // Get edges from a node
  getOutgoingEdges(nodeId, relationType = null) {
    const node = this.nodes.get(nodeId);
    if (!node) return [];

    const edges = [];
    for (const edgeId of node.outEdges) {
      const edge = this.edges.get(edgeId);
      if (!relationType || edge.type === relationType) {
        edges.push(edge);
      }
    }
    return edges;
  }

  // Get edges to a node
  getIncomingEdges(nodeId, relationType = null) {
    const node = this.nodes.get(nodeId);
    if (!node) return [];

    const edges = [];
    for (const edgeId of node.inEdges) {
      const edge = this.edges.get(edgeId);
      if (!relationType || edge.type === relationType) {
        edges.push(edge);
      }
    }
    return edges;
  }

  // Get neighbors of a node
  getNeighbors(nodeId, direction = 'both', relationType = null) {
    const neighbors = [];

    if (direction === 'both' || direction === 'out') {
      const outEdges = this.getOutgoingEdges(nodeId, relationType);
      for (const edge of outEdges) {
        const neighbor = this.nodes.get(edge.toId);
        if (neighbor) {
          neighbors.push({ node: neighbor, edge, direction: 'out' });
        }
      }
    }

    if (direction === 'both' || direction === 'in') {
      const inEdges = this.getIncomingEdges(nodeId, relationType);
      for (const edge of inEdges) {
        const neighbor = this.nodes.get(edge.fromId);
        if (neighbor) {
          neighbors.push({ node: neighbor, edge, direction: 'in' });
        }
      }
    }

    return neighbors;
  }

  // Find shortest path between two nodes
  findPath(startId, endId, maxDepth = 5) {
    if (startId === endId) return [startId];

    const visited = new Set();
    const queue = [{ nodeId: startId, path: [startId] }];

    while (queue.length > 0) {
      const { nodeId, path } = queue.shift();

      if (path.length > maxDepth) continue;

      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const neighbors = this.getNeighbors(nodeId);
      for (const { node } of neighbors) {
        if (node.id === endId) {
          return [...path, node.id];
        }

        if (!visited.has(node.id)) {
          queue.push({
            nodeId: node.id,
            path: [...path, node.id]
          });
        }
      }
    }

    return null; // No path found
  }

  // Query nodes with properties
  queryNodes(filters = {}) {
    const results = [];

    for (const node of this.nodes.values()) {
      let matches = true;

      for (const [key, value] of Object.entries(filters)) {
        if (key === 'type') {
          if (node.type !== value) {
            matches = false;
            break;
          }
        } else if (!node.properties[key] || node.properties[key] !== value) {
          matches = false;
          break;
        }
      }

      if (matches) {
        results.push(node);
      }
    }

    return results;
  }

  // Delete node and its edges
  deleteNode(id) {
    const node = this.nodes.get(id);
    if (!node) return false;

    // Delete all connected edges
    for (const edgeId of [...node.inEdges, ...node.outEdges]) {
      this.deleteEdge(edgeId);
    }

    this.nodes.delete(id);
    logger.info('🗑️ Node deleted from graph', { id });
    return true;
  }

  // Delete edge
  deleteEdge(edgeId) {
    const edge = this.edges.get(edgeId);
    if (!edge) return false;

    const fromNode = this.nodes.get(edge.fromId);
    const toNode = this.nodes.get(edge.toId);

    if (fromNode) fromNode.outEdges.delete(edgeId);
    if (toNode) toNode.inEdges.delete(edgeId);

    this.edges.delete(edgeId);
    logger.info('🗑️ Edge deleted from graph', { edgeId });
    return true;
  }

  // Get graph statistics
  getStats() {
    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.size,
      nodeTypes: Array.from(this.nodeTypes),
      relationTypes: Array.from(this.relationTypes),
      avgDegree: this.calculateAverageDegree()
    };
  }

  calculateAverageDegree() {
    if (this.nodes.size === 0) return 0;

    let totalDegree = 0;
    for (const node of this.nodes.values()) {
      totalDegree += node.inEdges.size + node.outEdges.size;
    }

    return totalDegree / this.nodes.size;
  }

  // Export graph for visualization
  exportGraph() {
    const nodes = Array.from(this.nodes.values()).map(node => ({
      id: node.id,
      type: node.type,
      properties: node.properties
    }));

    const edges = Array.from(this.edges.values()).map(edge => ({
      id: edge.id,
      from: edge.fromId,
      to: edge.toId,
      type: edge.type,
      properties: edge.properties
    }));

    return { nodes, edges };
  }

  // AS400/COBOL specific methods
  addCobolProgram(programName, properties = {}) {
    return this.addNode(programName, 'cobol_program', {
      ...properties,
      language: 'cobol'
    });
  }

  addDataStructure(structName, properties = {}) {
    return this.addNode(structName, 'data_structure', properties);
  }

  addDependency(fromProgram, toProgram, dependencyType = 'calls') {
    return this.addEdge(fromProgram, toProgram, dependencyType);
  }

  addDataFlow(fromEntity, toEntity, dataType) {
    return this.addEdge(fromEntity, toEntity, 'data_flow', { dataType });
  }

  // Get all programs that depend on a given program
  getDependentPrograms(programName) {
    const dependencies = this.getIncomingEdges(programName, 'calls');
    return dependencies.map(edge => this.nodes.get(edge.fromId));
  }

  // Get all programs that a given program depends on
  getProgramDependencies(programName) {
    const dependencies = this.getOutgoingEdges(programName, 'calls');
    return dependencies.map(edge => this.nodes.get(edge.toId));
  }

  // Find circular dependencies
  findCircularDependencies() {
    const cycles = [];
    const visited = new Set();
    const recursionStack = new Set();

    const dfs = (nodeId, path) => {
      if (recursionStack.has(nodeId)) {
        const cycleStart = path.indexOf(nodeId);
        cycles.push(path.slice(cycleStart));
        return;
      }

      if (visited.has(nodeId)) return;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const dependencies = this.getOutgoingEdges(nodeId, 'calls');
      for (const edge of dependencies) {
        dfs(edge.toId, [...path, edge.toId]);
      }

      recursionStack.delete(nodeId);
    };

    for (const node of this.nodes.values()) {
      if (node.type === 'cobol_program' && !visited.has(node.id)) {
        dfs(node.id, [node.id]);
      }
    }

    return cycles;
  }
}

module.exports = GraphStore;