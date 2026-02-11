require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '9000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcareai',
  jwtSecret: process.env.JWT_SECRET || 'healthcareai-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  deepgramApiKey: process.env.DEEPGRAM_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
};
