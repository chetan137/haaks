const winston = require('winston');
const path = require('path');

// Create logger configuration
const logConfiguration = {
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message} ${
        Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
      }`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '..', process.env.LOG_FILE || 'engine.log')
    })
  ]
};

const logger = winston.createLogger(logConfiguration);

// Pipeline-specific logging methods
logger.pipeline = {
  start: (agentName, input) => {
    logger.info(`🚀 Starting ${agentName}`, {
      agent: agentName,
      inputSize: JSON.stringify(input).length
    });
  },

  success: (agentName, output, confidence) => {
    logger.info(`✅ ${agentName} completed successfully`, {
      agent: agentName,
      confidence,
      outputSize: JSON.stringify(output).length
    });
  },

  error: (agentName, error, attempt) => {
    logger.error(`❌ ${agentName} failed`, {
      agent: agentName,
      error: error.message,
      attempt
    });
  },

  retry: (agentName, attempt, maxAttempts) => {
    logger.warn(`🔄 Retrying ${agentName}`, {
      agent: agentName,
      attempt,
      maxAttempts
    });
  },

  workflow: (step, data) => {
    logger.info(`🔧 Workflow step: ${step}`, data);
  }
};

module.exports = logger;