import { config } from 'dotenv';

// Load environment variables once
const envLoaded = config({ path: '.env' });
if (envLoaded.error) {
  console.error('❌ Error loading .env.local:', envLoaded.error);
} else {
  console.log('✅ Environment variables loaded from .env.local');
}

// Validate required variables
const requiredVars = ['REDIS_URL', 'SMTP_HOST', 'EMAIL_FROM'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

// Export validated environment
export const ENV = {
  REDIS_URL: process.env.REDIS_URL!,
  SMTP_HOST: process.env.SMTP_HOST!,
  EMAIL_FROM: process.env.EMAIL_FROM!,
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_SECURE: process.env.SMTP_SECURE || false,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
};