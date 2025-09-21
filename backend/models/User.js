const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  language: {
    type: String,
    enum: [
      'en',    // English
      'hi',    // Hindi
      'mr',    // Marathi
      'bn',    // Bengali
      'te',    // Telugu
      'ta',    // Tamil
      'gu',    // Gujarati
      'kn',    // Kannada
      'ml',    // Malayalam
      'pa',    // Punjabi
      'or',    // Odia
      'as',    // Assamese
      'ur',    // Urdu
      'sa',    // Sanskrit
      'ne',    // Nepali
      'si',    // Sinhala
      'my'     // Myanmar
    ],
    default: 'en'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);