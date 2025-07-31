// api/worker.ts
import { getRedisConnection } from '@/lib/redis';
import { Worker } from 'bullmq';
import { sendFeedbackEmail } from '@/lib/email';

export const config = {
  runtime: 'edge',
  maxDuration: 300, // 5 minutes (max allowed)
};

export default async function worker() {
  const redis = getRedisConnection();
  
  const worker = new Worker('emailQueue', async (job) => {
    try {
      console.log(`Processing job ${job.id} - ${job.data.email}`);
      await sendFeedbackEmail(job.data.email);
      console.log(`Sent email to ${job.data.email}`);
    } catch (error) {
      console.error(`Failed to send to ${job.data.email}:`, error);
      throw error;
    }
  }, {
    connection: redis,
    concurrency: 10,
  });
  
  await worker.run();

  // Keep the worker alive
  return new Response('Worker running', { status: 200 });
}