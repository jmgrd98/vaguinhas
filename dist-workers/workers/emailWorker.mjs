import { emailQueue } from '../lib/queue';
import { sendSupportUsEmail } from '../lib/email.js';
console.log('🚀 Email worker started and listening for jobs...');
// Log when new jobs are added to the queue
emailQueue.on('global:added', (jobId) => {
    console.log(`🆕 New job added to queue: ${jobId}`);
});
emailQueue.on('global:waiting', (jobId) => {
    console.log(`⏳ Job ${jobId} is waiting to be processed`);
});
// Process support-email jobs
emailQueue.process('support-email', async (job) => {
    const { to } = job.data;
    console.log(`📨 Processing job ${job.id} for: ${to}`);
    try {
        await sendSupportUsEmail(to);
        console.log(`✅ Job ${job.id} completed - Support email sent to: ${to}`);
        return { status: 'success' };
    }
    catch (error) {
        console.error(`❌ Job ${job.id} failed for ${to}:`, error);
        throw error;
    }
});
// Event listeners for job lifecycle
emailQueue.on('active', (job) => {
    console.log(`⚡ Job ${job.id} is now active`);
});
emailQueue.on('completed', (job, result) => {
    console.log(`🏁 Job ${job.id} completed with result:`, result);
});
emailQueue.on('failed', (job, error) => {
    if (job) {
        console.error(`🔥 Job ${job.id} failed:`, error);
    }
    else {
        console.error('🔥 Unknown job failed:', error);
    }
});
emailQueue.on('error', (error) => {
    console.error('🚨 Queue error:', error);
});
emailQueue.on('stalled', (job) => {
    console.warn(`⚠️ Job ${job.id} stalled and will be reprocessed`);
});
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down worker gracefully...');
    const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));
    try {
        await Promise.race([
            emailQueue.close(),
            timeout(5000)
        ]);
        console.log('✅ Queue closed successfully');
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.message === 'Timeout') {
                console.error('❌ Queue did not close within the specified timeout');
            }
            else {
                console.error('❌ Error closing queue:', error);
            }
        }
        else {
            console.error('❌ Unknown error:', error);
        }
    }
    process.exit(0);
});
// Periodic queue status logging
setInterval(async () => {
    try {
        const counts = await emailQueue.getJobCounts();
        console.log('📊 Queue status:', JSON.stringify(counts));
    }
    catch (error) {
        console.error('❌ Error fetching queue status:', error);
    }
}, 60000); // Every 60 seconds
console.log('👂 Listening for "support-email" jobs...');
