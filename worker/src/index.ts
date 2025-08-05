import { config } from 'dotenv';
import { Worker, Job } from 'bullmq'; // Import Job type
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

// Define job data types
interface FeedbackEmailJobData {
  email: string;
}

interface ConfirmReminderJobData {
  email: string;
  token: string;
}

interface GenericEmailJobData {
  email: string;
}

type EmailJobData = FeedbackEmailJobData | ConfirmReminderJobData | GenericEmailJobData;

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
const worker = new Worker('emailQueue', async (job: Job<EmailJobData>) => {
  try {
    console.log(`📨 Processing job ${job.id} [${job.name}]`);
    
    console.log('JOB NAME', job.name);
    console.log('JOB DATA', job.data);
    
    switch (job.name) {
      case 'feedback-email':
        await sendFeedbackEmail((job.data as FeedbackEmailJobData).email);
        break;
        
      case 'confirm-reminder':
        const confirmData = job.data as ConfirmReminderJobData;
        await sendConfirmEmailReminder(confirmData.email, confirmData.token);
        break;

      case 'new-update':
        await sendNewUpdateEmail((job.data as GenericEmailJobData).email);
        break;

      case 'favourite-on-github':
        await sendFavouriteOnGithubEmail((job.data as GenericEmailJobData).email);
        break;

      case 'support-us':
        await sendSupportUsEmail((job.data as GenericEmailJobData).email);
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

// Event handlers with proper typing
worker.on('ready', () => console.log('✅ Worker ready'));
worker.on('active', (job: Job) => console.log(`🔨 Job ${job.id} started`));
worker.on('completed', (job: Job) => console.log(`🏆 Job ${job.id} completed`));
worker.on('failed', (job: Job | undefined, err: Error) => {
  if (job) {
    console.error(`💥 Job ${job.id} failed:`, err.message);
  } else {
    console.error('💥 Job failed:', err.message);
  }
});
worker.on('error', (err: Error) => console.error('🚨 Worker error:', err));

// Graceful shutdown
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

async function shutdown(signal: string) {
  console.log(`🛑 Received ${signal} - closing worker`);
  try {
    await worker.close();
    console.log('👋 Worker closed gracefully');
    process.exit(0);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('❌ Error closing worker:', error.message);
    process.exit(1);
  }
}