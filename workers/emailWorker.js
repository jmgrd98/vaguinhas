// workers/emailWorker.ts
const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const { sendNewUpdateEmail } = require("../lib/email");
const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379');

const worker = new Worker(
  "emailQueue",
  async job => {
    const { email } = job.data;
    await sendNewUpdateEmail(email);
  },
  { 
    connection,
    concurrency: 5, // Process 5 emails concurrently
    limiter: { max: 10, duration: 1000 } // Max 10 emails/sec
  }
);

worker.on("completed", job => {
  console.log(`Email sent to ${job.data.email}`);
});

worker.on("failed", (job, err) => {
  console.error(`Failed to send to ${job?.data.email}:`, err);
});