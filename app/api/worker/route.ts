// app/api/worker/route.ts
import { NextResponse } from 'next/server.js';
import { emailQueue } from '../../../lib/queue.mjs';
import { sendSupportUsEmail } from '../../../lib/email.js';
import { Job } from 'bull';

export async function GET() {
  try {
    // Process pending jobs
    const counts = await emailQueue.getJobCounts();
    const pendingJobs = counts.waiting + counts.delayed;
    
    if (pendingJobs > 0) {
        // Process jobs
        emailQueue.process('support-email', async (job: Job) => {
            const { to } = job.data;
            await sendSupportUsEmail(to);
        });
        
        // Force immediate processing
        const jobs = await emailQueue.getJobs(['waiting', 'delayed'], 0, 10);
        jobs.forEach((job: Job) => {
            console.log('JOB:', job);
            emailQueue.process('support-email', async (job: Job) => {
            const { to } = job.data;
            await sendSupportUsEmail(to);
            });
        });
        
        return NextResponse.json({
            processed: pendingJobs,
            status: 'success'
        });
    }
    
    return NextResponse.json({
      processed: 0,
      status: 'no_jobs'
    });
  } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json(
            { error: error.message },
            { status: 500 }
            );
        } else {
            // Handle unknown error type
        }
    }
}