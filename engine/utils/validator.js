const logger = require('./logger');

class Validator {
  constructor() {
    this.sqlKeywords = new Set([
      'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER',
      'TABLE', 'INDEX', 'VIEW', 'DATABASE', 'SCHEMA', 'FROM', 'WHERE',
      'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'ON', 'GROUP', 'BY',
      'ORDER', 'HAVING', 'UNION', 'DISTINCT', 'AS', 'AND', 'OR', 'NOT',
      'IN', 'EXISTS', 'BETWEEN', 'LIKE', 'IS', 'NULL', 'PRIMARY', 'KEY',
      'FOREIGN', 'REFERENCES', 'UNIQUE', 'CHECK', 'DEFAULT', 'AUTO_INCREMENT'
    ]);
  }

  /**
   * Validate JSON syntax and structure
   * @param {string|object} json - JSON string or object to validate
   * @returns {object} Validation result
   */
  validateJSON(json) {
    const result = {
      valid: false,
      errors: [],
      warnings: [],
      confidence: 0
    };

    try {
      let parsedJson;

      // If string, try to parse it
      if (typeof json === 'string') {
        try {
          parsedJson = JSON.parse(json);
        } catch (parseError) {
          result.errors.push(`JSON Parse Error: ${parseError.message}`);
          result.confidence = 0.1;
          return result;
        }
      } else if (typeof json === 'object' && json !== null) {
        parsedJson = json;
      } else {
        result.errors.push('Invalid input: must be JSON string or object');
        result.confidence = 0.1;
        return result;
      }

      result.valid = true;
      result.confidence = 0.9;

      // Additional structural validation
      this.validateJSONStructure(parsedJson, result);

      logger.info('✅ JSON validation completed', {
        valid: result.valid,
        errors: result.errors.length,
        warnings: result.warnings.length,
        confidence: result.confidence
      });

    } catch (error) {
      result.errors.push(`Validation error: ${error.message}`);
      result.confidence = 0.1;
      logger.error('❌ JSON validation failed', { error: error.message });
    }

    return result;
  }

  /**
   * Validate JSON structure for specific schemas
   * @param {object} json - Parsed JSON object
   * @param {object} result - Result object to modify
   */
  validateJSONStructure(json, result) {
    // Check for common API response structure
    if (this.looksLikeAPIResponse(json)) {
      this.validateAPIResponseStructure(json, result);
    }

    // Check for schema-like structure
    if (this.looksLikeSchema(json)) {
      this.validateSchemaStructure(json, result);
    }

    // Check for configuration structure
    if (this.looksLikeConfig(json)) {
      this.validateConfigStructure(json, result);
    }

    // General warnings
    if (this.isDeepNested(json, 10)) {
      result.warnings.push('JSON structure is deeply nested (>10 levels)');
    }

    if (this.hasCircularReferences(json)) {
      result.warnings.push('Potential circular references detected');
    }
  }

  /**
   * Validate SQL syntax with basic checks
   * @param {string} sql - SQL string to validate
   * @returns {object} Validation result
   */
  validateSQL(sql) {
    const result = {
      valid: false,
      errors: [],
      warnings: [],
      confidence: 0,
      sqlType: 'unknown',
      tables: [],
      columns: []
    };

    try {
      if (typeof sql !== 'string' || !sql.trim()) {
        result.errors.push('SQL must be a non-empty string');
        return result;
      }

      const cleanSQL = sql.trim().replace(/\s+/g, ' ');
      const upperSQL = cleanSQL.toUpperCase();

      // Determine SQL type
      result.sqlType = this.determineSQLType(upperSQL);

      // Basic syntax checks
      this.performBasicSQLChecks(cleanSQL, upperSQL, result);

      // Advanced validation based on type
      switch (result.sqlType) {
        case 'CREATE_TABLE':
          this.validateCreateTable(cleanSQL, result);
          break;
        case 'SELECT':
          this.validateSelect(cleanSQL, result);
          break;
        case 'INSERT':
          this.validateInsert(cleanSQL, result);
          break;
        case 'UPDATE':
          this.validateUpdate(cleanSQL, result);
          break;
        case 'DELETE':
          this.validateDelete(cleanSQL, result);
          break;
      }

      // Extract entities
      result.tables = this.extractTables(cleanSQL);
      result.columns = this.extractColumns(cleanSQL);

      // Calculate confidence
      result.confidence = this.calculateSQLConfidence(result);
      result.valid = result.errors.length === 0;

      logger.info('✅ SQL validation completed', {
        sqlType: result.sqlType,
        valid: result.valid,
        errors: result.errors.length,
        warnings: result.warnings.length,
        confidence: result.confidence
      });

    } catch (error) {
      result.errors.push(`SQL validation error: ${error.message}`);
      result.confidence = 0.1;
      logger.error('❌ SQL validation failed', { error: error.message });
    }

    return result;
  }

  /**
   * Determine the type of SQL statement
   */
  determineSQLType(upperSQL) {
    if (upperSQL.startsWith('CREATE TABLE')) return 'CREATE_TABLE';
    if (upperSQL.startsWith('CREATE INDEX')) return 'CREATE_INDEX';
    if (upperSQL.startsWith('CREATE VIEW')) return 'CREATE_VIEW';
    if (upperSQL.startsWith('SELECT')) return 'SELECT';
    if (upperSQL.startsWith('INSERT')) return 'INSERT';
    if (upperSQL.startsWith('UPDATE')) return 'UPDATE';
    if (upperSQL.startsWith('DELETE')) return 'DELETE';
    if (upperSQL.startsWith('ALTER')) return 'ALTER';
    if (upperSQL.startsWith('DROP')) return 'DROP';
    return 'unknown';
  }

  /**
   * Perform basic SQL syntax checks
   */
  performBasicSQLChecks(sql, upperSQL, result) {
    // Check for balanced parentheses
    const openParens = (sql.match(/\(/g) || []).length;
    const closeParens = (sql.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      result.errors.push(`Unbalanced parentheses: ${openParens} open, ${closeParens} close`);
    }

    // Check for balanced quotes
    const singleQuotes = (sql.match(/'/g) || []).length;
    const doubleQuotes = (sql.match(/"/g) || []).length;
    if (singleQuotes % 2 !== 0) {
      result.errors.push('Unbalanced single quotes');
    }
    if (doubleQuotes % 2 !== 0) {
      result.errors.push('Unbalanced double quotes');
    }

    // Check for semicolon termination (warning)
    if (!sql.trim().endsWith(';')) {
      result.warnings.push('SQL statement should end with semicolon');
    }

    // Check for SQL injection patterns (basic)
    this.checkForSQLInjectionPatterns(sql, result);

    // Check for deprecated patterns
    this.checkForDeprecatedPatterns(upperSQL, result);
  }

  /**
   * Validate CREATE TABLE statements
   */
  validateCreateTable(sql, result) {
    const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"]?\w+[`"]?)\s*\((.*)\)/is;
    const match = sql.match(createTableRegex);

    if (!match) {
      result.errors.push('Invalid CREATE TABLE syntax');
      return;
    }

    const tableName = match[1];
    const columnsSection = match[2];

    // Validate table name
    if (!this.isValidIdentifier(tableName.replace(/[`"]/g, ''))) {
      result.errors.push(`Invalid table name: ${tableName}`);
    }

    // Validate columns
    this.validateTableColumns(columnsSection, result);

    // Check for primary key
    if (!columnsSection.toUpperCase().includes('PRIMARY KEY')) {
      result.warnings.push('Table should have a primary key');
    }
  }

  /**
   * Validate table column definitions
   */
  validateTableColumns(columnsSection, result) {
    const columns = this.parseColumns(columnsSection);

    if (columns.length === 0) {
      result.errors.push('Table must have at least one column');
      return;
    }

    columns.forEach((column, index) => {
      const parts = column.trim().split(/\s+/);
      if (parts.length < 2) {
        result.errors.push(`Column ${index + 1}: Invalid column definition`);
        return;
      }

      const columnName = parts[0].replace(/[`"]/g, '');
      const dataType = parts[1].toUpperCase();

      // Validate column name
      if (!this.isValidIdentifier(columnName)) {
        result.errors.push(`Column ${index + 1}: Invalid column name '${columnName}'`);
      }

      // Validate data type
      if (!this.isValidDataType(dataType)) {
        result.warnings.push(`Column ${index + 1}: Unusual data type '${dataType}'`);
      }
    });
  }

  /**
   * Parse column definitions from CREATE TABLE
   */
  parseColumns(columnsSection) {
    const columns = [];
    let currentColumn = '';
    let parenLevel = 0;

    for (let i = 0; i < columnsSection.length; i++) {
      const char = columnsSection[i];

      if (char === '(') parenLevel++;
      if (char === ')') parenLevel--;

      if (char === ',' && parenLevel === 0) {
        if (currentColumn.trim()) {
          columns.push(currentColumn.trim());
        }
        currentColumn = '';
      } else {
        currentColumn += char;
      }
    }

    if (currentColumn.trim()) {
      columns.push(currentColumn.trim());
    }

    return columns.filter(col =>
      !col.toUpperCase().includes('PRIMARY KEY') &&
      !col.toUpperCase().includes('FOREIGN KEY') &&
      !col.toUpperCase().includes('CONSTRAINT')
    );
  }

  /**
   * Check if identifier is valid
   */
  isValidIdentifier(name) {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
  }

  /**
   * Check if data type is valid
   */
  isValidDataType(type) {
    const validTypes = new Set([
      'INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT',
      'VARCHAR', 'CHAR', 'TEXT', 'LONGTEXT', 'MEDIUMTEXT',
      'DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE', 'REAL',
      'DATE', 'TIME', 'DATETIME', 'TIMESTAMP', 'YEAR',
      'BOOLEAN', 'BOOL', 'BIT',
      'BLOB', 'LONGBLOB', 'MEDIUMBLOB', 'TINYBLOB',
      'JSON', 'UUID', 'ENUM', 'SET'
    ]);

    // Extract base type (remove size specifiers)
    const baseType = type.split('(')[0];
    return validTypes.has(baseType);
  }

  /**
   * Extract table names from SQL
   */
  extractTables(sql) {
    const tables = new Set();
    const patterns = [
      /FROM\s+([`"]?\w+[`"]?)/gi,
      /JOIN\s+([`"]?\w+[`"]?)/gi,
      /UPDATE\s+([`"]?\w+[`"]?)/gi,
      /INTO\s+([`"]?\w+[`"]?)/gi,
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"]?\w+[`"]?)/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(sql)) !== null) {
        tables.add(match[1].replace(/[`"]/g, ''));
      }
    });

    return Array.from(tables);
  }

  /**
   * Extract column names from SQL
   */
  extractColumns(sql) {
    const columns = new Set();

    // Simple extraction - would need more sophisticated parsing for real use
    const selectMatch = sql.match(/SELECT\s+(.*?)\s+FROM/is);
    if (selectMatch) {
      const selectClause = selectMatch[1];
      if (!selectClause.includes('*')) {
        selectClause.split(',').forEach(col => {
          const cleanCol = col.trim().replace(/[`"]/g, '').split(/\s+/)[0];
          if (cleanCol && this.isValidIdentifier(cleanCol)) {
            columns.add(cleanCol);
          }
        });
      }
    }

    return Array.from(columns);
  }

  /**
   * Check for SQL injection patterns
   */
  checkForSQLInjectionPatterns(sql, result) {
    const suspiciousPatterns = [
      /union\s+select/i,
      /'\s*or\s*'1'\s*=\s*'1/i,
      /;\s*drop\s+table/i,
      /;\s*delete\s+from/i,
      /exec\s*\(/i,
      /script\s*>/i
    ];

    suspiciousPatterns.forEach(pattern => {
      if (pattern.test(sql)) {
        result.warnings.push('Potential SQL injection pattern detected');
      }
    });
  }

  /**
   * Check for deprecated SQL patterns
   */
  checkForDeprecatedPatterns(sql, result) {
    if (sql.includes('ISAM')) {
      result.warnings.push('ISAM storage engine is deprecated');
    }
    if (sql.includes('TYPE=')) {
      result.warnings.push('TYPE= syntax is deprecated, use ENGINE= instead');
    }
  }

  /**
   * Calculate SQL validation confidence
   */
  calculateSQLConfidence(result) {
    let confidence = 0.5; // Base confidence

    // Boost for recognized SQL type
    if (result.sqlType !== 'unknown') confidence += 0.2;

    // Boost for finding tables and columns
    if (result.tables.length > 0) confidence += 0.1;
    if (result.columns.length > 0) confidence += 0.1;

    // Penalty for errors
    confidence -= result.errors.length * 0.2;

    // Small penalty for warnings
    confidence -= result.warnings.length * 0.05;

    return Math.max(0.1, Math.min(confidence, 0.95));
  }

  /**
   * Validate SELECT statements
   */
  validateSelect(sql, result) {
    if (!sql.toUpperCase().includes('FROM') && !sql.toUpperCase().includes('DUAL')) {
      result.warnings.push('SELECT statement should typically include FROM clause');
    }
  }

  /**
   * Validate INSERT statements
   */
  validateInsert(sql, result) {
    if (!sql.toUpperCase().includes('VALUES') && !sql.toUpperCase().includes('SELECT')) {
      result.errors.push('INSERT statement must include VALUES or SELECT clause');
    }
  }

  /**
   * Validate UPDATE statements
   */
  validateUpdate(sql, result) {
    if (!sql.toUpperCase().includes('SET')) {
      result.errors.push('UPDATE statement must include SET clause');
    }
    if (!sql.toUpperCase().includes('WHERE')) {
      result.warnings.push('UPDATE without WHERE clause affects all rows');
    }
  }

  /**
   * Validate DELETE statements
   */
  validateDelete(sql, result) {
    if (!sql.toUpperCase().includes('WHERE')) {
      result.warnings.push('DELETE without WHERE clause removes all rows');
    }
  }

  // JSON Structure validation helpers
  looksLikeAPIResponse(json) {
    return json && (json.hasOwnProperty('data') || json.hasOwnProperty('status') || json.hasOwnProperty('message'));
  }

  looksLikeSchema(json) {
    return json && (json.hasOwnProperty('type') || json.hasOwnProperty('properties') || json.hasOwnProperty('$schema'));
  }

  looksLikeConfig(json) {
    return json && (json.hasOwnProperty('config') || json.hasOwnProperty('settings') || json.hasOwnProperty('options'));
  }

  validateAPIResponseStructure(json, result) {
    if (!json.hasOwnProperty('status') && !json.hasOwnProperty('success')) {
      result.warnings.push('API response should include status or success field');
    }
  }

  validateSchemaStructure(json, result) {
    if (json.type && !['object', 'array', 'string', 'number', 'boolean', 'null'].includes(json.type)) {
      result.warnings.push(`Unknown schema type: ${json.type}`);
    }
  }

  validateConfigStructure(json, result) {
    // Basic config validation
    if (typeof json !== 'object') {
      result.warnings.push('Configuration should be an object');
    }
  }

  isDeepNested(obj, maxDepth, currentDepth = 0) {
    if (currentDepth > maxDepth) return true;
    if (typeof obj !== 'object' || obj === null) return false;

    return Object.values(obj).some(value =>
      this.isDeepNested(value, maxDepth, currentDepth + 1)
    );
  }

  hasCircularReferences(obj, seen = new WeakSet()) {
    if (typeof obj !== 'object' || obj === null) return false;
    if (seen.has(obj)) return true;

    seen.add(obj);
    const hasCircular = Object.values(obj).some(value =>
      this.hasCircularReferences(value, seen)
    );
    seen.delete(obj);

    return hasCircular;
  }

  /**
   * Validate code quality metrics
   */
  validateQualityMetrics(metrics) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      confidence: 0.8
    };

    const requiredFields = ['complexity', 'maintainability', 'testability'];
    const validValues = ['low', 'medium', 'high'];

    requiredFields.forEach(field => {
      if (!metrics.hasOwnProperty(field)) {
        result.errors.push(`Missing required field: ${field}`);
      } else if (!validValues.includes(metrics[field])) {
        result.errors.push(`Invalid value for ${field}: ${metrics[field]}`);
      }
    });

    result.valid = result.errors.length === 0;
    return result;
  }

  /**
   * Comprehensive validation for modernization results
   */
  validateModernizationResult(modernizationData) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      confidence: 0
    };

    // Validate schema
    if (modernizationData.schema) {
      const schemaValidation = this.validateJSON(modernizationData.schema);
      result.errors.push(...schemaValidation.errors);
      result.warnings.push(...schemaValidation.warnings);
    }

    // Validate API design
    if (modernizationData.apiDesign) {
      const apiValidation = this.validateJSON(modernizationData.apiDesign);
      result.errors.push(...apiValidation.errors);
      result.warnings.push(...apiValidation.warnings);
    }

    // Validate SQL if present
    if (modernizationData.sql) {
      const sqlValidation = this.validateSQL(modernizationData.sql);
      result.errors.push(...sqlValidation.errors);
      result.warnings.push(...sqlValidation.warnings);
    }

    result.valid = result.errors.length === 0;
    result.confidence = this.calculateOverallConfidence(result);

    return result;
  }

  calculateOverallConfidence(result) {
    let confidence = 0.8;
    confidence -= result.errors.length * 0.2;
    confidence -= result.warnings.length * 0.05;
    return Math.max(0.1, Math.min(confidence, 0.95));
  }
}

module.exports = new Validator();