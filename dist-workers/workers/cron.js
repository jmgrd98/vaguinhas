import cron from 'node-cron';
import fetch from 'node-fetch';
// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
    try {
        const response = await fetch('http://localhost:3000/api/worker');
        const result = await response.json();
        console.log('Cron job result:', result);
    }
    catch (error) {
        console.error('Cron job failed:', error);
    }
});
console.log('⏰ Cron worker started');
