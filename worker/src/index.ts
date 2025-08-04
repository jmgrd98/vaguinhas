import { config } from 'dotenv';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { 
  sendFeedbackEmail,
  sendConfirmEmailReminder,
  sendNewUpdateEmail,
  sendFavouriteOnGithubEmail,
  sendSupportUsEmail
 } from './email';

// Load environment variables FIRST
config({ path: '.env' });

function createRedisConnection() {

  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL is not defined');
  }
  
  return new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    tls: process.env.REDIS_URL?.startsWith('rediss://') ? {} : undefined,
  });
}

console.log('👷 Starting email worker...');
const worker = new Worker('emailQueue', async (job) => {
  try {
    console.log(`📨 Processing job ${job.id} [${job.name}]`);
    
    // Validate job type exists
    // if (!job.data.jobType) {
    //   throw new Error(`Job ${job.id} missing jobType property`);
    // }
    console.log('JOB NAME', job.name);
    console.log('JOB TYPE', job.data.jobType);
   // In worker, change to:
  switch (job.name) {  // Use job.name instead of job.data.jobType
    case 'feedback-email':
      await sendFeedbackEmail(job.data.email);
      break;
      
    case 'confirm-reminder':
      await sendConfirmEmailReminder(job.data.email, job.data.token);
      break;

    case 'new-update':
      await sendNewUpdateEmail(job.data.email);
      break;

    case 'favourite-on-github':
      await sendFavouriteOnGithubEmail(job.data.email);
      break;

    case 'support-us':
      await sendSupportUsEmail(job.data.email);
      break;
    
    
    
      
    default:
      throw new Error(`Unknown job type: ${job.name}`);
  }
    
    console.log(`✅ Completed job ${job.id}`);
    return { status: 'success' };
  } catch (error) {
    console.error(`❌ Job ${job.id} failed:`, error instanceof Error ? error.message : String(error));
    throw error;
  }
}, {
  connection: createRedisConnection(),
  concurrency: 10,
});

// Event handlers
worker.on('ready', () => console.log('✅ Worker ready'));
worker.on('active', (job) => console.log(`🔨 Job ${job.id} started`));
worker.on('completed', (job) => console.log(`🏆 Job ${job.id} completed`));
worker.on('failed', (job, err) => 
  console.error(`💥 Job ${job?.id} failed:`, err.message));
worker.on('error', (err) => console.error('🚨 Worker error:', err));

// Graceful shutdown
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

async function shutdown(signal: string) {
  console.log(`🛑 Received ${signal} - closing worker`);
  try {
    await worker.close();
    console.log('👋 Worker closed gracefully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error closing worker:', err);
    process.exit(1);
  }
}