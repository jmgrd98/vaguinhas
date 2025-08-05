import { Queue } from "bullmq";
import { getRedisConnection } from "./redis.ts";

// Use a singleton pattern with lazy initialization
let emailQueue: Queue | null = null;

export function getEmailQueue(): Queue {
  if (process.env.NEXT_RUNTIME === 'edge') {
    throw new Error('BullMQ queues are not compatible with Edge runtime');
  }
  
  if (!emailQueue) {
    emailQueue = new Queue("emailQueue", {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    });
  }
  return emailQueue;
}