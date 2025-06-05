import Bull from 'bull';

const queue = new Bull('email-queue', process.env.REDIS_URL || 'redis://localhost:6379', {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 50,
    removeOnFail: 100
  },
});

// Export as both default and named export
export default queue;
export const emailQueue = queue;