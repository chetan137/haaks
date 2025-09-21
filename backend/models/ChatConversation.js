const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'voice'],
    default: 'text'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  language: {
    type: String,
    default: 'en'
  },
  voiceData: {
    audioUrl: String,
    duration: Number,
    transcript: String
  }
});

const chatConversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    default: 'Health Consultation'
  },
  messages: [messageSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  healthContext: {
    primaryConcern: String,
    symptoms: [String],
    duration: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    }
  },
  language: {
    type: String,
    default: 'en'
  },
  metadata: {
    userAgent: String,
    deviceType: String,
    ipAddress: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
chatConversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
chatConversationSchema.index({ userId: 1, createdAt: -1 });
chatConversationSchema.index({ sessionId: 1 });
chatConversationSchema.index({ isActive: 1 });

module.exports = mongoose.model('ChatConversation', chatConversationSchema);