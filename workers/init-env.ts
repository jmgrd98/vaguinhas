import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Verify required environment variables
const requiredVars = ['REDIS_URL', 'EMAIL_USER', 'EMAIL_PASSWORD'];
requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`❌ Missing required environment variable: ${varName}`);
  }
});

console.log('✅ Environment variables loaded');