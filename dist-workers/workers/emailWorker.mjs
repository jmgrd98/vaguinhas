import { emailQueue } from '../lib/queue.mjs';
import { sendSupportUsEmail } from '../lib/email.js';
console.log('🚀 Email worker started');
emailQueue.process('support-email', async (job) => {
    const { to } = job.data;
    console.log(`📨 Processing support email job for: ${to}`);
    try {
        await sendSupportUsEmail(to);
        console.log(`✅ Support email sent to: ${to}`);
    }
    catch (error) {
        console.error(`❌ Failed to send support email to ${to}:`, error);
        throw error;
    }
});
// Event listeners
emailQueue.on('completed', (job) => {
    console.log(`🏁 Job ${job.id} completed`);
});
emailQueue.on('failed', (job, error) => {
    console.error(`🔥 Job ${job?.id} failed:`, error);
});
emailQueue.on('error', (error) => {
    console.error('🚨 Queue error:', error);
});
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down worker...');
    await emailQueue.close();
    process.exit(0);
});
