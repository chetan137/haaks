const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class FileChunker {
  constructor(options = {}) {
    this.defaultMaxChunkSize = options.maxChunkSize || 4000;
    this.defaultOverlap = options.overlap || 200;
    this.encoding = options.encoding || 'utf8';
  }

  /**
   * Split a file into chunks for processing
   * @param {string} filePath - Path to the file to chunk
   * @param {Object} options - Chunking options
   * @returns {Promise<Array>} Array of chunk objects
   */
  async splitFileToChunks(filePath, options = {}) {
    const {
      maxChunkSize = this.defaultMaxChunkSize,
      overlap = this.defaultOverlap,
      preserveLines = true,
      strategy = 'auto' // 'auto', 'lines', 'size', 'logical'
    } = options;

    try {
      logger.info('📄 Starting file chunking', {
        filePath: path.basename(filePath),
        maxChunkSize,
        overlap,
        strategy
      });

      const stats = await fs.promises.stat(filePath);
      const fileSize = stats.size;
      const fileExtension = path.extname(filePath).toLowerCase();

      // For small files, return single chunk
      if (fileSize <= maxChunkSize) {
        const content = await fs.promises.readFile(filePath, this.encoding);
        return [{
          index: 0,
          text: content,
          offset: 0,
          length: content.length,
          metadata: {
            isFirstChunk: true,
            isLastChunk: true,
            originalFileSize: fileSize,
            fileName: path.basename(filePath)
          }
        }];
      }

      // Choose chunking strategy based on file type
      let chunkingStrategy = strategy;
      if (strategy === 'auto') {
        chunkingStrategy = this.determineStrategy(fileExtension, fileSize);
      }

      let chunks;
      switch (chunkingStrategy) {
        case 'logical':
          chunks = await this.chunkByLogicalStructure(filePath, maxChunkSize, overlap);
          break;
        case 'lines':
          chunks = await this.chunkByLines(filePath, maxChunkSize, overlap);
          break;
        case 'size':
        default:
          chunks = await this.chunkBySize(filePath, maxChunkSize, overlap);
          break;
      }

      logger.info('✅ File chunking completed', {
        fileName: path.basename(filePath),
        totalChunks: chunks.length,
        avgChunkSize: Math.round(chunks.reduce((sum, chunk) => sum + chunk.length, 0) / chunks.length),
        strategy: chunkingStrategy
      });

      return chunks;

    } catch (error) {
      logger.error('❌ File chunking failed', {
        filePath: path.basename(filePath),
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Determine the best chunking strategy based on file type and size
   */
  determineStrategy(fileExtension, fileSize) {
    const structuredFormats = ['.cpy', '.cobol', '.cbl', '.json'];
    const dataFormats = ['.dat', '.csv', '.txt'];

    if (structuredFormats.includes(fileExtension)) {
      return 'logical';
    } else if (dataFormats.includes(fileExtension)) {
      return 'lines';
    }
    return 'size';
  }

  /**
   * Chunk file by logical structure (for COBOL, copybooks, etc.)
   */
  async chunkByLogicalStructure(filePath, maxChunkSize, overlap) {
    const content = await fs.promises.readFile(filePath, this.encoding);
    const lines = content.split('\n');
    const chunks = [];

    let currentChunk = '';
    let currentOffset = 0;
    let chunkIndex = 0;

    // Track logical sections in COBOL
    let currentSection = null;
    let sectionDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim().toUpperCase();

      // Detect logical boundaries in COBOL
      if (this.isLogicalBoundary(trimmedLine)) {
        if (currentChunk.length > 0 && currentChunk.length >= maxChunkSize * 0.5) {
          chunks.push(this.createChunk(
            chunkIndex++,
            currentChunk,
            currentOffset,
            path.basename(filePath),
            { section: currentSection, lineRange: [currentOffset, i] }
          ));

          // Start new chunk with overlap
          const overlapLines = this.getOverlapLines(currentChunk, overlap);
          currentChunk = overlapLines;
          currentOffset = Math.max(0, i - overlapLines.split('\n').length + 1);
        }

        currentSection = this.extractSectionName(trimmedLine);
      }

      currentChunk += line + '\n';

      // Force chunk if size limit reached
      if (currentChunk.length >= maxChunkSize) {
        chunks.push(this.createChunk(
          chunkIndex++,
          currentChunk,
          currentOffset,
          path.basename(filePath),
          { section: currentSection, lineRange: [currentOffset, i] }
        ));

        // Start new chunk with overlap
        const overlapLines = this.getOverlapLines(currentChunk, overlap);
        currentChunk = overlapLines;
        currentOffset = Math.max(0, i - overlapLines.split('\n').length + 1);
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(this.createChunk(
        chunkIndex,
        currentChunk,
        currentOffset,
        path.basename(filePath),
        { section: currentSection, lineRange: [currentOffset, lines.length - 1] }
      ));
    }

    return chunks;
  }

  /**
   * Chunk file by line boundaries (for data files)
   */
  async chunkByLines(filePath, maxChunkSize, overlap) {
    const content = await fs.promises.readFile(filePath, this.encoding);
    const lines = content.split('\n');
    const chunks = [];

    let currentChunk = '';
    let currentOffset = 0;
    let chunkIndex = 0;
    let lineStart = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] + '\n';

      // Check if adding this line would exceed chunk size
      if (currentChunk.length + line.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(this.createChunk(
          chunkIndex++,
          currentChunk,
          currentOffset,
          path.basename(filePath),
          { lineRange: [lineStart, i - 1] }
        ));

        // Calculate overlap
        const overlapLineCount = Math.floor(overlap / (currentChunk.length / (i - lineStart)));
        const newStart = Math.max(lineStart, i - overlapLineCount);

        currentChunk = lines.slice(newStart, i).join('\n') + '\n';
        currentOffset = content.substring(0, content.split('\n').slice(0, newStart).join('\n').length).length;
        lineStart = newStart;
      }

      currentChunk += line;
    }

    // Add final chunk
    if (currentChunk.trim().length > 0) {
      chunks.push(this.createChunk(
        chunkIndex,
        currentChunk,
        currentOffset,
        path.basename(filePath),
        { lineRange: [lineStart, lines.length - 1] }
      ));
    }

    return chunks;
  }

  /**
   * Chunk file by byte size (fallback method)
   */
  async chunkBySize(filePath, maxChunkSize, overlap) {
    const chunks = [];
    const fileHandle = await fs.promises.open(filePath, 'r');
    const stats = await fileHandle.stat();
    const fileSize = stats.size;

    let currentOffset = 0;
    let chunkIndex = 0;

    try {
      while (currentOffset < fileSize) {
        const actualChunkSize = Math.min(maxChunkSize, fileSize - currentOffset);
        const buffer = Buffer.alloc(actualChunkSize);

        const { bytesRead } = await fileHandle.read(buffer, 0, actualChunkSize, currentOffset);
        const text = buffer.slice(0, bytesRead).toString(this.encoding);

        chunks.push(this.createChunk(
          chunkIndex++,
          text,
          currentOffset,
          path.basename(filePath),
          { byteRange: [currentOffset, currentOffset + bytesRead] }
        ));

        // Move to next chunk with overlap
        currentOffset += Math.max(1, bytesRead - overlap);
      }
    } finally {
      await fileHandle.close();
    }

    return chunks;
  }

  /**
   * Create a standardized chunk object
   */
  createChunk(index, text, offset, fileName, metadata = {}) {
    const isFirst = index === 0;
    const chunk = {
      index,
      text: text.trim(),
      offset,
      length: text.length,
      metadata: {
        isFirstChunk: isFirst,
        isLastChunk: false, // Will be updated for the last chunk
        fileName,
        ...metadata
      }
    };

    return chunk;
  }

  /**
   * Check if a line represents a logical boundary in COBOL
   */
  isLogicalBoundary(line) {
    const boundaries = [
      'IDENTIFICATION DIVISION',
      'ENVIRONMENT DIVISION',
      'DATA DIVISION',
      'PROCEDURE DIVISION',
      'WORKING-STORAGE SECTION',
      'LINKAGE SECTION',
      'FILE SECTION',
      /\d{2,4}\s+\w+\s+SECTION/,
      /PERFORM\s+\w+/,
      /^\s*\w+\s+SECTION/,
      /^\s*END-/
    ];

    return boundaries.some(pattern => {
      if (typeof pattern === 'string') {
        return line.includes(pattern);
      } else {
        return pattern.test(line);
      }
    });
  }

  /**
   * Extract section name from a COBOL line
   */
  extractSectionName(line) {
    const sectionMatch = line.match(/(\w+)\s+(?:DIVISION|SECTION)/);
    return sectionMatch ? sectionMatch[1] : 'UNKNOWN';
  }

  /**
   * Get overlap lines from the end of current chunk
   */
  getOverlapLines(text, overlap) {
    const lines = text.split('\n');
    const overlapLineCount = Math.min(3, Math.floor(overlap / 50)); // Estimate
    return lines.slice(-overlapLineCount).join('\n') + '\n';
  }

  /**
   * Stream-based chunking for very large files
   */
  async *streamChunks(filePath, options = {}) {
    const {
      maxChunkSize = this.defaultMaxChunkSize,
      overlap = this.defaultOverlap
    } = options;

    const stream = fs.createReadStream(filePath, { encoding: this.encoding });
    let buffer = '';
    let chunkIndex = 0;
    let totalOffset = 0;

    for await (const data of stream) {
      buffer += data;

      while (buffer.length >= maxChunkSize) {
        const chunkEnd = buffer.lastIndexOf('\n', maxChunkSize);
        const actualEnd = chunkEnd > 0 ? chunkEnd : maxChunkSize;

        const chunkText = buffer.substring(0, actualEnd);

        yield this.createChunk(
          chunkIndex++,
          chunkText,
          totalOffset,
          path.basename(filePath)
        );

        const nextStart = Math.max(0, actualEnd - overlap);
        buffer = buffer.substring(nextStart);
        totalOffset += nextStart;
      }
    }

    // Yield remaining buffer as final chunk
    if (buffer.length > 0) {
      yield this.createChunk(
        chunkIndex,
        buffer,
        totalOffset,
        path.basename(filePath),
        { isLastChunk: true }
      );
    }
  }

  /**
   * Mark the last chunk in an array
   */
  markLastChunk(chunks) {
    if (chunks.length > 0) {
      chunks[chunks.length - 1].metadata.isLastChunk = true;
    }
    return chunks;
  }

  /**
   * Get chunk statistics
   */
  getChunkStats(chunks) {
    const sizes = chunks.map(chunk => chunk.length);
    return {
      totalChunks: chunks.length,
      totalSize: sizes.reduce((sum, size) => sum + size, 0),
      averageSize: Math.round(sizes.reduce((sum, size) => sum + size, 0) / sizes.length),
      minSize: Math.min(...sizes),
      maxSize: Math.max(...sizes),
      sizeDistribution: {
        small: sizes.filter(s => s < 1000).length,
        medium: sizes.filter(s => s >= 1000 && s < 3000).length,
        large: sizes.filter(s => s >= 3000).length
      }
    };
  }
}

// Create default instance
const chunker = new FileChunker();

// Export both the class and a default instance
module.exports = chunker;
module.exports.FileChunker = FileChunker;
